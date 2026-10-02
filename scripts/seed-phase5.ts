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

export async function seedPhase5() {
  console.log("================================================================================");
  console.log("🚀 STARTING PHASE 5 SEED: STUDENT TRAINING MODULE & COHORTS");
  console.log("================================================================================\n");

  const adminUid = "admin_super_01";
  const trainerUid = "trainer_vikram_01";
  const student1Uid = "student_rahul_01";
  const student2Uid = "student_completed_01";

  // 1. Ensure Auth Users with claims
  const seedUsers = [
    { uid: adminUid, email: "admin@genznex.in", displayName: "Super Admin", role: "admin" },
    { uid: trainerUid, email: "vikram@genznex.in", displayName: "Vikram Malhotra", role: "trainer" },
    { uid: student1Uid, email: "student@genznex.in", displayName: "Rahul Sharma", role: "student" },
    { uid: student2Uid, email: "aarav@genznex.in", displayName: "Aarav Patel", role: "student" },
  ];

  for (const u of seedUsers) {
    try {
      await auth.createUser({ uid: u.uid, email: u.email, displayName: u.displayName });
      await auth.setCustomUserClaims(u.uid, { role: u.role });
    } catch {
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
  console.log("✅ Verified and seeded Auth users & roles.");

  // 2. Seed Training Programs
  const programs = [
    {
      id: "program_fullstack_genai",
      title: "Full Stack GenAI Career Track",
      slug: "full-stack-genai-career-track",
      type: "bootcamp",
      shortDescription: "Master Next.js 15, Agentic AI architectures, LLM orchestration, and production deployments.",
      description: "A comprehensive 12-week intensive cohort designed to transform aspiring engineers into high-impact full-stack AI builders. Learn server-side rendering, streaming SSR, LangChain, vector databases, and scalable cloud architectures.",
      durationWeeks: 12,
      mode: "online",
      priceInPaise: 499900, // ₹4,999
      status: "published",
      isFeatured: true,
      instructorIds: [trainerUid],
      curriculum: {
        linkedCourseIds: ["course_nextjs_fullstack"],
        weeklySyllabus: [
          { weekNumber: 1, title: "Modern TypeScript & Advanced React 19 Patterns", description: "Hooks, transitions, server actions, optimistic UI", sessionCount: 3, assignmentCount: 1 },
          { weekNumber: 2, title: "Next.js 15 App Router Deep Dive", description: "Layouts, Route Handlers, Streaming SSR, Parallel Routes", sessionCount: 3, assignmentCount: 1 },
          { weekNumber: 3, title: "Database Architecture with Firestore & Vector Search", description: "Security rules, indexing, vector embeddings with Pinecone", sessionCount: 3, assignmentCount: 1 },
          { weekNumber: 4, title: "Building Production GenAI Copilots", description: "LLM streaming, function calling, tool use with Gemini 2.5", sessionCount: 3, assignmentCount: 2 },
          { weekNumber: 5, title: "Capstone Project Launch & Team Building", description: "Project proposal, architecture review, milestone planning", sessionCount: 2, assignmentCount: 1 },
        ],
      },
      outcomes: [
        "Architect production-grade Full-Stack applications using Next.js 15 & TypeScript",
        "Deploy end-to-end Agentic AI systems with real-time streaming",
        "Master cloud native serverless backend patterns with Cloud Functions 2nd gen",
        "Graduate with an industry-grade portfolio Capstone project verified on GitHub",
      ],
      eligibility: "Prior familiarity with JavaScript and web fundamentals. Open to college students and early-career developers.",
      createdBy: adminUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      id: "program_prompt_internship",
      title: "Prompt Engineering & Agentic AI Internship",
      slug: "prompt-engineering-agentic-ai-internship",
      type: "internship",
      shortDescription: "8-week cohort with real enterprise problem statements, client simulations, and mentor feedback.",
      description: "An immersive apprenticeship where students collaborate in sprint teams to build AI solutions for real-world business challenges. Includes weekly code reviews, industry mentor AMA sessions, and live showcases.",
      durationWeeks: 8,
      mode: "hybrid",
      priceInPaise: 299900, // ₹2,999
      status: "published",
      isFeatured: true,
      instructorIds: [trainerUid],
      curriculum: {
        linkedCourseIds: [],
        weeklySyllabus: [
          { weekNumber: 1, title: "Enterprise AI Fundamentals & Prompt Systems", description: "System prompting, COT, ReAct loop", sessionCount: 2, assignmentCount: 1 },
          { weekNumber: 2, title: "RAG Systems with Embeddings & Vector Stores", description: "Chunking strategies, hybrid search, rerankers", sessionCount: 2, assignmentCount: 1 },
          { weekNumber: 3, title: "Autonomous Agents & Tool Calling", description: "Agent swarms, execution loops, guardrails", sessionCount: 2, assignmentCount: 1 },
        ],
      },
      outcomes: [
        "Hands-on experience delivering enterprise AI prototypes",
        "Experience collaborating in Agile Scrum teams with Git flow",
        "Verified internship completion certificate and recommendation letter",
      ],
      eligibility: "Open to 2nd/3rd/4th year engineering and BCA/MCA students.",
      createdBy: adminUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  ];

  for (const p of programs) {
    await db.collection("training_programs").doc(p.id).set(p);
  }
  console.log("✅ Seeded Training Programs (Full Stack GenAI + Prompt Internship).");

  // 3. Seed Program Batches
  const batches = [
    {
      id: "batch_genai_cohort_1",
      programId: "program_fullstack_genai",
      programTitle: "Full Stack GenAI Career Track",
      name: "Cohort 1 - Alpha",
      trainerIds: [trainerUid],
      mentorIds: [trainerUid],
      startDate: "2026-10-05",
      endDate: "2026-12-28",
      weeklySchedule: { days: ["Mon", "Wed", "Fri"], timeIST: "19:00" },
      timezone: "Asia/Kolkata",
      capacity: 40,
      enrolledCount: 24,
      enrollmentDeadline: "2026-10-04",
      status: "ongoing",
      waitlistEnabled: true,
      waitlistStudentIds: [],
      minAttendancePercent: 75,
      priceInPaise: 499900,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      id: "batch_genai_cohort_2",
      programId: "program_fullstack_genai",
      programTitle: "Full Stack GenAI Career Track",
      name: "Cohort 2 - Beta (Upcoming)",
      trainerIds: [trainerUid],
      mentorIds: [],
      startDate: "2026-11-01",
      endDate: "2027-01-24",
      weeklySchedule: { days: ["Tue", "Thu", "Sat"], timeIST: "20:00" },
      timezone: "Asia/Kolkata",
      capacity: 50,
      enrolledCount: 12,
      enrollmentDeadline: "2026-10-31",
      status: "open",
      waitlistEnabled: true,
      waitlistStudentIds: [],
      minAttendancePercent: 75,
      priceInPaise: 499900,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  ];

  for (const b of batches) {
    await db.collection("program_batches").doc(b.id).set(b);
  }
  console.log("✅ Seeded Program Batches.");

  // 4. Seed Batch Enrollments
  const enrollments = [
    {
      id: `batch_genai_cohort_1_${student1Uid}`,
      batchId: "batch_genai_cohort_1",
      userId: student1Uid,
      userName: "Rahul Sharma",
      userEmail: "student@genznex.in",
      programId: "program_fullstack_genai",
      orderId: "order_mock_p5_01",
      paymentId: "pay_mock_p5_01",
      status: "active",
      attendancePercent: 100,
      enrolledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      id: `batch_genai_cohort_1_${student2Uid}`,
      batchId: "batch_genai_cohort_1",
      userId: student2Uid,
      userName: "Aarav Patel",
      userEmail: "aarav@genznex.in",
      programId: "program_fullstack_genai",
      orderId: "order_mock_p5_02",
      paymentId: "pay_mock_p5_02",
      status: "active",
      attendancePercent: 100,
      enrolledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  ];

  for (const e of enrollments) {
    await db.collection("batch_enrollments").doc(e.id).set(e);
  }
  console.log("✅ Seeded Batch Enrollments.");

  // 5. Seed Sessions
  const sessions = [
    {
      id: "session_genai_s1",
      batchId: "batch_genai_cohort_1",
      programId: "program_fullstack_genai",
      title: "Orientation, Roadmap & Dev Environment Setup",
      description: "Setting up Node.js 22, pnpm, Next.js 15, VS Code extensions, and Firebase Local Emulator Suite.",
      scheduledStartTime: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      scheduledEndTime: new Date(Date.now() - 46 * 3600 * 1000).toISOString(),
      trainerId: trainerUid,
      trainerName: "Vikram Malhotra",
      status: "completed",
      meetingProvider: "google_meet",
      joinLink: "https://meet.google.com/abc-defg-hij",
      recordingUrl: "https://res.cloudinary.com/demo/video/upload/sample.mp4",
      attendanceCode: "847291",
      codeExpiresAt: new Date(Date.now() - 46 * 3600 * 1000).toISOString(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      id: "session_genai_s2",
      batchId: "batch_genai_cohort_1",
      programId: "program_fullstack_genai",
      title: "Building Production Next.js 15 App Router Architecture",
      description: "Deep dive into Server Components, Suspense boundaries, streaming SSR, and Server Actions.",
      scheduledStartTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(), // upcoming in 2 hours
      scheduledEndTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      trainerId: trainerUid,
      trainerName: "Vikram Malhotra",
      status: "scheduled",
      meetingProvider: "google_meet",
      joinLink: "https://meet.google.com/xyz-uvwx-rst",
      attendanceCode: "492015",
      codeExpiresAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  ];

  for (const s of sessions) {
    await db.collection("sessions").doc(s.id).set(s);
  }
  console.log("✅ Seeded Live Sessions.");

  // 6. Seed Attendance
  await db.collection("session_attendance").doc(`session_genai_s1_${student1Uid}`).set({
    id: `session_genai_s1_${student1Uid}`,
    sessionId: "session_genai_s1",
    batchId: "batch_genai_cohort_1",
    userId: student1Uid,
    userName: "Rahul Sharma",
    userEmail: "student@genznex.in",
    attended: true,
    method: "code",
    markedAt: FieldValue.serverTimestamp(),
    minutesAttended: 115,
  });
  console.log("✅ Seeded Session Attendance.");

  // 7. Seed Capstone Projects & Submissions
  const project = {
    id: "project_capstone_copilot",
    batchId: "batch_genai_cohort_1",
    title: "AI Career Copilot SaaS with Next.js 15",
    description: "Design and implement a multi-tenant AI-powered career assistant with automated resume critique, interview simulations, and job tracking.",
    deadline: "2026-12-15",
    rubric: [
      { criterion: "System Architecture & Next.js 15 Patterns", maxPoints: 25 },
      { criterion: "GenAI Streaming & Tool Calling Integration", maxPoints: 25 },
      { criterion: "UI Polish, Accessibility & Responsive Design", maxPoints: 25 },
      { criterion: "Deployment, Testing & CI/CD Pipeline", maxPoints: 25 },
    ],
    maxTeamSize: 3,
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection("projects").doc(project.id).set(project);

  // Seed Team
  const team = {
    id: "team_neural_coders",
    projectId: "project_capstone_copilot",
    batchId: "batch_genai_cohort_1",
    name: "Team NeuralCoders",
    leadUserId: student1Uid,
    memberIds: [student1Uid, student2Uid],
    memberNames: ["Rahul Sharma", "Aarav Patel"],
    createdAt: FieldValue.serverTimestamp(),
  };
  await db.collection("project_teams").doc(team.id).set(team);

  // Seed Project Submission
  const submission = {
    id: `submission_${project.id}_${student1Uid}`,
    projectId: project.id,
    batchId: "batch_genai_cohort_1",
    teamId: team.id,
    userId: student1Uid,
    studentName: "Rahul Sharma",
    githubUrl: "https://github.com/rahul-sharma/ai-career-copilot",
    liveDemoUrl: "https://ai-career-copilot.vercel.app",
    notes: "Implemented full Next.js 15 streaming SSR with Google Gemini 2.5 Flash and Firebase Auth/Firestore.",
    status: "graded",
    score: 92,
    feedback: "Exceptional architecture and code cleaniness! The streaming response UX feels instantaneous.",
    rubricScores: {
      "System Architecture & Next.js 15 Patterns": 24,
      "GenAI Streaming & Tool Calling Integration": 23,
      "UI Polish, Accessibility & Responsive Design": 23,
      "Deployment, Testing & CI/CD Pipeline": 22,
    },
    gradedBy: trainerUid,
    gradedAt: FieldValue.serverTimestamp(),
    optedInShowcase: true,
    submittedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection("project_submissions").doc(submission.id).set(submission);

  // Seed Public Showcase
  await db.collection("showcase").doc(submission.id).set({
    id: submission.id,
    projectId: project.id,
    title: project.title,
    studentDisplayName: "Rahul Sharma",
    teamName: "Team NeuralCoders",
    githubUrl: submission.githubUrl,
    liveDemoUrl: submission.liveDemoUrl,
    score: 92,
    featuredAt: FieldValue.serverTimestamp(),
  });
  console.log("✅ Seeded Capstone Project, Team, Submission & Public Showcase.");

  // 8. Seed Aptitude Tests & Questions
  const testId = "test_screening_2026";
  await db.collection("aptitude_tests").doc(testId).set({
    id: testId,
    title: "Engineering Placement Diagnostic & Aptitude Test",
    description: "45-minute comprehensive screening covering Quantitative Aptitude, Logical Reasoning, and Core Full-Stack Concepts.",
    durationMinutes: 45,
    passingScore: 70,
    totalQuestions: 5,
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const questions = [
    {
      id: "q_cs_1",
      testId,
      category: "Full Stack CS",
      prompt: "In React 19 / Next.js 15 App Router, what happens when a Server Action throws an uncaught error?",
      options: [
        "The server process crashes immediately",
        "Next.js sanitizes the error in production and triggers the nearest error boundary",
        "The error is silently ignored and null is returned to the client",
        "The entire browser page reloads automatically",
      ],
      points: 20,
    },
    {
      id: "q_cs_2",
      testId,
      category: "Full Stack CS",
      prompt: "Which Firestore feature ensures payment and certificate writes cannot be spoofed by client SDKs?",
      options: [
        "Client side input validation",
        "Security Rules enforcing allow write: if false; combined with Firebase Admin SDK in Cloud Functions",
        "Firestore Indexes",
        "CORS origin headers",
      ],
      points: 20,
    },
    {
      id: "q_quant_1",
      testId,
      category: "Quantitative",
      prompt: "A cloud function processes 10,000 requests per minute with an average execution duration of 150ms. How many concurrent instances are active on average?",
      options: ["15", "25", "50", "150"],
      points: 20,
    },
  ];

  for (const q of questions) {
    await db.collection("question_bank").doc(q.id).set(q);
  }

  // CRITICAL: Seed Private Answers for questions (protected by Security Rules)
  await db.collection("question_bank").doc("q_cs_1").collection("private").doc("answers").set({
    correctOptionIndex: 1,
  });
  await db.collection("question_bank").doc("q_cs_2").collection("private").doc("answers").set({
    correctOptionIndex: 1,
  });
  await db.collection("question_bank").doc("q_quant_1").collection("private").doc("answers").set({
    correctOptionIndex: 1, // (10000 * 0.15) / 60 = 25 instances
  });
  console.log("✅ Seeded Aptitude Tests & Question Bank with Secure Private Answers.");

  // 9. Seed Mock Interviews & Availability
  const slotDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split("T")[0];
  await db.collection("interviewer_availability").doc(`avail_${trainerUid}_01`).set({
    id: `avail_${trainerUid}_01`,
    interviewerId: trainerUid,
    interviewerName: "Vikram Malhotra",
    date: slotDate,
    timeSlots: ["10:00", "11:30", "15:00", "16:30"],
    bookedSlots: ["10:00"],
    updatedAt: FieldValue.serverTimestamp(),
  });

  const interviewId = "interview_rahul_01";
  await db.collection("mock_interviews").doc(interviewId).set({
    id: interviewId,
    studentId: student1Uid,
    studentName: "Rahul Sharma",
    studentEmail: "student@genznex.in",
    interviewerId: trainerUid,
    interviewerName: "Vikram Malhotra",
    scheduledDate: slotDate,
    scheduledTime: "10:00",
    status: "completed",
    meetingUrl: "https://meet.google.com/int-mock-vikram",
    overallRating: 4.5,
    feedback: "Strong grasp of React 19 fundamentals and server actions. Recommended to refine distributed systems explanations.",
    rubricRatings: {
      technicalSkills: 4.5,
      problemSolving: 4.5,
      communication: 4.0,
      codeQuality: 5.0,
    },
    completedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log("✅ Seeded Mock Interviews & Availability.");

  // 10. Seed Jobs & Applications
  const jobs = [
    {
      id: "job_nexora_ai_01",
      title: "Junior Full Stack AI Engineer",
      companyName: "Nexora AI Labs",
      companyLogoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
      location: "Bengaluru, Karnataka (Hybrid)",
      type: "Full-time",
      ctcMin: 800000, // 8 LPA
      ctcMax: 1200000, // 12 LPA
      description: "Join our core platform engineering team building next-generation agentic AI copilots. You will work with Next.js 15, TypeScript, Python FastAPI, and vector databases.",
      requirements: [
        "Strong proficiency in TypeScript, React, and modern Next.js App Router",
        "Familiarity with Cloud Functions, serverless architectures, and Firestore",
        "Curiosity and hands-on experimentation with LLM APIs and prompt design",
      ],
      skills: ["Next.js", "TypeScript", "Tailwind CSS", "Firebase", "GenAI"],
      deadline: "2026-11-30",
      status: "open",
      postedBy: adminUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      id: "job_starlight_fintech_02",
      title: "Frontend Software Engineer (Next.js)",
      companyName: "Starlight FinTech",
      companyLogoUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop",
      location: "Mumbai, Maharashtra / Remote",
      type: "Full-time",
      ctcMin: 700000,
      ctcMax: 1000000,
      description: "Building ultra-fast payment checkout flows and financial analytics dashboards for millions of Gen Z users in India.",
      requirements: [
        "2+ years experience or portfolio equivalent with modern web applications",
        "Deep understanding of web performance, Core Web Vitals, and WCAG AA accessibility",
        "Experience with Razorpay / payment gateway SDKs is a plus",
      ],
      skills: ["React 19", "Next.js", "Tailwind CSS", "Razorpay"],
      deadline: "2026-12-15",
      status: "open",
      postedBy: adminUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  ];

  for (const j of jobs) {
    await db.collection("jobs").doc(j.id).set(j);
  }

  // Seed Job Application
  await db.collection("job_applications").doc(`app_${jobs[0].id}_${student1Uid}`).set({
    id: `app_${jobs[0].id}_${student1Uid}`,
    jobId: jobs[0].id,
    jobTitle: jobs[0].title,
    companyName: jobs[0].companyName,
    studentId: student1Uid,
    studentName: "Rahul Sharma",
    studentEmail: "student@genznex.in",
    resumeUrl: "https://firebasestorage.googleapis.com/v0/b/demo-genznex.appspot.com/o/resumes%2Frahul_sharma_resume.pdf",
    portfolioUrl: "https://rahulsharma.dev",
    status: "shortlisted",
    timeline: [
      { status: "applied", date: new Date(Date.now() - 5 * 86400000).toISOString(), note: "Application received" },
      { status: "shortlisted", date: new Date(Date.now() - 2 * 86400000).toISOString(), note: "Shortlisted for Round 1 Technical Interview" },
    ],
    appliedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log("✅ Seeded Jobs & Job Applications.");

  // 11. Seed Student Placement Profile
  await db.collection("student_profiles").doc(student1Uid).set({
    userId: student1Uid,
    displayName: "Rahul Sharma",
    email: "student@genznex.in",
    phoneNumber: "+91 98765 43210",
    headline: "Aspiring Full Stack AI Engineer | Next.js 15 Enthusiast",
    bio: "Passionate developer building high-performance modern web apps with AI integration. Completed GenZNex Next.js Masterclass and Full Stack GenAI Track.",
    githubUrl: "https://github.com/rahul-sharma",
    linkedinUrl: "https://linkedin.com/in/rahul-sharma-dev",
    skills: ["TypeScript", "Next.js 15", "React 19", "Firebase", "Tailwind CSS", "Python", "Docker"],
    isProfileVisible: true,
    placementStatus: "actively_looking",
    verifiedCertificates: ["CERT-GENZNEX-2026-NXTJS"],
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log("✅ Seeded Student Placement Profile & Resume Data.");

  console.log("\n🎉 ================================================================================");
  console.log("🎉 PHASE 5 SEED COMPLETED SUCCESSFULLY! READY FOR LOCAL DEV & TESTING!");
  console.log("================================================================================\n");
}

// Allow direct execution: tsx scripts/seed-phase5.ts
if (require.main === module) {
  seedPhase5().catch((err) => {
    console.error("❌ Phase 5 Seed failed:", err);
    process.exit(1);
  });
}
