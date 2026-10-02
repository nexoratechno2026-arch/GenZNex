/**
 * GenZNex Phase 6: Analytics Engine
 * Pre-aggregated daily metrics (zero collection scans), historical backfill,
 * and high-performance summary retrieval for Admin & Trainer dashboards.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { getTodayIST } from "./gamification";

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Core Aggregation Logic
// ---------------------------------------------------------------------------

export async function computeDailyStatsForDate(dateIST: string): Promise<Record<string, any>> {
  // Define 24-hour timestamp boundary in UTC corresponding to Asia/Kolkata day
  const startOfDayUTC = new Date(`${dateIST}T00:00:00+05:30`);
  const endOfDayUTC = new Date(`${dateIST}T23:59:59.999+05:30`);

  const startTimestamp = Timestamp.fromDate(startOfDayUTC);
  const endTimestamp = Timestamp.fromDate(endOfDayUTC);

  // 1. New Signups
  const usersSnap = await db.collection("users")
    .where("createdAt", ">=", startTimestamp)
    .where("createdAt", "<=", endTimestamp)
    .get();
  const signups = usersSnap.size;

  // 2. Paid Orders & Revenue
  const paymentsSnap = await db.collection("payments")
    .where("status", "==", "captured")
    .where("createdAt", ">=", startTimestamp)
    .where("createdAt", "<=", endTimestamp)
    .get();

  let revenueInPaise = 0;
  paymentsSnap.forEach((doc) => {
    revenueInPaise += doc.data().amount || doc.data().amountInPaise || 0;
  });
  const ordersCount = paymentsSnap.size;

  // 3. Lessons Completed (via XP ledger)
  const lessonsSnap = await db.collection("xp_ledger")
    .where("eventType", "==", "lesson_completed")
    .where("dateIST", "==", dateIST)
    .get();
  const lessonsCompleted = lessonsSnap.size;

  // 4. Quizzes Attempted / Passed
  const quizAttemptsSnap = await db.collection("quiz_attempts")
    .where("completedAt", ">=", startTimestamp)
    .where("completedAt", "<=", endTimestamp)
    .get();

  let quizzesPassed = 0;
  quizAttemptsSnap.forEach((doc) => {
    if (doc.data().passed) quizzesPassed++;
  });
  const quizzesAttempted = quizAttemptsSnap.size;

  // 5. Certificates Issued
  const certsSnap = await db.collection("certificates")
    .where("issuedAt", ">=", startTimestamp)
    .where("issuedAt", "<=", endTimestamp)
    .get();
  const certificatesIssued = certsSnap.size;

  // 6. Forum Activity
  const postsSnap = await db.collection("forum_posts")
    .where("createdAt", ">=", startTimestamp)
    .where("createdAt", "<=", endTimestamp)
    .get();
  const forumPostsCreated = postsSnap.size;

  const notifsSnap = await db.collection("notifications")
    .where("createdAt", ">=", startTimestamp)
    .where("createdAt", "<=", endTimestamp)
    .get();
  const notificationsSent = notifsSnap.size;

  const statsDoc = {
    date: dateIST,
    activeUsers: { dau: Math.max(signups, lessonsCompleted, quizzesAttempted, 1) },
    signups,
    revenueInPaise,
    ordersCount,
    lessonsCompleted,
    quizzesAttempted,
    quizzesPassed,
    certificatesIssued,
    forumPostsCreated,
    forumRepliesCreated: 0,
    notificationsSent,
    notificationsFailed: 0,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection("stats").doc("daily").collection("dates").doc(dateIST).set(statsDoc, { merge: true });
  // Also store in root /stats_daily/{dateIST} for convenient rule testing
  await db.collection("stats_daily").doc(dateIST).set(statsDoc, { merge: true });

  return statsDoc;
}

// ---------------------------------------------------------------------------
// Scheduled Tasks & Callables
// ---------------------------------------------------------------------------

/**
 * Runs daily at 23:55 IST (18:25 UTC) — aggregates today's platform metrics
 */
export const aggregateDailyStats = onSchedule("25 18 * * *", async () => {
  const todayIST = getTodayIST();
  await computeDailyStatsForDate(todayIST);
});

/**
 * Admin manual backfill for historical dates
 */
export const backfillDailyStats = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can trigger analytics backfill.");
  }

  const { dateIST } = z.object({
    dateIST: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(request.data);

  const result = await computeDailyStatsForDate(dateIST);
  return { success: true, result };
});

/**
 * Fetch Analytics Summary for Dashboards (Reads pre-aggregated records)
 */
export const getAnalyticsSummary = onCall(async (request) => {
  if (!request.auth || (request.auth.token.role !== "admin" && request.auth.token.role !== "trainer")) {
    throw new HttpsError("permission-denied", "Only admins and trainers can access analytics summaries.");
  }

  const { days = 30 } = z.object({
    days: z.number().int().min(1).max(90).default(30),
  }).parse(request.data || {});

  const snap = await db.collection("stats_daily")
    .orderBy("date", "desc")
    .limit(days)
    .get();

  const dailyRecords: any[] = [];
  let totalRevenueInPaise = 0;
  let totalOrders = 0;
  let totalLessons = 0;
  let totalCertificates = 0;
  let totalSignups = 0;

  snap.forEach((doc) => {
    const data = doc.data();
    dailyRecords.push(data);
    totalRevenueInPaise += data.revenueInPaise || 0;
    totalOrders += data.ordersCount || 0;
    totalLessons += data.lessonsCompleted || 0;
    totalCertificates += data.certificatesIssued || 0;
    totalSignups += data.signups || 0;
  });

  return {
    periodDays: days,
    totals: {
      revenueInPaise: totalRevenueInPaise,
      orders: totalOrders,
      lessonsCompleted: totalLessons,
      certificatesIssued: totalCertificates,
      signups: totalSignups,
    },
    dailyRecords: dailyRecords.reverse(), // Ascending for charts
  };
});
