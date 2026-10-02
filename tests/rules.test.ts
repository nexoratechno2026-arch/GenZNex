import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import * as fs from "fs";
import * as path from "path";
import { setDoc, doc, updateDoc, getDoc } from "firebase/firestore";

const PROJECT_ID = "demo-genznex";

async function runRulesTests() {
  console.log("🚀 Initializing Security Rules Unit Test Environment on Firestore Emulator...");

  const rulesPath = path.resolve(__dirname, "../firestore.rules");
  const rules = fs.readFileSync(rulesPath, "utf8");

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: rules,
      host: "127.0.0.1",
      port: 8080,
    },
  });

  await testEnv.clearFirestore();

  try {
    const studentUid = "student_rahul_01";
    const trainerUid = "trainer_vikram_01";
    const adminUid = "admin_super_01";

    const studentContext = testEnv.authenticatedContext(studentUid, { role: "student" });
    const trainerContext = testEnv.authenticatedContext(trainerUid, { role: "trainer" });
    const adminContext = testEnv.authenticatedContext(adminUid, { role: "admin" });
    const unauthContext = testEnv.unauthenticatedContext();

    const studentDb = studentContext.firestore();
    const trainerDb = trainerContext.firestore();
    const adminDb = adminContext.firestore();
    const unauthDb = unauthContext.firestore();

    console.log("\n🧪 Test 1: Student cannot write directly to /payments (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "payments", "order_malicious_123"), {
        userId: studentUid,
        amountInPaise: 100,
        status: "captured",
      })
    );
    console.log("   ✅ PASS: Student direct write to /payments blocked.");

    console.log("\n🧪 Test 2: Student cannot write directly to /enrollments (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "enrollments", `${studentUid}_course_ai`), {
        userId: studentUid,
        courseId: "course_ai",
        status: "active",
      })
    );
    console.log("   ✅ PASS: Student direct write to /enrollments blocked.");

    console.log("\n🧪 Test 3: Student cannot write directly to /certificates (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "certificates", "cert_fake_999"), {
        userId: studentUid,
        courseId: "course_ai",
        certificateNumber: "CERT-FAKE",
      })
    );
    console.log("   ✅ PASS: Student direct write to /certificates blocked.");

    console.log("\n🧪 Test 4: Student cannot self-assign role claim in /users/{userId} (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "users", studentUid), {
        uid: studentUid,
        displayName: "Rahul Hacker",
        role: "admin", // Malicious role escalation
      })
    );
    console.log("   ✅ PASS: Role privilege escalation prevented.");

    console.log("\n🧪 Test 5: Student CAN create valid user profile without role (Must SUCCEED)");
    await assertSucceeds(
      setDoc(doc(studentDb, "users", studentUid), {
        uid: studentUid,
        displayName: "Rahul Sharma",
        bio: "Aspiring Gen Z Full Stack AI Engineer",
      })
    );
    console.log("   ✅ PASS: Normal profile creation succeeded.");

    console.log("\n🧪 Test 6: Student CANNOT create a course (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "courses", "course_student_hack"), {
        title: "Unauthorized Course",
        trainerId: studentUid,
        isPublished: true,
      })
    );
    console.log("   ✅ PASS: Student course creation blocked.");

    console.log("\n🧪 Test 7: Trainer CAN create course in draft status (Must SUCCEED)");
    await assertSucceeds(
      setDoc(doc(trainerDb, "courses", "course_ai_bootcamp"), {
        title: "AI Engineer Bootcamp 2026",
        trainerId: trainerUid,
        instructor: { uid: trainerUid, name: "Vikram Malhotra" },
        status: "draft",
        priceInPaise: 499900,
      })
    );
    console.log("   ✅ PASS: Trainer course creation in draft status succeeded.");

    console.log("\n🧪 Test 8: Unauthenticated user CANNOT write to jobs (Must be DENIED)");
    await assertFails(
      setDoc(doc(unauthDb, "jobs", "job_fake"), {
        title: "Spam Job",
        companyName: "SpamCorp",
      })
    );
    console.log("   ✅ PASS: Unauthenticated write to jobs blocked.");

    console.log("\n🧪 Test 9: Trainer CANNOT change course status to 'published' via client update (Must be DENIED)");
    await assertFails(
      updateDoc(doc(trainerDb, "courses", "course_ai_bootcamp"), {
        status: "published",
      })
    );
    console.log("   ✅ PASS: Client status change blocked (must use Cloud Functions).");

    console.log("\n🧪 Test 10: Unauthenticated user CANNOT read draft course (Must be DENIED)");
    await assertFails(
      getDoc(doc(unauthDb, "courses", "course_ai_bootcamp"))
    );
    console.log("   ✅ PASS: Unauthenticated read of draft course blocked.");

    console.log("\n🧪 Test 11: Public read of published course (Must SUCCEED)");
    // Seed a published course via admin
    await assertSucceeds(
      setDoc(doc(adminDb, "courses", "course_published_demo"), {
        title: "Published Web Dev Course",
        status: "published",
        priceInPaise: 0,
      })
    );
    const pubSnap = await getDoc(doc(unauthDb, "courses", "course_published_demo"));
    console.log("   ✅ PASS: Public can read published course (title: " + pubSnap.data()?.title + ").");

    console.log("\n🧪 Test 12: Client CANNOT write to audit_logs (Must be DENIED)");
    await assertFails(
      setDoc(doc(adminDb, "audit_logs", "fake_log_1"), {
        action: "malicious_log",
      })
    );
    console.log("   ✅ PASS: Direct client write to audit_logs blocked.");

    console.log("\n🧪 Test 13: Student CANNOT write directly to /invoices (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "invoices", "inv_fake_1001"), {
        userId: studentUid,
        invoiceNumber: "GZN-INV-2026-1001",
        totalInPaise: 199900,
      })
    );
    console.log("   ✅ PASS: Direct client write to /invoices blocked.");

    console.log("\n🧪 Test 14: Student CANNOT write directly to /refunds (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "refunds", "rfd_fake_1001"), {
        paymentId: "pay_fake_123",
        amountInPaise: 199900,
        status: "processed",
      })
    );
    console.log("   ✅ PASS: Direct client write to /refunds blocked.");

    console.log("\n🧪 Test 15: Student CANNOT write or modify /coupons (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "coupons", "GENZ100"), {
        code: "GENZ100",
        type: "percent",
        value: 100,
      })
    );
    console.log("   ✅ PASS: Client write to /coupons blocked.");

    console.log("\n🧪 Test 16: Student CANNOT write to /config/payments (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "config", "payments"), {
        gstRatePercent: 0,
      })
    );
    console.log("   ✅ PASS: Client write to /config/payments blocked.");

    console.log("\n🧪 Test 17: Invoice reading permissions (Own vs other student)");
    // Seed invoices via testEnv.withSecurityRulesDisabled
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const systemDb = context.firestore();
      await setDoc(doc(systemDb, "invoices", "inv_student1"), {
        userId: studentUid,
        invoiceNumber: "GZN-INV-2026-1001",
        courseTitle: "Next.js Fullstack",
      });
      await setDoc(doc(systemDb, "invoices", "inv_other_student"), {
        userId: "other_student_99",
        invoiceNumber: "GZN-INV-2026-1002",
        courseTitle: "System Design",
      });
    });

    await assertSucceeds(getDoc(doc(studentDb, "invoices", "inv_student1")));
    await assertFails(getDoc(doc(studentDb, "invoices", "inv_other_student")));
    console.log("   ✅ PASS: Student can read own invoice and CANNOT read other student's invoice.");

    console.log("\n🧪 Test 18: Client CANNOT write to /webhookEvents (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "webhookEvents", "event_malicious"), {
        eventId: "event_malicious",
      })
    );
    console.log("   ✅ PASS: Direct client write to /webhookEvents blocked.");

    // Phase 4 Test Setup: Seed course, lessons, quiz private answers, and enrollments
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const systemDb = context.firestore();
      // Unenrolled course
      await setDoc(doc(systemDb, "courses", "course_p4_unenrolled"), {
        title: "Unenrolled Course",
        status: "published",
        isPublished: true,
      });
      await setDoc(doc(systemDb, "courses", "course_p4_unenrolled", "modules", "m1", "lessons", "lesson_preview"), {
        title: "Free Preview Lesson",
        isPreview: true,
      });
      await setDoc(doc(systemDb, "courses", "course_p4_unenrolled", "modules", "m1", "lessons", "lesson_locked"), {
        title: "Premium Lesson",
        isPreview: false,
      });
      await setDoc(doc(systemDb, "courses", "course_p4_unenrolled", "quizzes", "quiz1"), {
        title: "Midterm Quiz",
        passingScore: 70,
      });
      await setDoc(doc(systemDb, "courses", "course_p4_unenrolled", "quizzes", "quiz1", "private", "answers"), {
        answers: { q1: { correctIndices: [2] } },
      });

      // Enrolled course
      await setDoc(doc(systemDb, "courses", "course_p4_enrolled"), {
        title: "Enrolled Course",
        status: "published",
        isPublished: true,
      });
      await setDoc(doc(systemDb, "courses", "course_p4_enrolled", "modules", "m1", "lessons", "lesson_premium"), {
        title: "Premium Enrolled Lesson",
        isPreview: false,
      });
      await setDoc(doc(systemDb, "enrollments", `${studentUid}_course_p4_enrolled`), {
        userId: studentUid,
        courseId: "course_p4_enrolled",
        status: "active",
      });
    });

    console.log("\n🧪 Test 19: Student CANNOT read private quiz answers (Must be DENIED)");
    await assertFails(getDoc(doc(studentDb, "courses", "course_p4_unenrolled", "quizzes", "quiz1", "private", "answers")));
    console.log("   ✅ PASS: Quiz answer secrecy enforced (private/answers blocked).");

    console.log("\n🧪 Test 20: Unenrolled student CANNOT read non-preview lesson (Must be DENIED)");
    await assertFails(getDoc(doc(studentDb, "courses", "course_p4_unenrolled", "modules", "m1", "lessons", "lesson_locked")));
    console.log("   ✅ PASS: Unenrolled access to non-preview lesson blocked.");

    console.log("\n🧪 Test 21: Enrolled student CAN read non-preview lesson (Must SUCCEED)");
    await assertSucceeds(getDoc(doc(studentDb, "courses", "course_p4_enrolled", "modules", "m1", "lessons", "lesson_premium")));
    console.log("   ✅ PASS: Active enrolled student granted access to course lesson.");

    console.log("\n🧪 Test 22: Unenrolled student CAN read free preview lesson (Must SUCCEED)");
    await assertSucceeds(getDoc(doc(studentDb, "courses", "course_p4_unenrolled", "modules", "m1", "lessons", "lesson_preview")));
    console.log("   ✅ PASS: Free preview lesson accessible without enrollment.");

    console.log("\n🧪 Test 23: Student CANNOT write directly to /quiz_attempts (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "quiz_attempts", "attempt_fake"), {
        userId: studentUid,
        score: 100,
        passed: true,
      })
    );
    console.log("   ✅ PASS: Direct client write to /quiz_attempts blocked.");

    console.log("\n🧪 Test 24: Student CANNOT update /submissions to alter grade (Must be DENIED)");
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const systemDb = context.firestore();
      await setDoc(doc(systemDb, "submissions", "sub_test_01"), {
        studentId: studentUid,
        grade: 50,
        status: "submitted",
      });
    });
    await assertFails(
      updateDoc(doc(studentDb, "submissions", "sub_test_01"), {
        grade: 100,
        status: "graded",
      })
    );
    console.log("   ✅ PASS: Student modification of assignment grade/status blocked.");

    console.log("\n🧪 Test 25: Student CANNOT write directly to /courses/{courseId}/reviews (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "courses", "course_p4_unenrolled", "reviews", studentUid), {
        rating: 5,
        reviewText: "Direct client fake review",
      })
    );
    console.log("   ✅ PASS: Direct client review write blocked (must use Cloud Function).");

    console.log("\n🧪 Test 26: Student CANNOT write directly to /batch_enrollments (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "batch_enrollments", `batch_bootcamp_1_${studentUid}`), {
        batchId: "batch_bootcamp_1",
        userId: studentUid,
        status: "active",
      })
    );
    console.log("   ✅ PASS: Direct client write to /batch_enrollments blocked.");

    console.log("\n🧪 Test 27: Student CANNOT write directly to /session_attendance (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "session_attendance", `session_1_${studentUid}`), {
        batchId: "batch_bootcamp_1",
        sessionId: "session_1",
        userId: studentUid,
        verified: true,
      })
    );
    console.log("   ✅ PASS: Direct client write to /session_attendance blocked.");

    console.log("\n🧪 Test 28: Student CANNOT modify /program_batches capacity/enrolledCount (Must be DENIED)");
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const systemDb = context.firestore();
      await setDoc(doc(systemDb, "program_batches", "batch_test_01"), {
        programId: "prog_ai",
        name: "Test Batch",
        capacity: 30,
        enrolledCount: 10,
        trainerIds: [trainerUid],
        status: "open",
      });
    });
    await assertFails(
      updateDoc(doc(studentDb, "program_batches", "batch_test_01"), {
        enrolledCount: 11,
      })
    );
    console.log("   ✅ PASS: Direct client update to /program_batches blocked.");

    console.log("\n🧪 Test 29: Student CANNOT update /project_submissions to alter grade (Must be DENIED)");
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const systemDb = context.firestore();
      await setDoc(doc(systemDb, "project_submissions", "sub_proj_01"), {
        userId: studentUid,
        projectId: "proj_capstone",
        batchId: "batch_test_01",
        status: "submitted",
        score: 60,
      });
    });
    await assertFails(
      updateDoc(doc(studentDb, "project_submissions", "sub_proj_01"), {
        score: 100,
        status: "approved",
      })
    );
    console.log("   ✅ PASS: Direct client update to /project_submissions blocked.");

    console.log("\n🧪 Test 30: Student CANNOT read /question_bank private answers (Must be DENIED)");
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const systemDb = context.firestore();
      await setDoc(doc(systemDb, "question_bank", "qb_q1"), {
        prompt: "What is React Server Component?",
      });
      await setDoc(doc(systemDb, "question_bank", "qb_q1", "private", "answers"), {
        correctAnswer: "Server side component",
      });
    });
    await assertFails(
      getDoc(doc(studentDb, "question_bank", "qb_q1", "private", "answers"))
    );
    console.log("   ✅ PASS: Question bank private answers secrecy enforced.");

    console.log("\n🧪 Test 31: Student CANNOT write directly to /showcase (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "showcase", "showcase_fake"), {
        title: "Malicious Showcase",
        studentDisplayName: "Rahul",
      })
    );
    console.log("   ✅ PASS: Direct client write to /showcase blocked (CF-only write).");

    console.log("\n🧪 Test 32: Student CANNOT write directly to /training_programs (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "training_programs", "fake_program"), {
        title: "Fake Program",
        status: "published",
      })
    );
    console.log("   ✅ PASS: Student write to /training_programs blocked (Admin only).");

    console.log("\n🧪 Test 33: Student CANNOT write directly to /xp_ledger (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "xp_ledger", `${studentUid}_fake_1000`), {
        userId: studentUid,
        xpAwarded: 10000,
        eventType: "lesson_completed",
      })
    );
    console.log("   ✅ PASS: Direct client write to /xp_ledger blocked (CF-only write).");

    console.log("\n🧪 Test 34: Student CANNOT write directly to /users/{uid}/gamification/profile (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "users", studentUid, "gamification", "profile"), {
        totalXp: 99999,
        currentLevel: 5,
        levelName: "Legend",
      })
    );
    console.log("   ✅ PASS: Direct client write to gamification profile blocked.");

    console.log("\n🧪 Test 35: Student CANNOT write directly to /leaderboard_snapshots (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "leaderboard_snapshots", "global_alltime"), {
        rankings: [{ rank: 1, userId: studentUid, xp: 99999 }],
      })
    );
    console.log("   ✅ PASS: Direct client write to /leaderboard_snapshots blocked.");

    console.log("\n🧪 Test 36: Student CANNOT create notifications directly (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "notifications", "fake_notif_01"), {
        userId: studentUid,
        title: "Fake Notif",
        message: "Spam",
        isRead: false,
      })
    );
    console.log("   ✅ PASS: Direct client creation of /notifications blocked.");

    console.log("\n🧪 Test 37: Student CAN update isRead on own notification (Must SUCCEED)");
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const systemDb = context.firestore();
      await setDoc(doc(systemDb, "notifications", "notif_valid_01"), {
        userId: studentUid,
        title: "Real Notif",
        message: "Welcome",
        isRead: false,
      });
    });
    await assertSucceeds(
      updateDoc(doc(studentDb, "notifications", "notif_valid_01"), {
        isRead: true,
      })
    );
    console.log("   ✅ PASS: Student updated isRead on own notification.");

    console.log("\n🧪 Test 38: Student CANNOT update other fields on notification (Must be DENIED)");
    await assertFails(
      updateDoc(doc(studentDb, "notifications", "notif_valid_01"), {
        title: "Tampered Title",
      })
    );
    console.log("   ✅ PASS: Non-isRead notification modifications blocked.");

    console.log("\n🧪 Test 39: Student CANNOT read forum of unenrolled course (Must be DENIED)");
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const systemDb = context.firestore();
      await setDoc(doc(systemDb, "forum_posts", "post_unenrolled_01"), {
        scopeType: "course",
        scopeId: "course_secret_ai",
        authorId: "trainer_vikram_01",
        title: "Exclusive doubt",
        status: "active",
      });
    });
    await assertFails(
      getDoc(doc(studentDb, "forum_posts", "post_unenrolled_01"))
    );
    console.log("   ✅ PASS: Forum reading of unenrolled course blocked.");

    console.log("\n🧪 Test 40: Enrolled student CAN read forum of enrolled course (Must SUCCEED)");
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const systemDb = context.firestore();
      await setDoc(doc(systemDb, "enrollments", `${studentUid}_course_p6_enrolled`), {
        userId: studentUid,
        courseId: "course_p6_enrolled",
        status: "active",
      });
      await setDoc(doc(systemDb, "forum_posts", "post_enrolled_01"), {
        scopeType: "course",
        scopeId: "course_p6_enrolled",
        authorId: "trainer_vikram_01",
        title: "Welcome Doubt",
        status: "active",
      });
    });
    await assertSucceeds(
      getDoc(doc(studentDb, "forum_posts", "post_enrolled_01"))
    );
    console.log("   ✅ PASS: Enrolled student granted read access to course forum.");

    console.log("\n🧪 Test 41: Student CANNOT write directly to /forum_votes (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "forum_votes", `${studentUid}_post_fake`), {
        userId: studentUid,
        targetType: "post",
        targetId: "fake",
      })
    );
    console.log("   ✅ PASS: Direct client write to /forum_votes blocked (CF-only write).");

    console.log("\n🧪 Test 42: Student CANNOT write directly to /stats_daily (Must be DENIED)");
    await assertFails(
      setDoc(doc(studentDb, "stats_daily", "2026-10-02"), {
        revenueInPaise: 99999999,
        signups: 10000,
      })
    );
    console.log("   ✅ PASS: Direct client write to /stats_daily blocked (CF-only write).");

    console.log("\n🎉 ALL 42 SECURITY RULES TESTS (PHASES 1-6) PASSED SUCCESSFULLY! 100% COMPLIANT.\n");
  } finally {
    await testEnv.cleanup();
  }
}

runRulesTests().catch((err) => {
  console.error("❌ Rules Test Failed:", err);
  process.exit(1);
});
