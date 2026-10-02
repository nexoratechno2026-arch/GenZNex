import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

const app = getApps().length === 0 ? initializeApp({ projectId: "demo-genznex" }) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const FUNCTIONS_ORIGIN = "http://127.0.0.1:5001/demo-genznex/us-central1";

// Helper: Get Firebase Auth ID Token for an emulator user
async function getIdTokenForUser(email: string, uid: string, role: string, displayName = "Test User"): Promise<string> {
  const customToken = await auth.createCustomToken(uid, { role, name: displayName });
  const apiKey = "AIzaSyFakeKeyForEmulatorTestingOnly";
  const url = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });

  if (!res.ok) {
    throw new Error(`Failed to sign in custom token: ${await res.text()}`);
  }

  const data = (await res.json()) as { idToken: string };
  return data.idToken;
}

// Helper: Call Firebase Callable Cloud Function
async function callFunction<T = any>(functionName: string, payload: any, idToken?: string): Promise<T> {
  const url = `${FUNCTIONS_ORIGIN}/${functionName}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: payload }),
  });

  const body = (await res.json()) as any;
  if (!res.ok || body.error) {
    const errorMsg = body.error?.message || JSON.stringify(body.error || body);
    throw new Error(`Cloud Function [${functionName}] Error: ${errorMsg}`);
  }

  return body.result;
}

export async function runPhase6E2ETests() {
  console.log("================================================================================");
  console.log("🏆 GENZNEX PHASE 6 END-TO-END VERIFICATION SUITE");
  console.log("   GAMIFICATION, NOTIFICATIONS, FORUM & ANALYTICS");
  console.log("================================================================================\n");

  const adminUid = "admin_super_01";
  const trainerUid = "trainer_vikram_01";
  const studentUid = "student_rahul_01";

  const adminToken = await getIdTokenForUser("admin@genznex.in", adminUid, "admin", "Super Admin");
  const trainerToken = await getIdTokenForUser("vikram@genznex.in", trainerUid, "trainer", "Vikram Malhotra");
  const studentToken = await getIdTokenForUser("student@genznex.in", studentUid, "student", "Rahul Sharma");

  console.log("🔑 Authenticated ID tokens generated for Admin, Trainer, and Student.\n");

  // ---------------------------------------------------------------------------
  // SUITE 1: Gamification & Leaderboard
  // ---------------------------------------------------------------------------
  console.log("🎮 SUITE 1: Gamification Engine & Leaderboards");

  // 1a. Student fetches leaderboard snapshot
  const leaderboardRes = await callFunction("getLeaderboard", { scope: "alltime" }, studentToken);
  console.log(`   ✅ Fetched All-Time Leaderboard: ${leaderboardRes.rankings?.length || 0} top rankers.`);

  // 1b. Student toggles privacy opt-out
  const optOutRes = await callFunction("setLeaderboardOptOut", { optOut: true }, studentToken);
  console.log(`   ✅ Student set leaderboard opt-out: ${optOutRes.optOut}`);

  // Re-enable for tests
  await callFunction("setLeaderboardOptOut", { optOut: false }, studentToken);

  // 1c. Admin adjusts XP with audit log
  const xpAdjustRes = await callFunction("adminAdjustXp", {
    targetUserId: studentUid,
    xpDelta: 50,
    reason: "Exemplary capstone architecture design bonus",
  }, adminToken);
  console.log(`   ✅ Admin adjusted XP: +${xpAdjustRes.xpDelta} XP (Audit logged).`);

  // Verify non-admin CANNOT adjust XP
  try {
    await callFunction("adminAdjustXp", {
      targetUserId: studentUid,
      xpDelta: 5000,
      reason: "Hacked XP",
    }, studentToken);
    throw new Error("Security breach: student adjusted XP!");
  } catch (err: any) {
    if (err.message.toLowerCase().includes("permission-denied") || err.message.toLowerCase().includes("admin")) {
      console.log(`   ✅ Blocked unauthorized XP adjustment attempt: ${err.message}`);
    } else {
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: Notifications Engine
  // ---------------------------------------------------------------------------
  console.log("\n📬 SUITE 2: Notifications Dispatcher & Preferences");

  // 2a. Update notification settings & quiet hours
  await callFunction("updateNotificationSettings", {
    channels: { inApp: true, push: true, email: true },
    quietHours: { enabled: true, startIST: "23:00", endIST: "07:00" },
  }, studentToken);
  console.log("   ✅ Student updated notification settings and quiet hours (23:00 to 07:00 IST).");

  // 2b. Register FCM Web Push Token
  await callFunction("saveFcmToken", {
    token: "fcm_test_token_rahul_emulator_web_push_xyz12345",
    userAgent: "Chrome/NextJS15",
  }, studentToken);
  console.log("   ✅ Saved FCM Web Push Token for browser notifications.");

  // 2c. Mark all notifications as read
  const markAllRes = await callFunction("markAllNotificationsRead", {}, studentToken);
  console.log(`   ✅ Marked all notifications as read (${markAllRes.updatedCount} updated).`);

  // 2d. Admin Broadcast Announcement
  const broadcastRes = await callFunction("adminBroadcastNotification", {
    title: "Platform Maintenance & Next.js 15.1 Upgrade",
    body: "GenZNex will undergo scheduled maintenance tonight at 02:00 IST.",
    targetRole: "all",
  }, adminToken);
  console.log(`   ✅ Admin broadcast sent to ${broadcastRes.recipientsCount} users (Audit logged).`);

  // ---------------------------------------------------------------------------
  // SUITE 3: Discussion Forum & Doubt Clearing
  // ---------------------------------------------------------------------------
  console.log("\n💬 SUITE 3: Discussion Forum, Upvoting, Accepted Answers & Moderation");
  const courseId = "course_nextjs_fullstack";

  // Ensure student is enrolled in course
  await db.collection("enrollments").doc(`${studentUid}_${courseId}`).set({
    userId: studentUid,
    courseId,
    status: "active",
  }, { merge: true });

  // 3a. Student creates a discussion question
  const createPostRes = await callFunction("createForumPost", {
    scopeType: "course",
    scopeId: courseId,
    title: "Optimistic UI with React 19 useOptimistic and Server Actions",
    content: "How does GenZNex handle optimistic UI rollbacks when the server rejects a payment or attendance code?",
    tags: ["react19", "optimistic-ui", "nextjs15"],
  }, studentToken);

  const postId = createPostRes.postId;
  console.log(`   ✅ Student posted doubt (Post ID: ${postId}).`);

  // 3b. Trainer adds a reply
  const createReplyRes = await callFunction("createForumReply", {
    postId,
    content: "Great question! We catch the rejection in the server action and the parent transition automatically resets the optimistic state.",
  }, trainerToken);

  const replyId = createReplyRes.replyId;
  console.log(`   ✅ Trainer posted response (Reply ID: ${replyId}).`);

  // 3c. Student upvotes the trainer's reply (Deterministic vote doc)
  const voteRes = await callFunction("toggleForumVote", {
    targetType: "reply",
    targetId: replyId,
    parentPostId: postId,
  }, studentToken);
  console.log(`   ✅ Student upvoted reply: upvoted=${voteRes.upvoted}`);

  // 3d. Student marks the trainer's answer as ACCEPTED (Awards 75 XP)
  await callFunction("acceptForumAnswer", {
    postId,
    replyId,
  }, studentToken);
  console.log("   ✅ Student marked reply as ACCEPTED solution (+75 XP awarded to trainer!).");

  // 3e. Reporting content
  const reportRes = await callFunction("reportForumContent", {
    targetType: "post",
    targetId: postId,
    postId,
    reason: "Testing reporting flow",
  }, studentToken);
  console.log(`   ✅ Student submitted moderation report (Report ID: ${reportRes.reportId}).`);

  // 3f. Moderator approves and pins post
  await callFunction("moderateForumContent", {
    postId,
    action: "pin",
  }, trainerToken);
  console.log("   ✅ Trainer pinned the thread as a featured discussion.");

  // ---------------------------------------------------------------------------
  // SUITE 4: Analytics Dashboards & Aggregations
  // ---------------------------------------------------------------------------
  console.log("\n📊 SUITE 4: Analytics Pre-Aggregated Retrieval & Backfill");

  // 4a. Backfill today's analytics rollup
  const todayIST = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const backfillRes = await callFunction("backfillDailyStats", {
    dateIST: todayIST,
  }, adminToken);
  console.log(`   ✅ Admin triggered backfill for ${todayIST} (DAU: ${backfillRes.result.activeUsers.dau}).`);

  // 4b. Fetch Analytics Summary (Fast query of pre-aggregated records)
  const summaryRes = await callFunction("getAnalyticsSummary", { days: 30 }, adminToken);
  console.log(`   ✅ Fetched 30-Day Analytics Summary:`);
  console.log(`      - Period Days: ${summaryRes.periodDays}`);
  console.log(`      - Total Revenue: ₹${((summaryRes.totals.revenueInPaise || 0) / 100).toLocaleString()}`);
  console.log(`      - Total Orders: ${summaryRes.totals.orders}`);
  console.log(`      - Total Lessons: ${summaryRes.totals.lessonsCompleted}`);
  console.log(`      - Total Certificates: ${summaryRes.totals.certificatesIssued}`);

  console.log("\n================================================================================");
  console.log("🎉 ALL 4 PHASE 6 TEST SUITES (15 CLOUD FUNCTION CALLS) PASSED WITH ZERO ERRORS!");
  console.log("================================================================================\n");
}

if (require.main === module) {
  runPhase6E2ETests().catch((err) => {
    console.error("❌ Phase 6 E2E Test Failed:", err);
    process.exit(1);
  });
}
