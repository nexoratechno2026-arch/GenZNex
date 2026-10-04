/**
 * GenZNex Phase 6: Gamification Engine
 * Server-side XP awarding, deterministic idempotency, daily streaks (Asia/Kolkata),
 * level calculation, badges, and top-N leaderboard snapshots.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Helpers & Date Utilities (Asia/Kolkata Timezone)
// ---------------------------------------------------------------------------

export function getTodayIST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getYesterdayIST(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function getCurrentWeekIST(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

export const LEVEL_TIERS = [
  { level: 1, name: "Rookie", minXp: 0 },
  { level: 2, name: "Explorer", minXp: 200 },
  { level: 3, name: "Achiever", minXp: 600 },
  { level: 4, name: "Pro", minXp: 1500 },
  { level: 5, name: "Legend", minXp: 3500 },
];

export function calculateLevelFromXp(totalXp: number): { level: number; name: string; xpToNextLevel: number } {
  let currentTier = LEVEL_TIERS[0];
  let nextTier = LEVEL_TIERS[1];

  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_TIERS[i].minXp) {
      currentTier = LEVEL_TIERS[i];
      nextTier = LEVEL_TIERS[i + 1] || null;
      break;
    }
  }

  const xpToNextLevel = nextTier ? Math.max(0, nextTier.minXp - totalXp) : 0;
  return {
    level: currentTier.level,
    name: currentTier.name,
    xpToNextLevel,
  };
}

// Default XP rules in case Firestore config is empty
export const DEFAULT_XP_RULES: Record<string, number> = {
  lesson_completed: 20,
  module_completed: 50,
  quiz_passed: 50,
  quiz_perfect: 100,
  assignment_passed: 100,
  session_attended: 40,
  project_approved: 300,
  course_completed: 500,
  review_posted: 30,
  forum_answer_accepted: 75,
  daily_login: 10,
};

export const DEFAULT_DAILY_CAPS: Record<string, number> = {
  lesson_completed: 200, // max 10 lessons/day awarded
  daily_login: 10,
  forum_answer_accepted: 150,
};

// ---------------------------------------------------------------------------
// Core Server-Side awardXp Engine
// ---------------------------------------------------------------------------

export interface AwardXpResult {
  success: boolean;
  xpAwarded: number;
  totalXp: number;
  level: number;
  levelName: string;
  leveledUp: boolean;
  streak: number;
  badgesUnlocked: string[];
  alreadyAwarded?: boolean;
  capped?: boolean;
}

export async function awardXp(
  userId: string,
  eventType: string,
  refId: string,
  metadata?: Record<string, unknown>
): Promise<AwardXpResult> {
  const ledgerId = `${userId}_${eventType}_${refId}`;
  const ledgerRef = db.collection("xp_ledger").doc(ledgerId);
  const profileRef = db.collection("users").doc(userId).collection("gamification").doc("profile");
  const todayIST = getTodayIST();
  const yesterdayIST = getYesterdayIST();
  const currentWeekIST = getCurrentWeekIST();

  // Read config
  const configSnap = await db.collection("config").doc("gamification").get();
  const configData = configSnap.data();
  const xpRules = configData?.xpRules || DEFAULT_XP_RULES;
  const dailyCaps = configData?.dailyCaps || DEFAULT_DAILY_CAPS;

  const basePoints = xpRules[eventType] ?? 10;
  const dailyCap = dailyCaps[eventType];

  return await db.runTransaction(async (tx) => {
    // 1. Idempotency Check: if ledger document exists, return early
    const ledgerSnap = await tx.get(ledgerRef);
    if (ledgerSnap.exists) {
      const existingProfile = await tx.get(profileRef);
      const profileData = existingProfile.data() || {};
      const { level, name } = calculateLevelFromXp(profileData.totalXp || 0);
      return {
        success: true,
        xpAwarded: 0,
        totalXp: profileData.totalXp || 0,
        level,
        levelName: name,
        leveledUp: false,
        streak: profileData.currentStreak || 0,
        badgesUnlocked: [],
        alreadyAwarded: true,
      };
    }

    // 2. Daily Cap Check
    let pointsToAward = basePoints;
    let isCapped = false;

    if (dailyCap !== undefined) {
      // Query today's earned points for this eventType
      const todayLedgerSnap = await tx.get(
        db.collection("xp_ledger")
          .where("userId", "==", userId)
          .where("eventType", "==", eventType)
          .where("dateIST", "==", todayIST)
      );

      let todayEarned = 0;
      todayLedgerSnap.forEach((doc) => {
        todayEarned += doc.data().xpAwarded || 0;
      });

      if (todayEarned >= dailyCap) {
        pointsToAward = 0;
        isCapped = true;
      } else if (todayEarned + pointsToAward > dailyCap) {
        pointsToAward = dailyCap - todayEarned;
        isCapped = true;
      }
    }

    // 3. Read & Update User Gamification Profile
    const profileSnap = await tx.get(profileRef);
    const prevProfile = profileSnap.exists
      ? profileSnap.data() || {}
      : {
          userId,
          totalXp: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: "",
          streakFreezesRemaining: 1,
          streakFreezeLastGrantedWeek: currentWeekIST,
          leaderboardOptOut: false,
          earnedBadgeIds: [],
        };

    const prevXp = prevProfile.totalXp || 0;
    const newTotalXp = prevXp + pointsToAward;

    const prevLevelInfo = calculateLevelFromXp(prevXp);
    const newLevelInfo = calculateLevelFromXp(newTotalXp);
    const leveledUp = newLevelInfo.level > prevLevelInfo.level;

    // 4. Streak Calculation
    let currentStreak = prevProfile.currentStreak || 0;
    let longestStreak = prevProfile.longestStreak || 0;
    const lastActiveDate = prevProfile.lastActiveDate || "";
    let streakFreezes = prevProfile.streakFreezesRemaining ?? 1;
    let lastGrantedWeek = prevProfile.streakFreezeLastGrantedWeek || currentWeekIST;

    // Weekly refresh of streak freeze
    if (lastGrantedWeek !== currentWeekIST) {
      streakFreezes = Math.min(2, streakFreezes + 1);
      lastGrantedWeek = currentWeekIST;
    }

    // Only qualifying events extend streaks
    const isQualifyingEvent = ["lesson_completed", "quiz_passed", "session_attended"].includes(eventType);
    if (isQualifyingEvent) {
      if (!lastActiveDate) {
        currentStreak = 1;
      } else if (lastActiveDate === todayIST) {
        // Already active today; streak maintained
      } else if (lastActiveDate === yesterdayIST) {
        // Consecutive day activity!
        currentStreak += 1;
      } else {
        // Inactivity detected. Check streak freeze protection for 2-day gap
        const diffMs = new Date(todayIST).getTime() - new Date(lastActiveDate).getTime();
        const diffDays = Math.round(diffMs / (1000 * 3600 * 24));

        if (diffDays === 2 && streakFreezes > 0) {
          streakFreezes -= 1; // Used 1 freeze to save streak
          currentStreak += 1;
        } else {
          currentStreak = 1; // Streak reset
        }
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    }

    // 5. Badge Unlocks Check
    const earnedBadgeIds: string[] = prevProfile.earnedBadgeIds || [];
    const newBadges: string[] = [];

    // Rule: First Lesson
    if (eventType === "lesson_completed" && !earnedBadgeIds.includes("badge_first_lesson")) {
      newBadges.push("badge_first_lesson");
    }
    // Rule: Module Master
    if (eventType === "module_completed" && !earnedBadgeIds.includes("badge_module_master")) {
      newBadges.push("badge_module_master");
    }
    // Rule: 7-Day Streak
    if (currentStreak >= 7 && !earnedBadgeIds.includes("badge_streak_7")) {
      newBadges.push("badge_streak_7");
    }
    // Rule: 30-Day Streak
    if (currentStreak >= 30 && !earnedBadgeIds.includes("badge_streak_30")) {
      newBadges.push("badge_streak_30");
    }
    // Rule: Perfect Score
    if (eventType === "quiz_perfect" && !earnedBadgeIds.includes("badge_perfect_score")) {
      newBadges.push("badge_perfect_score");
    }
    // Rule: Project Pro
    if (eventType === "project_approved" && !earnedBadgeIds.includes("badge_project_pro")) {
      newBadges.push("badge_project_pro");
    }
    // Rule: Course Completer
    if (eventType === "course_completed" && !earnedBadgeIds.includes("badge_course_completer")) {
      newBadges.push("badge_course_completer");
    }
    // Rule: Helper
    if (eventType === "forum_answer_accepted" && !earnedBadgeIds.includes("badge_forum_helper")) {
      newBadges.push("badge_forum_helper");
    }

    const updatedBadgeIds = [...earnedBadgeIds, ...newBadges];

    // 6. Write Ledger Document (Immutable)
    tx.set(ledgerRef, {
      id: ledgerId,
      userId,
      eventType,
      refId,
      xpAwarded: pointsToAward,
      metadata: metadata || null,
      dateIST: todayIST,
      awardedAt: FieldValue.serverTimestamp(),
    });

    // 7. Write Gamification Profile
    tx.set(
      profileRef,
      {
        userId,
        totalXp: newTotalXp,
        currentLevel: newLevelInfo.level,
        levelName: newLevelInfo.name,
        xpToNextLevel: newLevelInfo.xpToNextLevel,
        currentStreak,
        longestStreak,
        lastActiveDate: isQualifyingEvent ? todayIST : lastActiveDate,
        streakFreezesRemaining: streakFreezes,
        streakFreezeLastGrantedWeek: lastGrantedWeek,
        leaderboardOptOut: prevProfile.leaderboardOptOut ?? false,
        earnedBadgeIds: updatedBadgeIds,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      xpAwarded: pointsToAward,
      totalXp: newTotalXp,
      level: newLevelInfo.level,
      levelName: newLevelInfo.name,
      leveledUp,
      streak: currentStreak,
      badgesUnlocked: newBadges,
      capped: isCapped,
    };
  });
}

// ---------------------------------------------------------------------------
// Callable Functions
// ---------------------------------------------------------------------------

/**
 * Opt in or out of public leaderboard display
 */
