import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const app = getApps().length === 0
  ? initializeApp({ projectId: "demo-genznex" })
  : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

async function seedPhase4() {
  console.log("🚀 Starting Phase 4 Firestore Seed for GenZNex...");

  const courseId = "course_nextjs_fullstack";

  // 1. Ensure Auth users exist
  const users = [
    {
      uid: "student_rahul_01",
      email: "student@genznex.in",
      displayName: "Rahul Sharma",
      role: "student",
    },
    {
      uid: "student_completed_01",
      email: "aarav@genznex.in",
      displayName: "Aarav Patel",
      role: "student",
    },
    {
      uid: "trainer_vikram_01",
      email: "vikram@genznex.in",
      displayName: "Vikram Malhotra",
      role: "trainer",
    },
  ];

  for (const u of users) {
    try {
      await auth.createUser({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
      });
      await auth.setCustomUserClaims(u.uid, { role: u.role });
    } catch {
      // User might already exist, update claims
      await auth.setCustomUserClaims(u.uid, { role: u.role });
    }

    await db.collection("users").doc(u.uid).set(
      {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  // 2. Seed Quizzes for course_nextjs_fullstack
  const quiz1Id = "quiz_nextjs_basics";
  const quiz1Ref = db.collection("courses").doc(courseId).collection("quizzes").doc(quiz1Id);

  await quiz1Ref.set({
    id: quiz1Id,
    courseId,
    title: "Next.js 15 Foundations Checkpoint",
    description: "Test your understanding of React Server Components, Streaming SSR, and Server Actions.",
    passingScore: 70,
    timeLimitMinutes: 10,
    maxAttempts: 3,
    questionCount: 4,
    questions: [
      {
        id: "q1",
        type: "mcq_single",
        text: "Which of the following components render exclusively on the server in Next.js App Router by default?",
        options: ["Client Components", "Server Components", "Suspense Boundaries", "Route Handlers"],
        points: 25,
        explanation: "By default, all components inside the Next.js App Router are React Server Components.",
      },
      {
        id: "q2",
        type: "mcq_multi",
        text: "Which of the following directives are valid in modern Next.js 15?",
        options: ["'use client'", "'use server'", "'use cache'", "'use strict'"],
        points: 25,
        explanation: "'use client', 'use server', and the new Next.js 15 'use cache' are supported directives.",
      },
      {
        id: "q3",
        type: "true_false",
        text: "Server Actions can be invoked directly from within Client Components as form actions or event handlers.",
        options: ["True", "False"],
        points: 25,
        explanation: "Server Actions can be passed to Client Components as props or imported directly and called inside event handlers.",
      },
      {
        id: "q4",
        type: "short_answer",
        text: "What standard HTTP header mechanism does Next.js use under the hood for Streaming SSR?",
        points: 25,
        explanation: "Next.js utilizes HTTP Chunked Transfer Encoding to stream rendered HTML chunks progressively.",
      },
    ],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // CRITICAL: Seed Private Answer Key (locked by Security Rules)
  await quiz1Ref.collection("private").doc("answers").set({
    id: "answers",
    quizId: quiz1Id,
    answers: {
      q1: {
        correctOptionIndex: 1,
        correctIndices: [1],
      },
      q2: {
        correctIndices: [0, 1, 2],
      },
      q3: {
        correctBoolean: true,
      },
      q4: {
        correctText: "chunked",
        keywords: ["chunked", "stream", "transfer-encoding"],
      },
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("✅ Seeded Quiz 1 with Private Answers!");

  // Also seed quiz in root collection as fallback
  await db.collection("quizzes").doc(quiz1Id).set({
    id: quiz1Id,
    courseId,
    title: "Next.js 15 Foundations Checkpoint",
    passingScore: 70,
    timeLimitMinutes: 10,
    maxAttempts: 3,
    questions: (await quiz1Ref.get()).data()?.questions || [],
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection("quizzes").doc(quiz1Id).collection("private").doc("answers").set({
    id: "answers",
    quizId: quiz1Id,
    answers: {
      q1: { correctOptionIndex: 1, correctIndices: [1] },
      q2: { correctIndices: [0, 1, 2] },
      q3: { correctBoolean: true },
      q4: { correctText: "chunked", keywords: ["chunked", "stream"] },
    },
  });

  // 3. Seed Capstone Assignment
  const assignId = "assign_ai_capstone";
  const assignRef = db.collection("courses").doc(courseId).collection("assignments").doc(assignId);

  await assignRef.set({
    id: assignId,
    courseId,
    title: "Capstone: Next.js 15 AI-Powered SaaS Application",
    description: "Build and deploy an enterprise-grade AI SaaS application with streaming text, server actions, and responsive Tailwind UI.",
    instructions: "Submit your public GitHub repository URL and a live deployed Vercel URL. Ensure you have comprehensive unit/e2e tests and an architecture diagram.",
    maxScore: 100,
    allowedFileTypes: [".pdf", ".zip", ".png"],
    maxFileSizeBytes: 10485760, // 10MB
    dueDate: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days ahead
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Also seed root assignments collection as fallback
  await db.collection("assignments").doc(assignId).set({
    id: assignId,
    courseId,
    title: "Capstone: Next.js 15 AI-Powered SaaS Application",
    maxScore: 100,
    dueDate: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  console.log("✅ Seeded Capstone Assignment!");

  // 4. Seed Submission for Trainer Review Queue
  const subId = "sub_rahul_capstone";
  await db.collection("submissions").doc(subId).set({
    id: subId,
    assignmentId: assignId,
    assignmentTitle: "Capstone: Next.js 15 AI-Powered SaaS Application",
    courseId,
    courseTitle: "Full Stack Next.js 15 & AI Apps Mastery",
    studentId: "student_rahul_01",
    studentName: "Rahul Sharma",
    studentEmail: "student@genznex.in",
    textContent: "https://github.com/rahulsharma/nextjs-ai-saas\nDeployed live on Vercel at https://ai-saas-rahul.vercel.app\nBuilt using Next.js 15 App Router, Server Actions, and Vercel AI SDK.",
    status: "submitted",
    submittedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("✅ Seeded Student Submission!");

  // 5. Seed Student Enrollments
  // Student 1: Rahul Sharma (66% progress)
  const rahulEnrollRef = db.collection("enrollments").doc(`student_rahul_01_${courseId}`);
  await rahulEnrollRef.set({
    id: rahulEnrollRef.id,
    userId: "student_rahul_01",
    courseId,
    trainerId: "trainer_vikram_01",
    status: "active",
    progressPercentage: 66,
    completedLessons: ["nextjs_intro_01", "nextjs_rsc_02"],
    lastAccessedLessonId: "nextjs_rsc_02",
    enrolledAt: Timestamp.fromMillis(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await rahulEnrollRef.collection("lesson_progress").doc("nextjs_intro_01").set({
    id: "nextjs_intro_01",
    lessonId: "nextjs_intro_01",
    courseId,
    userId: "student_rahul_01",
    positionSeconds: 1500,
    durationSeconds: 1500,
    completed: true,
    completedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await rahulEnrollRef.collection("lesson_progress").doc("nextjs_rsc_02").set({
    id: "nextjs_rsc_02",
    lessonId: "nextjs_rsc_02",
    courseId,
    userId: "student_rahul_01",
    positionSeconds: 2600,
    durationSeconds: 2700,
    completed: true,
    completedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Student 2: Aarav Patel (100% progress + Certificate)
  const aaravEnrollRef = db.collection("enrollments").doc(`student_completed_01_${courseId}`);
  const certId = "GZN-2026-A1B2C3D4";

  await aaravEnrollRef.set({
    id: aaravEnrollRef.id,
    userId: "student_completed_01",
    courseId,
    trainerId: "trainer_vikram_01",
    status: "completed",
    progressPercentage: 100,
    completedLessons: [
      "nextjs_intro_01",
      "nextjs_rsc_02",
      "nextjs_cheatsheet_03",
      "nextjs_ai_04",
      "nextjs_actions_05",
      "nextjs_repo_06",
    ],
    lastAccessedLessonId: "nextjs_repo_06",
    certificateIssued: true,
    certificateId: certId,
    enrolledAt: Timestamp.fromMillis(Date.now() - 14 * 24 * 60 * 60 * 1000),
    completedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 6. Seed Certificate Document
  await db.collection("certificates").doc(certId).set({
    id: certId,
    certificateNumber: certId,
    userId: "student_completed_01",
    userName: "Aarav Patel",
    courseId,
    courseTitle: "Full Stack Next.js 15 & AI Apps Mastery",
    trainerId: "trainer_vikram_01",
    trainerName: "Vikram Malhotra",
    issueDate: Timestamp.now(),
    completionPercentage: 100,
    gradePercent: 100,
    qrCodeData: `http://localhost:3000/verify/${certId}`,
    verificationUrl: `http://localhost:3000/verify/${certId}`,
    pdfUrl: `https://storage.googleapis.com/demo-genznex.appspot.com/certificates/${certId}.pdf`,
    storagePath: `certificates/${certId}.pdf`,
    isRevoked: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("✅ Seeded Verified Certificate for Aarav Patel!");

  // 7. Seed Reviews
  await db.collection("courses").doc(courseId).collection("reviews").doc("student_completed_01").set({
    id: "student_completed_01",
    courseId,
    userId: "student_completed_01",
    userName: "Aarav Patel",
    userAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
    rating: 5,
    reviewText: "Phenomenal bootcamp! The deep dive into React Server Components and Vercel AI SDK gave me the confidence to build my own startup. Placed at an AI lab in Bangalore!",
    createdAt: Timestamp.fromMillis(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("courses").doc(courseId).collection("reviews").doc("student_rahul_01").set({
    id: "student_rahul_01",
    courseId,
    userId: "student_rahul_01",
    userName: "Rahul Sharma",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 5,
    reviewText: "Hands down the best practical Next.js 15 curriculum in India. Clear explanations of server actions, optimistic UI, and caching strategies.",
    createdAt: Timestamp.fromMillis(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("✅ Seeded Verified Course Reviews!");
  console.log("🎉 Phase 4 Seeding Complete!");
}

seedPhase4().catch((err) => {
  console.error("❌ Phase 4 Seed Error:", err);
  process.exit(1);
});
