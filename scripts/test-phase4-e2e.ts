import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

const app = getApps().length === 0 ? initializeApp({ projectId: "demo-genznex" }) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const FUNCTIONS_ORIGIN = "http://127.0.0.1:5001/demo-genznex/us-central1";

// Helper: Get Firebase Auth ID Token for an emulator user
async function getIdTokenForUser(email: string, uid: string, role: string): Promise<string> {
  const customToken = await auth.createCustomToken(uid, { role, name: uid === "student_rahul_01" ? "Rahul Sharma" : "Aarav Patel" });
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

async function runPhase4E2ETests() {
  console.log("================================================================================");
  console.log("🎓 GENZNEX PHASE 4 END-TO-END LEARNING & CERTIFICATE VERIFICATION SUITE");
  console.log("================================================================================\n");

  const courseId = "course_nextjs_fullstack";
  const rahulUid = "student_rahul_01";
  const aaravUid = "student_completed_01";
  const unenrolledUid = "student_unenrolled_01";
  const trainerUid = "trainer_vikram_01";

  // Ensure unenrolled student user exists
  try {
    await auth.createUser({
      uid: unenrolledUid,
      email: "unenrolled@genznex.in",
      displayName: "Unenrolled Visitor",
    });
    await auth.setCustomUserClaims(unenrolledUid, { role: "student" });
  } catch {
    await auth.setCustomUserClaims(unenrolledUid, { role: "student" });
  }
  // Ensure no enrollment exists for unenrolled student
  await db.collection("enrollments").doc(`${unenrolledUid}_${courseId}`).delete();

  const rahulToken = await getIdTokenForUser("student@genznex.in", rahulUid, "student");
  const aaravToken = await getIdTokenForUser("aarav@genznex.in", aaravUid, "student");
  const unenrolledToken = await getIdTokenForUser("unenrolled@genznex.in", unenrolledUid, "student");
  const trainerToken = await getIdTokenForUser("vikram@genznex.in", trainerUid, "trainer");

  console.log("🔑 Authenticated tokens generated for all student & trainer test personas.\n");

  // ---------------------------------------------------------------------------
  // TEST 1: Video Delivery & Access Control via getLessonAccess
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 TEST 1: Video Delivery & Gated Access Control (getLessonAccess)");
  console.log("--------------------------------------------------------------------------------");

  // 1a. Unenrolled student on locked lesson
  console.log("   1a. Testing unenrolled student accessing locked video lesson...");
  let unenrolledBlocked = false;
  try {
    await callFunction(
      "getLessonAccess",
      { courseId, lessonId: "les_2_2" },
      unenrolledToken
    );
  } catch (err: any) {
    if (err.message.includes("Active enrollment required")) {
      unenrolledBlocked = true;
    } else {
      throw err;
    }
  }
  if (!unenrolledBlocked) {
    throw new Error("FAILED: Unenrolled student was able to access locked lesson!");
  }
  console.log("   ✅ Unenrolled student was correctly BLOCKED from locked lesson.");

  // 1b. Free preview lesson accessibility
  console.log("   1b. Testing preview lesson accessibility for unenrolled student...");
  const previewAccess = await callFunction(
    "getLessonAccess",
    { courseId, lessonId: "les_1_1" },
    unenrolledToken
  );
  if (!previewAccess.accessGranted || !previewAccess.lesson.isPreview) {
    throw new Error("FAILED: Preview lesson was not accessible to unenrolled student!");
  }
  console.log("   ✅ Preview lesson accessible with signed playback URL:", {
    playbackUrl: previewAccess.playback?.playbackUrl?.slice(0, 45) + "...",
    provider: previewAccess.playback?.provider,
  });

  // 1c. Enrolled student accessing locked lesson
  console.log("   1c. Testing enrolled student accessing locked video lesson...");
  const enrolledAccess = await callFunction(
    "getLessonAccess",
    { courseId, lessonId: "les_2_1" },
    rahulToken
  );
  if (!enrolledAccess.accessGranted || !enrolledAccess.playback?.playbackUrl) {
    throw new Error("FAILED: Enrolled student could not access lesson playback URL!");
  }
  console.log("   ✅ Enrolled student granted signed playback token:", {
    lessonTitle: enrolledAccess.lesson.title,
    playbackUrl: enrolledAccess.playback.playbackUrl.slice(0, 45) + "...",
    expiresAt: enrolledAccess.playback.expiresAt,
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Progress Tracking & Server-Side Verification
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("📍 TEST 2: Throttled Progress Tracking & 90% Watch Threshold Verification");
  console.log("--------------------------------------------------------------------------------");

  // 2a. Progress update with insufficient watch time (< 88%)
  console.log("   2a. Student sends completed:true with position = 500s of 3300s (15%)...");
  const progress1 = await callFunction(
    "updateLessonProgress",
    {
      courseId,
      lessonId: "les_2_1",
      positionSeconds: 500,
      durationSeconds: 3300,
      completed: true,
    },
    rahulToken
  );
  if (progress1.completed !== false) {
    throw new Error("FAILED: Server accepted completed=true without 90% watch threshold!");
  }
  console.log("   ✅ Server correctly rejected false completion claim (< 90% threshold).");

  // 2b. Progress update with sufficient watch time (> 90%)
  console.log("   2b. Student sends position = 3100s of 3300s (94%)...");
  const progress2 = await callFunction(
    "updateLessonProgress",
    {
      courseId,
      lessonId: "les_2_1",
      positionSeconds: 3100,
      durationSeconds: 3300,
      completed: true,
    },
    rahulToken
  );
  if (!progress2.completed || progress2.progressPercentage <= 0) {
    throw new Error("FAILED: Lesson was not marked complete after valid 94% watch time!");
  }
  console.log("   ✅ Lesson verified complete & parent enrollment progress recalculated:", {
    progressPercentage: `${progress2.progressPercentage}%`,
    completedCount: progress2.completedCount,
    totalLessons: progress2.totalLessons,
  });

  // ---------------------------------------------------------------------------
  // TEST 3: Quiz Session & Zero-Knowledge Answer Key Secrecy
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("📍 TEST 3: Quiz Attempt Session & Zero-Knowledge Answer Key Secrecy");
  console.log("--------------------------------------------------------------------------------");

  console.log("   3a. Starting quiz attempt for 'quiz_nextjs_basics'...");
  const quizSession = await callFunction(
    "startQuizAttempt",
    { courseId, quizId: "quiz_nextjs_basics" },
    rahulToken
  );

  console.log("   ✅ Quiz session started:", {
    attemptId: quizSession.attemptId,
    questionCount: quizSession.questions.length,
    passingScore: `${quizSession.passingScore}%`,
  });

  // Zero-Knowledge verification: Ensure none of the questions contain answer keys
  for (const q of quizSession.questions) {
    if ((q as any).correctIndices || (q as any).correctAnswer || (q as any).answer) {
      throw new Error(`CRITICAL SECURITY FAILURE: Question '${q.id}' leaked correct answers to the client!`);
    }
  }
  console.log("   🔒 Zero-Knowledge Verified: No answer keys or correct indices leaked in questions payload!");

  // 3b. Submit quiz attempt with correct responses
  console.log("   3b. Submitting responses to Cloud Function for server-side evaluation...");
  const quizResult = await callFunction(
    "submitQuizAttempt",
    {
      attemptId: quizSession.attemptId,
      responses: {
        q1: 1, // Server Components (mcq_single)
        q2: [0, 1, 2], // 'use client', 'use server', 'use cache' (mcq_multi)
        q3: true, // True (true_false)
        q4: "Transfer-Encoding: chunked", // Short answer containing "chunked"
      },
    },
    rahulToken
  );

  console.log("   ✅ Quiz submission graded on server:", {
    score: quizResult.score,
    totalPoints: quizResult.totalPoints,
    percentage: `${quizResult.percentage}%`,
    passed: quizResult.passed,
    isTimedOut: quizResult.isTimedOut,
  });

  if (!quizResult.passed || quizResult.percentage !== 100) {
    throw new Error(`FAILED: Expected 100% score and passed=true, got ${quizResult.percentage}%`);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Capstone Assignment Submission & Trainer Grading
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("📍 TEST 4: Assignment Submission & Trainer Evaluation Workflow");
  console.log("--------------------------------------------------------------------------------");

  console.log("   4a. Trainer grading submission 'sub_rahul_capstone'...");
  const gradeResult = await callFunction(
    "gradeAssignmentSubmission",
    {
      submissionId: "sub_rahul_capstone",
      grade: 96,
      feedback: "Phenomenal work on the App Router architecture and streaming Vercel AI SDK integration!",
      requestResubmission: false,
    },
    trainerToken
  );

  console.log("   ✅ Submission graded successfully:", {
    submissionId: gradeResult.submissionId,
    status: gradeResult.status,
    grade: `${gradeResult.grade}/100`,
  });

  // Verify notification was sent to student
  const notifQuery = await db.collection("notifications").where("userId", "==", rahulUid).get();
  if (notifQuery.empty) {
    throw new Error("FAILED: Student notification was not created upon grading!");
  }
  console.log("   📬 Student notification created:", notifQuery.docs[0].data().title);

  // ---------------------------------------------------------------------------
  // TEST 5: Verified Certificate Issuance & Idempotency
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("📍 TEST 5: PDFKit Certificate Generation & Public Verification QR Code");
  console.log("--------------------------------------------------------------------------------");

  // 5a. Student with < 100% completion attempts to claim certificate
  console.log("   5a. Incomplete student attempting to claim certificate...");
  let certBlocked = false;
  try {
    await callFunction(
      "issueCertificate",
      { courseId },
      rahulToken // Rahul is at ~66%
    );
  } catch (err: any) {
    if (err.message.includes("Course is not 100% completed")) {
      certBlocked = true;
    } else {
      throw err;
    }
  }
  if (!certBlocked) {
    throw new Error("FAILED: Incomplete student was able to claim a certificate!");
  }
  console.log("   ✅ Premature certificate claim was correctly BLOCKED (< 100% progress).");

  // 5b. Complete student claims certificate
  console.log("   5b. 100% complete student (Aarav Patel) claiming certificate...");
  // Ensure quiz attempt for Aarav is registered as passed
  await db.collection("quiz_attempts").doc(`attempt_aarav_${Date.now()}`).set({
    id: `attempt_aarav_${Date.now()}`,
    quizId: "quiz_nextjs_basics",
    courseId,
    userId: aaravUid,
    score: 100,
    totalPoints: 100,
    percentage: 100,
    passed: true,
    status: "completed",
    createdAt: FieldValue.serverTimestamp(),
  });

  const certResult = await callFunction(
    "issueCertificate",
    { courseId },
    aaravToken
  );

  console.log("   ✅ Certificate issued successfully:", {
    certificateId: certResult.certificateId,
    verificationUrl: certResult.verificationUrl,
    alreadyIssued: certResult.alreadyIssued || false,
  });

  if (!certResult.certificateId || !certResult.verificationUrl) {
    throw new Error("FAILED: Certificate ID or verification URL missing in response!");
  }

  // Verify certificate document in Firestore
  const certDoc = await db.collection("certificates").doc(certResult.certificateId).get();
  if (!certDoc.exists) {
    throw new Error("FAILED: Certificate doc was not found in /certificates collection!");
  }
  console.log("   📜 Verified Firestore Certificate Document:", {
    certificateNumber: certDoc.data()?.certificateNumber,
    studentName: certDoc.data()?.userName,
    courseTitle: certDoc.data()?.courseTitle,
    isRevoked: certDoc.data()?.isRevoked,
  });

  // ---------------------------------------------------------------------------
  // TEST 6: Verified Course Review & 25% Progress Gate
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("📍 TEST 6: Course Review Submission & 25% Completion Gate");
  console.log("--------------------------------------------------------------------------------");

  // 6a. Student with 0% progress attempts to leave a review
  console.log("   6a. Testing 0% progress student submitting review...");
  // Temporarily reset unenrolled/0% user enrollment
  await db.collection("enrollments").doc(`${unenrolledUid}_${courseId}`).set({
    id: `${unenrolledUid}_${courseId}`,
    userId: unenrolledUid,
    courseId,
    status: "active",
    progressPercentage: 10, // Under 25%
    enrolledAt: Timestamp.now(),
  });

  let reviewBlocked = false;
  try {
    await callFunction(
      "submitCourseReview",
      {
        courseId,
        rating: 5,
        reviewText: "Nice course!",
      },
      unenrolledToken
    );
  } catch (err: any) {
    if (err.message.includes("Minimum 25% course completion required")) {
      reviewBlocked = true;
    } else {
      throw err;
    }
  }
  if (!reviewBlocked) {
    throw new Error("FAILED: Student with <25% progress was able to post a course review!");
  }
  console.log("   ✅ Review correctly BLOCKED for student with <25% completion.");

  // 6b. Student with >= 25% progress (Rahul) posts review
  console.log("   6b. Student with >= 25% completion (Rahul at 66%) posting review...");
  const reviewRes = await callFunction(
    "submitCourseReview",
    {
      courseId,
      rating: 5,
      reviewText: "The hands-on architecture explanations here are 10x clearer than university courses. Helped me crack my off-campus SDE role!",
    },
    rahulToken
  );

  console.log("   ✅ Review submitted and course aggregates updated:", {
    rating: reviewRes.courseRating,
    ratingCount: reviewRes.ratingCount,
  });

  console.log("\n================================================================================");
  console.log("🏆 ALL PHASE 4 END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

runPhase4E2ETests().catch((err) => {
  console.error("\n❌ Phase 4 Test Suite Failed:", err);
  process.exit(1);
});
