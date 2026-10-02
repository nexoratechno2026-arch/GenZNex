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

export async function runPhase5E2ETests() {
  console.log("================================================================================");
  console.log("🎓 GENZNEX PHASE 5 END-TO-END TRAINING MODULE VERIFICATION SUITE");
  console.log("================================================================================\n");

  const adminUid = "admin_super_01";
  const trainerUid = "trainer_vikram_01";
  const studentUid = "student_rahul_01";

  const adminToken = await getIdTokenForUser("admin@genznex.in", adminUid, "admin", "Super Admin");
  const trainerToken = await getIdTokenForUser("vikram@genznex.in", trainerUid, "trainer", "Vikram Malhotra");
  const studentToken = await getIdTokenForUser("student@genznex.in", studentUid, "student", "Rahul Sharma");

  console.log("🔑 Generated Auth Tokens for Admin, Trainer, and Student.\n");

  // ---------------------------------------------------------------------------
  // 1. Training Program Creation & Publishing
  // ---------------------------------------------------------------------------
  console.log("🧪 TEST 1: Admin creates and publishes a new Training Program");
  const testProgramSlug = `e2e-program-${Date.now()}`;
  const createProgramRes = await callFunction("createProgram", {
    title: "E2E Cloud Native Architecture Track",
    slug: testProgramSlug,
    type: "skill_track",
    shortDescription: "End-to-end verified curriculum for cloud native architecture.",
    description: "Hands-on deep dive into Docker, Kubernetes, Terraform, and Serverless deployment patterns.",
    durationWeeks: 8,
    mode: "online",
    priceInPaise: 299900,
    curriculum: {
      linkedCourseIds: [],
      weeklySyllabus: [
        { week: 1, title: "Container Fundamentals", topics: ["Docker", "Multi-stage builds"] },
        { week: 2, title: "Kubernetes Orchestration", topics: ["Pods", "Services", "Ingress"] },
      ],
    },
  }, adminToken);

  const programId = createProgramRes.programId;
  console.log(`   ✅ Created Program ID: ${programId}`);

  // Publish Program
  await callFunction("publishProgram", { programId }, adminToken);
  console.log(`   ✅ Published Program.`);

  // ---------------------------------------------------------------------------
  // 2. Security: Student CANNOT create a Program
  // ---------------------------------------------------------------------------
  console.log("\n🧪 TEST 2: Student attempts to create a Program (Must FAIL)");
  try {
    await callFunction("createProgram", {
      title: "Hacked Program",
      slug: `hacked-${Date.now()}`,
      type: "bootcamp",
      shortDescription: "Unauthorized program attempt.",
      description: "Should fail with permission denied.",
      durationWeeks: 4,
      mode: "online",
      priceInPaise: 0,
    }, studentToken);
    throw new Error("Security breach: student created program!");
  } catch (err: any) {
    if (err.message.toLowerCase().includes("permission-denied") || err.message.toLowerCase().includes("admin")) {
      console.log(`   ✅ Correctly blocked: ${err.message}`);
    } else {
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Batch Creation
  // ---------------------------------------------------------------------------
  console.log("\n🧪 TEST 3: Admin creates a Batch for the program");
  const createBatchRes = await callFunction("createBatch", {
    programId,
    name: "Cohort E2E-1",
    trainerIds: [trainerUid],
    startDate: "2026-11-01",
    endDate: "2026-12-30",
    weeklySchedule: {
      days: ["Mon", "Wed"],
      timeIST: "18:00",
    },
    capacity: 25,
    enrollmentDeadline: "2026-10-31",
    waitlistEnabled: true,
    minAttendancePercent: 75,
    priceInPaise: 299900,
  }, adminToken);

  const batchId = createBatchRes.batchId;
  console.log(`   ✅ Created Batch ID: ${batchId}`);

  // ---------------------------------------------------------------------------
  // 4. Batch Enrollment
  // ---------------------------------------------------------------------------
  console.log("\n🧪 TEST 4: Student enrolls in the Batch");
  const enrollRes = await callFunction("enrollInBatch", {
    batchId,
    paymentId: "pay_test_p5_mock",
    orderId: "order_test_p5_mock",
  }, studentToken);
  console.log(`   ✅ Enrolled student into Batch: status=${enrollRes.status}`);

  // Verify enrollment document exists in Firestore
  const enrollSnap = await db.collection("batch_enrollments").doc(`${batchId}_${studentUid}`).get();
  if (!enrollSnap.exists) throw new Error("Enrollment document not found in Firestore!");
  console.log(`   ✅ Verified batch_enrollments/${batchId}_${studentUid} exists.`);

  // ---------------------------------------------------------------------------
  // 5. Live Sessions & Attendance
  // ---------------------------------------------------------------------------
  console.log("\n🧪 TEST 5: Trainer creates a Session and marks attendance");
  const createSessionRes = await callFunction("createSession", {
    batchId,
    title: "Session 1: Container Foundations",
    date: "2026-11-02",
    startTimeIST: "18:00",
    durationMinutes: 90,
    topic: "Containers & Registries",
    meetingProvider: "google_meet",
    joinLink: "https://meet.google.com/test-e2e-session",
  }, trainerToken);

  const sessionId = createSessionRes.sessionId;
  console.log(`   ✅ Created Session ID: ${sessionId}`);

  // Mark Attendance
  await callFunction("markSessionAttendance", {
    sessionId,
    batchId,
    records: [
      { userId: studentUid, status: "present", remarks: "Active participation" },
    ],
  }, trainerToken);
  console.log(`   ✅ Trainer marked attendance: present.`);

  // ---------------------------------------------------------------------------
  // 6. Capstone Projects & Submissions
  // ---------------------------------------------------------------------------
  console.log("\n🧪 TEST 6: Project Creation, Milestone Submission & Grading");
  const createProjRes = await callFunction("createProject", {
    batchId,
    title: "Cloud Native Microservices App",
    brief: "Build and deploy a scalable microservices architecture on GKE.",
    requirements: ["Dockerfile", "Helm charts", "Ingress config"],
    rubric: [
      { criterionId: "arch", criterion: "Architecture", description: "Design", maxPoints: 50, weight: 0.5 },
      { criterionId: "code", criterion: "Code Quality", description: "Clean code", maxPoints: 50, weight: 0.5 },
    ],
    milestones: [
      { id: "m1", title: "Containerization", description: "Write Dockerfiles", dueDate: "2026-11-15", order: 1 },
    ],
    allowedSubmissionTypes: ["github_url", "demo_url"],
    teamSize: 1,
  }, trainerToken);

  const projectId = createProjRes.projectId;
  console.log(`   ✅ Created Capstone Project ID: ${projectId}`);

  // Student submits milestone
  const submitRes = await callFunction("submitProjectMilestone", {
    projectId,
    batchId,
    milestoneId: "m1",
    description: "Completed multi-stage Docker build with zero vulnerabilities.",
    githubUrl: "https://github.com/rahul-sharma/cloud-native-app",
    demoUrl: "https://cloud-native-app.vercel.app",
  }, studentToken);

  const submissionId = submitRes.submissionId;
  console.log(`   ✅ Student submitted milestone: Submission ID: ${submissionId}`);

  // Trainer grades submission
  const gradeRes = await callFunction("gradeProjectMilestone", {
    submissionId,
    rubricScores: { arch: 48, code: 47 },
    feedback: "Superb multi-stage optimization and security headers.",
    requestChanges: false,
  }, trainerToken);
  console.log(`   ✅ Trainer graded milestone: Total Score=${gradeRes.totalScore}/100.`);

  // Student opts in to public showcase
  await callFunction("optInToShowcase", {
    submissionId,
    consent: true,
  }, studentToken);
  console.log(`   ✅ Student consented to public showcase feature.`);

  // ---------------------------------------------------------------------------
  // 7. Mock Interviews & Scheduling
  // ---------------------------------------------------------------------------
  console.log("\n🧪 TEST 7: Mock Interview Availability & Booking");
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  await callFunction("publishAvailability", {
    date: tomorrowStr,
    slots: [{ time: "16:00" }, { time: "17:00" }],
  }, trainerToken);
  console.log(`   ✅ Trainer published interview availability slots.`);

  const bookRes = await callFunction("bookMockInterview", {
    interviewerId: trainerUid,
    date: tomorrowStr,
    time: "16:00",
    batchId,
  }, studentToken);

  const interviewId = bookRes.interviewId;
  console.log(`   ✅ Student booked interview slot: Interview ID: ${interviewId}`);

  // Trainer submits feedback
  await callFunction("submitInterviewFeedback", {
    interviewId,
    communication: 5,
    technicalDepth: 4,
    problemSolving: 5,
    confidence: 4,
    overall: 5,
    strengths: "Clear explanations, solid problem framing.",
    improvements: "Practice edge-case analysis in system scaling.",
  }, trainerToken);
  console.log(`   ✅ Trainer submitted interview ratings & feedback.`);

  // ---------------------------------------------------------------------------
  // 8. Jobs, Applications & Resume
  // ---------------------------------------------------------------------------
  console.log("\n🧪 TEST 8: Placement Job Posting & Student Application Pipeline");
  const createJobRes = await callFunction("createJob", {
    title: "Junior Cloud Architect",
    companyName: "DevOps Cloud Technologies",
    location: "Bengaluru (Hybrid)",
    type: "Full-time",
    stipendOrSalary: "₹10,00,000 - ₹14,00,000 CTC",
    description: "Architecting serverless APIs and managing cloud infrastructure.",
    requirements: ["Hands on with Docker, Kubernetes, CI/CD"],
    skills: ["Docker", "Kubernetes", "TypeScript", "Next.js"],
    applyMethod: "internal",
    deadline: "2026-12-31",
  }, adminToken);

  const jobId = createJobRes.jobId;
  console.log(`   ✅ Admin posted Job ID: ${jobId}`);

  // Student applies to job
  const applyRes = await callFunction("applyToJob", {
    jobId,
    batchId,
    programId,
  }, studentToken);

  const applicationId = applyRes.applicationId;
  console.log(`   ✅ Student submitted Job Application ID: ${applicationId}`);

  // Admin updates application status to shortlisted
  await callFunction("updateApplicationStatus", {
    applicationId,
    status: "shortlisted",
    note: "Profile approved for round 1 interview.",
  }, adminToken);
  console.log(`   ✅ Admin updated application status: shortlisted.`);

  // Student updates resume
  await callFunction("saveResume", {
    headline: "Cloud Native Software Engineer",
    summary: "Specializing in Next.js 15, TypeScript, and Docker container architectures.",
    skills: ["TypeScript", "Next.js", "Docker", "Kubernetes", "Firebase"],
    preferredRoles: ["Cloud Engineer", "Full Stack Engineer"],
    preferredLocations: ["Bengaluru", "Remote"],
    resumeTemplate: "modern",
    isProfileVisible: true,
  }, studentToken);
  console.log(`   ✅ Student saved verified resume and profile visibility.`);

  console.log("\n================================================================================");
  console.log("🎉 ALL 8 TEST SUITES (18 FUNCTION CALLS & WORKFLOWS) PASSED WITH ZERO ERRORS!");
  console.log("================================================================================\n");
}

if (require.main === module) {
  runPhase5E2ETests().catch((err) => {
    console.error("❌ Phase 5 E2E Test Failed:", err);
    process.exit(1);
  });
}