export const setLeaderboardOptOut = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in.");
  }
  const { optOut } = z.object({ optOut: z.boolean() }).parse(request.data);

  const profileRef = db.collection("users").doc(request.auth.uid).collection("gamification").doc("profile");
  await profileRef.set({ leaderboardOptOut: optOut, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  return { success: true, optOut };
});

/**
 * Admin manual XP adjustment with audit logging
 */
export const adminAdjustXp = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can adjust XP.");
  }

  const { targetUserId, xpDelta, reason } = z.object({
    targetUserId: z.string().min(1),
    xpDelta: z.number().int(),
    reason: z.string().min(5),
  }).parse(request.data);

  const profileRef = db.collection("users").doc(targetUserId).collection("gamification").doc("profile");
  const auditRef = db.collection("audit_logs").doc();

  await db.runTransaction(async (tx) => {
    const profileSnap = await tx.get(profileRef);
    if (!profileSnap.exists) throw new HttpsError("not-found", "User gamification profile not found.");

    const currentXp = profileSnap.data()?.totalXp || 0;
    const newXp = Math.max(0, currentXp + xpDelta);
    const levelInfo = calculateLevelFromXp(newXp);

    tx.update(profileRef, {
      totalXp: newXp,
      currentLevel: levelInfo.level,
      levelName: levelInfo.name,
      xpToNextLevel: levelInfo.xpToNextLevel,
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(auditRef, {
      action: "admin_xp_adjustment",
      performedBy: request.auth?.uid,
      targetUserId,
      xpDelta,
      newXp,
      reason,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { success: true, targetUserId, xpDelta, reason };
});

export async function generateLeaderboardSnapshot() {
  // Query top 100 profiles ordered by totalXp DESC
  const profilesSnap = await db.collectionGroup("gamification")
    .orderBy("totalXp", "desc")
    .limit(100)
    .get();

  const rankings: Array<{
    rank: number;
    userId: string;
    displayName: string;
    photoURL?: string;
    xp: number;
    level: number;
    levelName: string;
  }> = [];

  let currentRank = 1;
  for (const doc of profilesSnap.docs) {
    const data = doc.data();
    if (data.leaderboardOptOut) continue; // Respect privacy opt-out

    // Fetch user public name
    const userDoc = await db.collection("users").doc(data.userId).get();
    const userData = userDoc.data() || {};

    rankings.push({
      rank: currentRank++,
      userId: data.userId,
      displayName: userData.displayName || "GenZNex Learner",
      photoURL: userData.photoURL || undefined,
      xp: data.totalXp || 0,
      level: data.currentLevel || 1,
      levelName: data.levelName || "Rookie",
    });

    if (rankings.length >= 50) break;
  }

  // Write snapshot document
  await db.collection("leaderboard_snapshots").doc("global_alltime").set({
    id: "global_alltime",
    type: "alltime",
    rankings,
    generatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("leaderboard_snapshots").doc("global_weekly").set({
    id: "global_weekly",
    type: "weekly",
    rankings: rankings.slice(0, 20), // Top 20 for weekly
    generatedAt: FieldValue.serverTimestamp(),
  });

  return rankings;
}

/**
 * Fetch Leaderboard Snapshot
 */
export const getLeaderboard = onCall(async (request) => {
  const { scope = "alltime" } = z.object({
    scope: z.enum(["weekly", "alltime"]).default("alltime"),
  }).parse(request.data || {});

  const snapshotDocId = scope === "weekly" ? "global_weekly" : "global_alltime";
  const snap = await db.collection("leaderboard_snapshots").doc(snapshotDocId).get();

  if (!snap.exists || !(snap.data()?.rankings?.length > 0)) {
    const rankings = await generateLeaderboardSnapshot();
    return {
      id: snapshotDocId,
      type: scope,
      rankings: scope === "weekly" ? rankings.slice(0, 20) : rankings,
      generatedAt: new Date().toISOString(),
    };
  }

  return snap.data();
});

// ---------------------------------------------------------------------------
// Scheduled Tasks: Daily Streaks Maintenance & Leaderboard Snapshot Builder
// ---------------------------------------------------------------------------

/**
 * Runs daily at 00:05 IST (18:35 UTC) — resets broken learning streaks
 */
export const streakDailyMaintenance = onSchedule("35 18 * * *", async () => {
  const yesterdayIST = getYesterdayIST();

  // Find all profiles whose lastActiveDate is older than yesterday
  const profilesSnap = await db.collectionGroup("gamification")
    .where("currentStreak", ">", 0)
    .get();

  const writeBatch = db.batch();
  let updatedCount = 0;

  for (const doc of profilesSnap.docs) {
    const data = doc.data();
    if (data.lastActiveDate && data.lastActiveDate < yesterdayIST) {
      writeBatch.update(doc.ref, {
        currentStreak: 0,
        updatedAt: FieldValue.serverTimestamp(),
      });
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    await writeBatch.commit();
  }
});

/**
 * Runs every hour — builds top-N leaderboard snapshots
 */
export const buildLeaderboardSnapshots = onSchedule("0 * * * *", async () => {
  await generateLeaderboardSnapshot();
});
