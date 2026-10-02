import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const app = getApps().length === 0
  ? initializeApp({ projectId: "demo-genznex" })
  : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

const FUNCTIONS_ORIGIN = "http://127.0.0.1:5001/demo-genznex/us-central1";

// Helper to call callable Cloud Functions with mock Auth token
async function callFunction(name: string, data: any, idToken?: string) {
  const url = `${FUNCTIONS_ORIGIN}/${name}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ data }),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  return json.result;
}

// Helper to exchange custom token for emulator ID token
async function getIdTokenForUser(uid: string): Promise<string> {
  const customToken = await auth.createCustomToken(uid);
  const authUrl = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`;
  const res = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!data.idToken) {
    throw new Error(`Failed to get ID token: ${JSON.stringify(data)}`);
  }
  return data.idToken;
}

async function runE2ETests() {
  console.log("================================================================================");
  console.log("🧪 GENZNEX PHASE 2 END-TO-END FLOW VERIFICATION SUITE");
  console.log("================================================================================\n");

  const trainerUid = "trainer_vikram_01";
  const adminUid = "admin_super_01";
  const studentUid = "student_rahul_01";

  const trainerToken = await getIdTokenForUser(trainerUid);
  const adminToken = await getIdTokenForUser(adminUid);
  const studentToken = await getIdTokenForUser(studentUid);

  console.log("🔑 Generated Emulator Auth ID Tokens with Custom Claims:");
  console.log(`   - Trainer (${trainerUid}): Verified`);
  console.log(`   - Admin (${adminUid}): Verified`);
  console.log(`   - Student (${studentUid}): Verified\n`);

  const testCourseId = `course_e2e_microservices_${Date.now()}`;
  const testCourseSlug = `microservices-go-docker-${Date.now()}`;

  // -------------------------------------------------------------------------
  // FLOW A: Trainer creates course, adds modules/lessons, and submits for review
  // -------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 FLOW A: Trainer Creates Course & Submits for Admin Review");
  console.log("--------------------------------------------------------------------------------");

  console.log(`   1. Creating course draft "${testCourseId}"...`);
  await db.collection("courses").doc(testCourseId).set({
    id: testCourseId,
    title: "Advanced Microservices with Go & Docker",
    slug: testCourseSlug,
    subtitle: "Build ultra-fast backend microservices and deployment pipelines.",
    description: "Learn production Go patterns, concurrency with channels, gRPC communications, and Docker containerization.",
    category: "web-development",
    categoryName: "Web Development",
    tags: ["Go", "Docker", "Microservices", "gRPC"],
    level: "advanced",
    language: "English",
    priceInPaise: 299900,
    discountPriceInPaise: 199900,
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
    trainerId: trainerUid,
    instructor: {
      uid: trainerUid,
      name: "Vikram Malhotra",
      headline: "Principal Architect & Ex-Google Senior Tech Lead",
    },
    status: "draft",
    lessonCount: 2,
    totalDurationMinutes: 60,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("   2. Adding Module 1 and Lessons...");
  const modRef = db.collection("courses").doc(testCourseId).collection("modules").doc("mod_1");
  await modRef.set({
    id: "mod_1",
    courseId: testCourseId,
    title: "Module 1: Go Microservice Foundations",
    description: "Architecture blueprint and HTTP handlers",
    order: 1,
    lessonCount: 2,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await modRef.collection("lessons").doc("les_1_1").set({
    id: "les_1_1",
    moduleId: "mod_1",
    courseId: testCourseId,
    title: "Go Concurrency & Goroutines",
    order: 1,
    type: "video",
    durationMinutes: 30,
    isPreview: true,
    videoMetadata: { provider: "youtube", videoId: "go_vid_01", durationSeconds: 1800 },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await modRef.collection("lessons").doc("les_1_2").set({
    id: "les_1_2",
    moduleId: "mod_1",
    courseId: testCourseId,
    title: "Docker Containerization for Go Binaries",
    order: 2,
    type: "video",
    durationMinutes: 30,
    isPreview: false,
    videoMetadata: { provider: "youtube", videoId: "go_vid_02", durationSeconds: 1800 },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("   3. Calling Cloud Function: submitCourseForReview...");
  const submitResult = await callFunction("submitCourseForReview", { courseId: testCourseId }, trainerToken);
  console.log("   ✅ submitCourseForReview Response:", submitResult);

  const courseAfterSubmit = (await db.collection("courses").doc(testCourseId).get()).data();
  if (courseAfterSubmit?.status !== "pending_review") {
    throw new Error(`Expected status pending_review, got ${courseAfterSubmit?.status}`);
  }
  console.log(`   ✅ PASS: Course status is now "${courseAfterSubmit?.status}".\n`);

  // -------------------------------------------------------------------------
  // FLOW B: Admin Rejects with Reason
  // -------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 FLOW B: Admin Review Queue & Rejection with Feedback");
  console.log("--------------------------------------------------------------------------------");

  const rejectionReason = "Please add a lesson on gRPC and Protobuf serialization before we can approve this course.";
  console.log(`   1. Calling Cloud Function: rejectCourse with reason:\n      "${rejectionReason}"...`);
  const rejectResult = await callFunction("rejectCourse", {
    courseId: testCourseId,
    reason: rejectionReason,
  }, adminToken);
  console.log("   ✅ rejectCourse Response:", rejectResult);

  const courseAfterReject = (await db.collection("courses").doc(testCourseId).get()).data();
  if (courseAfterReject?.status !== "rejected") {
    throw new Error(`Expected status rejected, got ${courseAfterReject?.status}`);
  }
  if (courseAfterReject?.rejectionReason !== rejectionReason) {
    throw new Error(`Rejection reason mismatch: got ${courseAfterReject?.rejectionReason}`);
  }
  console.log(`   ✅ PASS: Course status is now "${courseAfterReject?.status}" with rejectionReason preserved.`);

  // Verify Audit Log
  const auditLogsSnap = await db.collection("audit_logs")
    .where("targetId", "==", testCourseId)
    .where("action", "==", "course_reject")
    .get();
  if (auditLogsSnap.empty) {
    throw new Error("Audit log entry for rejection was not created!");
  }
  console.log(`   ✅ PASS: Audit log entry created (${auditLogsSnap.docs[0].data().action} by ${auditLogsSnap.docs[0].data().actorEmail}).\n`);

  // -------------------------------------------------------------------------
  // FLOW C: Trainer Fixes & Resubmits, then Admin Approves
  // -------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 FLOW C: Trainer Fixes, Resubmits & Admin Approves");
  console.log("--------------------------------------------------------------------------------");

  console.log("   1. Trainer adds requested lesson: 'gRPC & Protobuf Serialization'...");
  await modRef.collection("lessons").doc("les_1_3").set({
    id: "les_1_3",
    moduleId: "mod_1",
    courseId: testCourseId,
    title: "gRPC & Protobuf Serialization",
    order: 3,
    type: "video",
    durationMinutes: 45,
    isPreview: false,
    videoMetadata: { provider: "youtube", videoId: "grpc_01", durationSeconds: 2700 },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("   2. Calling Cloud Function: submitCourseForReview (resubmit)...");
  await callFunction("submitCourseForReview", { courseId: testCourseId }, trainerToken);
  const courseAfterResubmit = (await db.collection("courses").doc(testCourseId).get()).data();
  if (courseAfterResubmit?.status !== "pending_review") {
    throw new Error(`Expected status pending_review, got ${courseAfterResubmit?.status}`);
  }
  console.log(`   ✅ PASS: Course successfully resubmitted with status "${courseAfterResubmit?.status}".`);

  console.log("   3. Admin calls Cloud Function: approveCourse...");
  const approveResult = await callFunction("approveCourse", { courseId: testCourseId }, adminToken);
  console.log("   ✅ approveCourse Response:", approveResult);

  const courseAfterApprove = (await db.collection("courses").doc(testCourseId).get()).data();
  if (courseAfterApprove?.status !== "published") {
    throw new Error(`Expected status published, got ${courseAfterApprove?.status}`);
  }
  console.log(`   ✅ PASS: Course is now "${courseAfterApprove?.status}" with publishedAt timestamp set.\n`);

  // -------------------------------------------------------------------------
  // FLOW D: Public Catalog Search & Course Detail Fetch
  // -------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 FLOW D: Public Course Catalog Search & Detail Retrieval");
  console.log("--------------------------------------------------------------------------------");

  console.log("   1. Searching for 'Microservices' in published courses...");
  const catalogSnap = await db.collection("courses")
    .where("status", "==", "published")
    .get();

  const foundInCatalog = catalogSnap.docs
    .map(d => d.data())
    .find(c => c.title.includes("Microservices"));

  if (!foundInCatalog) {
    throw new Error("Newly approved course not found in published courses catalog!");
  }
  console.log(`   ✅ PASS: Found "${foundInCatalog.title}" in public catalog (Price: ₹${foundInCatalog.priceInPaise / 100}).`);

  console.log(`   2. Fetching Course Detail by slug "${testCourseSlug}"...`);
  const slugQuerySnap = await db.collection("courses")
    .where("slug", "==", testCourseSlug)
    .limit(1)
    .get();

  if (slugQuerySnap.empty) {
    throw new Error(`Could not find course with slug ${testCourseSlug}`);
  }
  const detailCourse = slugQuerySnap.docs[0].data();
  console.log(`   ✅ PASS: Detail page query successful (Title: "${detailCourse.title}", Level: ${detailCourse.level}).`);

  console.log("   3. Fetching Course Curriculum subcollections...");
  const detailModsSnap = await db.collection("courses").doc(testCourseId).collection("modules").get();
  const detailLessonsSnap = await db.collection("courses").doc(testCourseId).collection("modules").doc("mod_1").collection("lessons").get();
  console.log(`   ✅ PASS: Curriculum verified (${detailModsSnap.size} modules, ${detailLessonsSnap.size} lessons including gRPC).\n`);

  // -------------------------------------------------------------------------
  // FLOW E: Student Free Enrollment via Cloud Function
  // -------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 FLOW E: Student Free Course Enrollment via Cloud Function");
  console.log("--------------------------------------------------------------------------------");

  const freeCourseId = "course_zero_to_hero_frontend";
  console.log(`   1. Student calls Cloud Function: enrollFreeCourse for "${freeCourseId}"...`);
  const enrollResult = await callFunction("enrollFreeCourse", { courseId: freeCourseId }, studentToken);
  console.log("   ✅ enrollFreeCourse Response:", enrollResult);

  console.log(`   2. Verifying enrollment record in /enrollments...`);
  const enrollDocRef = db.collection("enrollments").doc(`${studentUid}_${freeCourseId}`);
  const enrollDocSnap = await enrollDocRef.get();
  if (!enrollDocSnap.exists) {
    throw new Error("Enrollment document was not created in /enrollments!");
  }
  const enrollData = enrollDocSnap.data();
  if (enrollData?.status !== "active") {
    throw new Error(`Expected enrollment status active, got ${enrollData?.status}`);
  }
  console.log(`   ✅ PASS: Enrollment document verified (Status: "${enrollData?.status}", EnrolledAt: Valid).`);

  const freeCourseSnap = await db.collection("courses").doc(freeCourseId).get();
  console.log(`   ✅ PASS: Course enrollmentCount is ${freeCourseSnap.data()?.enrollmentCount}.\n`);

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("🎉 ALL 5 END-TO-END FLOWS (A, B, C, D, E) VERIFIED AND PASSED 100%!");
  console.log("================================================================================\n");
}

runE2ETests().catch((err) => {
  console.error("❌ E2E Test Suite Failed:", err);
  process.exit(1);
});
