import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const app = getApps().length === 0
  ? initializeApp({ projectId: "demo-genznex" })
  : getApps()[0];

const db = getFirestore(app);

export async function seedPhase6() {
  console.log("================================================================================");
  console.log("🎮 STARTING PHASE 6 SEED: GAMIFICATION, NOTIFICATIONS, FORUM & ANALYTICS");
  console.log("================================================================================\n");

  const student1Uid = "student_rahul_01";
  const student2Uid = "student_completed_01";
  const trainerUid = "trainer_vikram_01";
  const adminUid = "admin_super_01";

  // 1. Seed Gamification Config
  await db.collection("config").doc("gamification").set({
    xpRules: {
      lesson_completed: 20,
      quiz_passed: 50,
      quiz_perfect: 100,
      assignment_passed: 100,
      session_attended: 40,
      project_approved: 300,
      course_completed: 500,
      review_posted: 30,
      forum_answer_accepted: 75,
      daily_login: 10,
    },
    dailyCaps: {
      lesson_completed: 200,
      daily_login: 10,
      forum_answer_accepted: 150,
    },
    levelFormula: { base: 100, multiplier: 1.5 },
    levels: [
      { level: 1, name: "Rookie", minXp: 0 },
      { level: 2, name: "Explorer", minXp: 200 },
      { level: 3, name: "Achiever", minXp: 600 },
      { level: 4, name: "Pro", minXp: 1500 },
      { level: 5, name: "Legend", minXp: 3500 },
    ],
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log("✅ Seeded Gamification Config (/config/gamification).");

  // 2. Seed Badges Catalog
  const badges = [
    { id: "badge_first_lesson", name: "First Step", description: "Completed your very first lesson on GenZNex", icon: "Sparkles", category: "learning", criteriaType: "count", threshold: 1, order: 1 },
    { id: "badge_streak_7", name: "On Fire (7-Day)", description: "Maintained a 7-day continuous learning streak", icon: "Flame", category: "streak", criteriaType: "streak", threshold: 7, order: 2 },
    { id: "badge_streak_30", name: "Unstoppable (30-Day)", description: "Crushed a 30-day learning streak in Asia/Kolkata timezone", icon: "Zap", category: "streak", criteriaType: "streak", threshold: 30, order: 3 },
    { id: "badge_perfect_score", name: "Perfectionist", description: "Scored 100% on a technical assessment checkpoint", icon: "Award", category: "learning", criteriaType: "score", threshold: 100, order: 4 },
    { id: "badge_project_pro", name: "Full Stack Builder", description: "Capstone project graded and approved by a senior mentor", icon: "Code", category: "milestone", criteriaType: "special", threshold: 1, order: 5 },
    { id: "badge_course_completer", name: "Course Graduate", description: "Successfully completed 100% of an engineering track", icon: "GraduationCap", category: "milestone", criteriaType: "special", threshold: 1, order: 6 },
    { id: "badge_forum_helper", name: "Community Hero", description: "Provided an answer that was accepted as the verified solution", icon: "HelpCircle", category: "community", criteriaType: "count", threshold: 1, order: 7 },
  ];

  for (const b of badges) {
    await db.collection("badges").doc(b.id).set(b);
  }
  console.log(`✅ Seeded ${badges.length} Badges into /badges.`);

  // 3. Seed User Gamification Profiles & Ledgers
  const todayIST = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

  // Rahul Sharma (12-day streak, Level 3 Achiever)
  await db.collection("users").doc(student1Uid).collection("gamification").doc("profile").set({
    userId: student1Uid,
    totalXp: 820,
    currentLevel: 3,
    levelName: "Achiever",
    xpToNextLevel: 680,
    currentStreak: 12,
    longestStreak: 12,
    lastActiveDate: todayIST,
    streakFreezesRemaining: 1,
    streakFreezeLastGrantedWeek: "2026-W40",
    leaderboardOptOut: false,
    earnedBadgeIds: ["badge_first_lesson", "badge_streak_7", "badge_perfect_score"],
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Aarav Patel (24-day streak, Level 4 Pro)
  await db.collection("users").doc(student2Uid).collection("gamification").doc("profile").set({
    userId: student2Uid,
    totalXp: 1950,
    currentLevel: 4,
    levelName: "Pro",
    xpToNextLevel: 1550,
    currentStreak: 24,
    longestStreak: 24,
    lastActiveDate: todayIST,
    streakFreezesRemaining: 2,
    streakFreezeLastGrantedWeek: "2026-W40",
    leaderboardOptOut: false,
    earnedBadgeIds: ["badge_first_lesson", "badge_streak_7", "badge_project_pro", "badge_course_completer"],
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("✅ Seeded Gamification Profiles for Rahul (12-day streak) and Aarav (24-day streak).");

  // 4. Seed Leaderboard Snapshots
  const globalAllTime = {
    id: "global_alltime",
    type: "alltime",
    rankings: [
      { rank: 1, userId: student2Uid, displayName: "Aarav Patel", photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64", xp: 1950, level: 4, levelName: "Pro" },
      { rank: 2, userId: student1Uid, displayName: "Rahul Sharma", photoURL: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=64", xp: 820, level: 3, levelName: "Achiever" },
      { rank: 3, userId: "user_sneha_03", displayName: "Sneha Reddy", photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64", xp: 640, level: 3, levelName: "Achiever" },
      { rank: 4, userId: "user_karthik_04", displayName: "Karthik Verma", photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64", xp: 420, level: 2, levelName: "Explorer" },
      { rank: 5, userId: "user_priya_05", displayName: "Priya Nair", photoURL: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64", xp: 280, level: 2, levelName: "Explorer" },
    ],
    generatedAt: FieldValue.serverTimestamp(),
  };

  const globalWeekly = {
    id: "global_weekly",
    type: "weekly",
    rankings: globalAllTime.rankings.slice(0, 3),
    generatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection("leaderboard_snapshots").doc("global_alltime").set(globalAllTime);
  await db.collection("leaderboard_snapshots").doc("global_weekly").set(globalWeekly);
  console.log("✅ Seeded Global Leaderboard Snapshots (All-Time & Weekly).");

  // 5. Seed Discussion Forum Threads & Replies
  const courseId = "course_nextjs_fullstack";
  const post1Id = "forum_post_rsc_optimistic";
  await db.collection("forum_posts").doc(post1Id).set({
    id: post1Id,
    scopeType: "course",
    scopeId: courseId,
    lessonId: "lesson_nextjs_intro",
    videoTimestampSeconds: 420,
    authorId: student1Uid,
    authorName: "Rahul Sharma",
    authorRole: "student",
    authorAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=64",
    title: "How to handle Server Action optimistic updates with React 19 useActionState?",
    content: "When combining `useActionState` with `useOptimistic` for real-time item deletion, what is the cleanest approach to roll back if the Cloud Function returns a 409 conflict?",
    tags: ["nextjs15", "react19", "server-actions"],
    imageUrls: [],
    replyCount: 2,
    upvoteCount: 5,
    isResolved: true,
    hasAcceptedAnswer: true,
    acceptedReplyId: "reply_post1_trainer",
    isPinned: true,
    isLocked: false,
    status: "active",
    reportCount: 0,
    lastActivityAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Reply 1 (Accepted Answer by Trainer)
  await db.collection("forum_posts").doc(post1Id).collection("replies").doc("reply_post1_trainer").set({
    id: "reply_post1_trainer",
    postId: post1Id,
    authorId: trainerUid,
    authorName: "Vikram Malhotra",
    authorRole: "trainer",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64",
    content: "Great question Rahul! With `useActionState`, pass the previous state into the action reducer. If the response indicates failure, `useOptimistic` automatically reverts when the transition completes.",
    isAccepted: true,
    isInstructorAnswer: true,
    upvoteCount: 4,
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Reply 2 (Peer reply)
  await db.collection("forum_posts").doc(post1Id).collection("replies").doc("reply_post1_peer").set({
    id: "reply_post1_peer",
    postId: post1Id,
    authorId: student2Uid,
    authorName: "Aarav Patel",
    authorRole: "student",
    content: "I ran into the same issue in Module 2! Vikram's solution works seamlessly with Next.js 15 App Router.",
    isAccepted: false,
    isInstructorAnswer: false,
    upvoteCount: 1,
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Thread 2: Firestore security rules
  const post2Id = "forum_post_rules_testing";
  await db.collection("forum_posts").doc(post2Id).set({
    id: post2Id,
    scopeType: "course",
    scopeId: courseId,
    authorId: student2Uid,
    authorName: "Aarav Patel",
    authorRole: "student",
    title: "Best practices for testing Firestore Security Rules with @firebase/rules-unit-testing",
    content: "Is it better to use `testEnv.authenticatedContext` or pass custom tokens directly when asserting that students cannot update `isRead` to unauthorized fields?",
    tags: ["firestore", "security-rules", "testing"],
    imageUrls: [],
    replyCount: 1,
    upvoteCount: 3,
    isResolved: false,
    hasAcceptedAnswer: false,
    isPinned: false,
    isLocked: false,
    status: "active",
    reportCount: 0,
    lastActivityAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("✅ Seeded Discussion Forum threads, threaded replies, and accepted answers.");

  // 6. Seed Notifications Dataset (Mixed types & read/unread states)
  const notificationsData = [
    { title: "Welcome to GenZNex!", message: "Your engineering journey has officially started. Explore your dashboard.", type: "system", isRead: true },
    { title: "Payment Verified (₹4,999)", message: "GST Tax Invoice #GZN-INV-2026-1001 generated for Full Stack GenAI Track.", type: "payment_success", isRead: true },
    { title: "Badge Unlocked: On Fire! 🔥", message: "You achieved a 7-day learning streak in Asia/Kolkata timezone.", type: "badge_earned", isRead: false },
    { title: "Live Session Reminder (30m)", message: "Next.js 15 Streaming SSR masterclass starts in 30 minutes. Join on time!", type: "session_reminder_30m", isRead: false },
    { title: "Assignment Graded: 96/100", message: "Trainer Vikram graded your Capstone milestone with positive remarks.", type: "assignment_graded", isRead: false },
    { title: "New Forum Reply", message: "Trainer Vikram replied to your doubt on React 19 Server Actions.", type: "forum_reply", isRead: false },
    { title: "Job Match Alert: Nexora AI Labs", message: "New Junior Full Stack AI Engineer opening matching your skills.", type: "job_alert", isRead: false },
  ];

  for (let i = 0; i < notificationsData.length; i++) {
    const item = notificationsData[i];
    await db.collection("notifications").add({
      userId: student1Uid,
      title: item.title,
      message: item.message,
      type: item.type,
      isRead: item.isRead,
      link: "/dashboard/student/training",
      createdAt: new Date(Date.now() - (i * 3600 * 1000 * 4)),
    });
  }
  console.log(`✅ Seeded ${notificationsData.length} Notifications for ${student1Uid}.`);

  // 7. Seed 60 Days of Synthetic Daily Analytics Aggregates
  console.log("📊 Seeding 60 Days of Synthetic Daily Analytics Aggregates (/stats_daily)...");
  const writeBatch = db.batch();
  const now = new Date();

  for (let d = 59; d >= 0; d--) {
    const targetDate = new Date(now.getTime() - d * 24 * 3600 * 1000);
    const dateStr = targetDate.toISOString().split("T")[0];

    // Synthetic growth curve over 60 days
    const progressFactor = (60 - d) / 60; // 0 to 1
    const baseSignups = Math.floor(12 + progressFactor * 25 + Math.random() * 8);
    const baseOrders = Math.floor(baseSignups * 0.45);
    const revenueInPaise = baseOrders * 249900; // ~₹2,499 avg ticket
    const lessonsCompleted = Math.floor(baseSignups * 3.8 + Math.random() * 20);
    const quizzesPassed = Math.floor(lessonsCompleted * 0.4);
    const dau = Math.floor(baseSignups * 2.5 + Math.random() * 15);

    const statsRef = db.collection("stats_daily").doc(dateStr);
    writeBatch.set(statsRef, {
      date: dateStr,
      activeUsers: { dau },
      signups: baseSignups,
      revenueInPaise,
      ordersCount: baseOrders,
      lessonsCompleted,
      quizzesAttempted: Math.floor(quizzesPassed * 1.2),
      quizzesPassed,
      certificatesIssued: Math.floor(baseOrders * 0.2),
      forumPostsCreated: Math.floor(baseSignups * 0.3),
      forumRepliesCreated: Math.floor(baseSignups * 0.6),
      notificationsSent: baseSignups * 4,
      notificationsFailed: 0,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await writeBatch.commit();
  console.log("✅ 60 Days of Analytics Rollups Seeded into /stats_daily.");

  console.log("\n🎉 ================================================================================");
  console.log("🎉 PHASE 6 SEED COMPLETED SUCCESSFULLY!");
  console.log("================================================================================\n");
}

if (require.main === module) {
  seedPhase6().catch((err) => {
    console.error("❌ Phase 6 Seed Failed:", err);
    process.exit(1);
  });
}
