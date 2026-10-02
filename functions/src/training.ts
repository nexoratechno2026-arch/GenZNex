/**
 * GenZNex Phase 5 Cloud Functions
 * Student Training Module: Programs, Batches, Sessions, Attendance,
 * Projects, Assessments, Mock Interviews, Resume, Jobs, Placement
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

// db is initialized in index.ts; we import it here
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Shared Helpers
// ---------------------------------------------------------------------------

async function writeNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  await db.collection("notifications").add({
    userId,
    title,
    message,
    type,
    link: link || null,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const CreateProgramSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  type: z.enum(["bootcamp", "internship", "skill_track"]),
  shortDescription: z.string().min(10),
  description: z.string().min(20),
  durationWeeks: z.number().int().positive(),
  mode: z.enum(["online", "offline", "hybrid"]),
  priceInPaise: z.number().int().min(0),
  eligibility: z.string().default(""),
  outcomes: z.array(z.string()).default([]),
  thumbnailUrl: z.string().url().optional(),
  isFeatured: z.boolean().default(false),
  curriculum: z.object({
    linkedCourseIds: z.array(z.string()).default([]),
    weeklySyllabus: z.array(z.object({
      week: z.number().int(),
      title: z.string(),
      topics: z.array(z.string()),
    })).default([]),
  }).default({ linkedCourseIds: [], weeklySyllabus: [] }),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
});

const CreateBatchSchema = z.object({
  programId: z.string().min(1),
  name: z.string().min(3),
  trainerIds: z.array(z.string()).min(1),
  mentorIds: z.array(z.string()).default([]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weeklySchedule: z.object({
    days: z.array(z.string()).min(1),
    timeIST: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  capacity: z.number().int().positive(),
  enrollmentDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  waitlistEnabled: z.boolean().default(true),
  minAttendancePercent: z.number().min(0).max(100).default(75),
  priceInPaise: z.number().int().min(0),
});

const EnrollInBatchSchema = z.object({
  batchId: z.string().min(1),
  paymentId: z.string().default(""), // empty for free
  orderId: z.string().default(""),   // empty for free
});

const CreateSessionSchema = z.object({
  batchId: z.string().min(1),
  title: z.string().min(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTimeIST: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().positive(),
  topic: z.string().min(3),
  meetingProvider: z.enum(["google_meet", "zoom", "custom"]),
  joinLink: z.string().url(),
});

const BulkCreateSessionsSchema = z.object({
  batchId: z.string().min(1),
  sessionTemplate: z.object({
    durationMinutes: z.number().int().positive(),
    meetingProvider: z.enum(["google_meet", "zoom", "custom"]),
    joinLink: z.string().url(),
  }),
});

const GetSessionJoinLinkSchema = z.object({
  sessionId: z.string().min(1),
});

const MarkAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  batchId: z.string().min(1),
  records: z.array(z.object({
    userId: z.string().min(1),
    status: z.enum(["present", "absent", "late", "excused"]),
    remarks: z.string().optional(),
  })),
});

const RecordJoinEventSchema = z.object({
  sessionId: z.string().min(1),
  batchId: z.string().min(1),
});

const CreateProjectSchema = z.object({
  batchId: z.string().min(1),
  programId: z.string().optional(),
  title: z.string().min(3),
  brief: z.string().min(10),
  requirements: z.array(z.string()).default([]),
  rubric: z.array(z.object({
    criterionId: z.string(),
    criterion: z.string(),
    description: z.string(),
    maxPoints: z.number().positive(),
    weight: z.number().min(0).max(1),
  })).min(1),
  milestones: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    dueDate: z.string(),
    order: z.number().int(),
  })).min(1),
  allowedSubmissionTypes: z.array(z.enum(["github_url", "demo_url", "file", "figma_url", "drive_url"])).min(1),
  teamSize: z.number().int().min(1).default(1),
  allowPeerReview: z.boolean().default(false),
  peerReviewCount: z.number().int().min(1).max(5).default(2),
  showcaseEligible: z.boolean().default(true),
});

const SubmitProjectMilestoneSchema = z.object({
  projectId: z.string().min(1),
  batchId: z.string().min(1),
  milestoneId: z.string().min(1),
  description: z.string().min(10),
  githubUrl: z.string().url().optional(),
  demoUrl: z.string().url().optional(),
  figmaUrl: z.string().url().optional(),
  driveUrl: z.string().url().optional(),
});

const GradeProjectSchema = z.object({
  submissionId: z.string().min(1),
  rubricScores: z.record(z.string(), z.number().min(0)),
  feedback: z.string().min(10),
  requestChanges: z.boolean().default(false),
});

const OptInShowcaseSchema = z.object({
  submissionId: z.string().min(1),
  consent: z.boolean(),
});

const PublishAvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z.array(z.object({
    time: z.string().regex(/^\d{2}:\d{2}$/),
  })).min(1),
});

const BookInterviewSchema = z.object({
  interviewerId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  batchId: z.string().optional(),
  programId: z.string().optional(),
});

const SubmitInterviewFeedbackSchema = z.object({
  interviewId: z.string().min(1),
  communication: z.number().int().min(1).max(5),
  technicalDepth: z.number().int().min(1).max(5),
  problemSolving: z.number().int().min(1).max(5),
  confidence: z.number().int().min(1).max(5),
  overall: z.number().int().min(1).max(5),
  strengths: z.string().min(5),
  improvements: z.string().min(5),
});

const GetInterviewJoinLinkSchema = z.object({
  interviewId: z.string().min(1),
});

const CreateJobSchema = z.object({
  title: z.string().min(3),
  companyName: z.string().min(2),
  companyLogoUrl: z.string().url().optional(),
  location: z.string().min(2),
  type: z.enum(["Full-time", "Internship"]),
  stipendOrSalary: z.string().min(1),
  description: z.string().min(20),
  requirements: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  applyMethod: z.enum(["internal", "external"]).default("external"),
  externalApplyUrl: z.string().url().optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  programEligibility: z.array(z.string()).default([]),
  minAttendancePercent: z.number().min(0).max(100).optional(),
  minScore: z.number().min(0).max(100).optional(),
});

const ApplyToJobSchema = z.object({
  jobId: z.string().min(1),
  programId: z.string().optional(),
  batchId: z.string().optional(),
});

const UpdateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(["applied", "shortlisted", "interview", "offered", "rejected", "withdrawn"]),
  note: z.string().optional(),
});

const SaveResumeSchema = z.object({
  headline: z.string().default(""),
  summary: z.string().default(""),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    startYear: z.number().int(),
    endYear: z.number().int().optional(),
    gpa: z.string().optional(),
  })).default([]),
  skills: z.array(z.string()).default([]),
  experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.string(),
    isCurrent: z.boolean(),
  })).default([]),
  links: z.object({
    github: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    portfolio: z.string().url().optional(),
    other: z.string().url().optional(),
  }).default({}),
  preferredRoles: z.array(z.string()).default([]),
  preferredLocations: z.array(z.string()).default([]),
  resumeTemplate: z.enum(["classic", "modern", "minimal"]).default("classic"),
  isProfileVisible: z.boolean().default(false),
});

const CancelBatchSchema = z.object({
  batchId: z.string().min(1),
  reason: z.string().min(5),
  issueRefunds: z.boolean().default(false),
});

const MoveStudentBatchSchema = z.object({
  studentId: z.string().min(1),
  fromBatchId: z.string().min(1),
  toBatchId: z.string().min(1),
  reason: z.string().min(5),
});

const UpdateBatchSchema = z.object({
  batchId: z.string().min(1),
  updates: z.object({
    name: z.string().optional(),
    trainerIds: z.array(z.string()).optional(),
    mentorIds: z.array(z.string()).optional(),
    enrollmentDeadline: z.string().optional(),
    waitlistEnabled: z.boolean().optional(),
    minAttendancePercent: z.number().min(0).max(100).optional(),
    weeklySchedule: z.object({
      days: z.array(z.string()),
      timeIST: z.string(),
    }).optional(),
  }),
});

const UpdateSessionSchema = z.object({
  sessionId: z.string().min(1),
  updates: z.object({
    title: z.string().optional(),
    date: z.string().optional(),
    startTimeIST: z.string().optional(),
    durationMinutes: z.number().int().positive().optional(),
    topic: z.string().optional(),
    joinLink: z.string().url().optional(),
    status: z.enum(["scheduled", "live", "completed", "cancelled", "rescheduled"]).optional(),
    cancelledReason: z.string().optional(),
    recordingLink: z.string().url().optional(),
  }),
});

const JoinWaitlistSchema = z.object({
  batchId: z.string().min(1),
});

// ---------------------------------------------------------------------------
// P5-1. Training Programs
// ---------------------------------------------------------------------------

export const createProgram = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can create programs.");
  }
  const data = CreateProgramSchema.parse(request.data);

  // Check slug uniqueness
  const existing = await db.collection("training_programs").where("slug", "==", data.slug).limit(1).get();
  if (!existing.empty) {
    throw new HttpsError("already-exists", `Slug '${data.slug}' is already taken.`);
  }

  const ref = db.collection("training_programs").doc();
  await ref.set({
    ...data,
    id: ref.id,
    status: "draft",
    createdBy: request.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, programId: ref.id };
});

export const publishProgram = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can publish programs.");
  }
  const { programId } = z.object({ programId: z.string().min(1) }).parse(request.data);

  const ref = db.collection("training_programs").doc(programId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Program not found.");

  await ref.update({ status: "published", updatedAt: FieldValue.serverTimestamp() });
  return { success: true };
});

export const archiveProgram = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can archive programs.");
  }
  const { programId } = z.object({ programId: z.string().min(1) }).parse(request.data);

  await db.collection("training_programs").doc(programId).update({
    status: "archived",
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { success: true };
});

// ---------------------------------------------------------------------------
// P5-2. Batches
// ---------------------------------------------------------------------------

export const createBatch = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can create batches.");
  }
  const data = CreateBatchSchema.parse(request.data);

  const programSnap = await db.collection("training_programs").doc(data.programId).get();
  if (!programSnap.exists) throw new HttpsError("not-found", "Program not found.");
  const program = programSnap.data()!;

  const ref = db.collection("program_batches").doc();
  await ref.set({
    ...data,
    id: ref.id,
    programTitle: program.title,
    enrolledCount: 0,
    waitlistStudentIds: [],
    status: "upcoming",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, batchId: ref.id };
});

export const updateBatch = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "trainer") {
    throw new HttpsError("permission-denied", "Only admins or trainers can update batches.");
  }

  const { batchId, updates } = UpdateBatchSchema.parse(request.data);
  const batchSnap = await db.collection("program_batches").doc(batchId).get();
  if (!batchSnap.exists) throw new HttpsError("not-found", "Batch not found.");
  const batch = batchSnap.data()!;

  if (role === "trainer" && !batch.trainerIds.includes(request.auth.uid)) {
    throw new HttpsError("permission-denied", "You are not assigned to this batch.");
  }

  await db.collection("program_batches").doc(batchId).update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});

export const cancelBatch = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can cancel batches.");
  }

  const { batchId, reason, issueRefunds } = CancelBatchSchema.parse(request.data);
  const batchRef = db.collection("program_batches").doc(batchId);
  const batchSnap = await batchRef.get();
  if (!batchSnap.exists) throw new HttpsError("not-found", "Batch not found.");

  await batchRef.update({
    status: "cancelled",
    cancelledReason: reason,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Notify enrolled students
  const enrollmentsSnap = await db.collection("batch_enrollments")
    .where("batchId", "==", batchId)
    .where("status", "==", "active")
    .get();

  const batch = batchSnap.data()!;
  const notifPromises = enrollmentsSnap.docs.map((e) =>
    writeNotification(
      e.data().userId,
      "Batch Cancelled",
      `Batch "${batch.name}" has been cancelled. Reason: ${reason}. ${issueRefunds ? "A refund has been initiated." : ""}`,
      "training",
      "/dashboard/student/training"
    )
  );
  await Promise.all(notifPromises);

  return { success: true, notifiedCount: enrollmentsSnap.size };
});

export const moveStudentBatch = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can move students between batches.");
  }

  const { studentId, fromBatchId, toBatchId, reason } = MoveStudentBatchSchema.parse(request.data);

  // Validate both batches exist
  const [fromSnap, toSnap] = await Promise.all([
    db.collection("program_batches").doc(fromBatchId).get(),
    db.collection("program_batches").doc(toBatchId).get(),
  ]);
  if (!fromSnap.exists) throw new HttpsError("not-found", "Source batch not found.");
  if (!toSnap.exists) throw new HttpsError("not-found", "Target batch not found.");

  const toBatch = toSnap.data()!;
  if (toBatch.enrolledCount >= toBatch.capacity) {
    throw new HttpsError("resource-exhausted", "Target batch is full.");
  }

  const fromEnrollmentId = `${fromBatchId}_${studentId}`;
  const toEnrollmentId = `${toBatchId}_${studentId}`;

  await db.runTransaction(async (tx) => {
    const fromEnrollRef = db.collection("batch_enrollments").doc(fromEnrollmentId);
    const toEnrollRef = db.collection("batch_enrollments").doc(toEnrollmentId);
    const fromBatchRef = db.collection("program_batches").doc(fromBatchId);
    const toBatchRef = db.collection("program_batches").doc(toBatchId);

    const fromEnrollSnap = await tx.get(fromEnrollRef);
    if (!fromEnrollSnap.exists || fromEnrollSnap.data()!.status !== "active") {
      throw new HttpsError("not-found", "Student is not actively enrolled in source batch.");
    }

    const fromData = fromEnrollSnap.data()!;

    // De-enroll from source
    tx.update(fromEnrollRef, { status: "cancelled", updatedAt: FieldValue.serverTimestamp() });
    tx.update(fromBatchRef, { enrolledCount: FieldValue.increment(-1), updatedAt: FieldValue.serverTimestamp() });

    // Enroll in target
    tx.set(toEnrollRef, {
      ...fromData,
      id: toEnrollmentId,
      batchId: toBatchId,
      status: "active",
      attendancePercent: 0,
      enrolledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(toBatchRef, { enrolledCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
  });

  // Audit log
  await db.collection("audit_logs").add({
    actorUid: request.auth.uid,
    actorEmail: request.auth.token.email || "",
    actorRole: "admin",
    action: "move_student_batch",
    targetId: studentId,
    details: { fromBatchId, toBatchId, reason },
    timestamp: FieldValue.serverTimestamp(),
  });

  await writeNotification(studentId, "Batch Transfer", `You have been moved to a new batch. Reason: ${reason}`, "training", "/dashboard/student/training");

  return { success: true };
});

// ---------------------------------------------------------------------------
// P5-3. Batch Enrollment (Race-Safe Transaction)
// ---------------------------------------------------------------------------

export const enrollInBatch = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");

  const uid = request.auth.uid;
  const data = EnrollInBatchSchema.parse(request.data);
  const { batchId, paymentId, orderId } = data;

  const batchRef = db.collection("program_batches").doc(batchId);
  const enrollmentId = `${batchId}_${uid}`;
  const enrollmentRef = db.collection("batch_enrollments").doc(enrollmentId);

  // Fetch user info
  const userSnap = await db.collection("users").doc(uid).get();
  const user = userSnap.data() || { displayName: "", email: "" };

  let result: { status: string; waitlistPosition?: number } = { status: "enrolled" };

  await db.runTransaction(async (tx) => {
    const batchSnap = await tx.get(batchRef);
    if (!batchSnap.exists) throw new HttpsError("not-found", "Batch not found.");
    const batch = batchSnap.data()!;

    if (batch.status === "cancelled") {
      throw new HttpsError("failed-precondition", "Batch has been cancelled.");
    }

    // Check if already enrolled or waitlisted
    const existingEnrollSnap = await tx.get(enrollmentRef);
    if (existingEnrollSnap.exists) {
      const existingStatus = existingEnrollSnap.data()!.status;
      if (existingStatus === "active") throw new HttpsError("already-exists", "Already enrolled in this batch.");
      if (existingStatus === "waitlisted") throw new HttpsError("already-exists", "Already on waitlist for this batch.");
    }

    const now = new Date().toISOString().split("T")[0];
    if (batch.enrollmentDeadline && batch.enrollmentDeadline < now) {
      throw new HttpsError("failed-precondition", "Enrollment deadline has passed.");
    }

    if (batch.enrolledCount < batch.capacity && batch.status !== "full") {
      // Seat available — enroll
      const newCount = batch.enrolledCount + 1;
      tx.set(enrollmentRef, {
        id: enrollmentId,
        batchId,
        userId: uid,
        userName: user.displayName || "",
        userEmail: user.email || "",
        programId: batch.programId,
        orderId,
        paymentId,
        status: "active",
        attendancePercent: 0,
        enrolledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.update(batchRef, {
        enrolledCount: newCount,
        status: newCount >= batch.capacity ? "full" : (batch.status === "upcoming" ? "upcoming" : "open"),
        updatedAt: FieldValue.serverTimestamp(),
      });

      result = { status: "enrolled" };
    } else {
      // Batch full
      if (!batch.waitlistEnabled) {
        throw new HttpsError("resource-exhausted", "Batch is full and waitlist is not available.");
      }

      // Add to waitlist
      const waitlist: string[] = batch.waitlistStudentIds || [];
      if (waitlist.includes(uid)) {
        throw new HttpsError("already-exists", "Already on waitlist.");
      }

      const position = waitlist.length + 1;
      tx.set(enrollmentRef, {
        id: enrollmentId,
        batchId,
        userId: uid,
        userName: user.displayName || "",
        userEmail: user.email || "",
        programId: batch.programId,
        orderId,
        paymentId,
        status: "waitlisted",
        attendancePercent: 0,
        enrolledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.update(batchRef, {
        waitlistStudentIds: FieldValue.arrayUnion(uid),
        updatedAt: FieldValue.serverTimestamp(),
      });

      result = { status: "waitlisted", waitlistPosition: position };
    }
  });

  if (result.status === "enrolled") {
    await writeNotification(uid, "Batch Enrollment Confirmed!", `You're enrolled in the batch. See your dashboard for schedule.`, "training", "/dashboard/student/training");
  } else {
    await writeNotification(uid, "Added to Waitlist", `You are on the waitlist (position #${result.waitlistPosition}). We'll notify you when a seat opens.`, "training", "/dashboard/student/training");
  }

  return result;
});

export const joinWaitlist = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const uid = request.auth.uid;
  const { batchId } = JoinWaitlistSchema.parse(request.data);

  const batchRef = db.collection("program_batches").doc(batchId);
  const enrollmentId = `${batchId}_${uid}`;
  const enrollmentRef = db.collection("batch_enrollments").doc(enrollmentId);

  const userSnap = await db.collection("users").doc(uid).get();
  const user = userSnap.data() || { displayName: "", email: "" };

  let waitlistPosition = 1;

  await db.runTransaction(async (tx) => {
    const batchSnap = await tx.get(batchRef);
    if (!batchSnap.exists) throw new HttpsError("not-found", "Batch not found.");
    const batch = batchSnap.data()!;

    if (!batch.waitlistEnabled) {
      throw new HttpsError("failed-precondition", "Waitlist is not enabled for this batch.");
    }

    const existingSnap = await tx.get(enrollmentRef);
    if (existingSnap.exists) {
      throw new HttpsError("already-exists", "Already enrolled or waitlisted.");
    }

    const waitlist: string[] = batch.waitlistStudentIds || [];
    waitlistPosition = waitlist.length + 1;

    tx.set(enrollmentRef, {
      id: enrollmentId,
      batchId,
      userId: uid,
      userName: user.displayName || "",
      userEmail: user.email || "",
      programId: batch.programId,
      orderId: "",
      paymentId: "",
      status: "waitlisted",
      attendancePercent: 0,
      enrolledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.update(batchRef, {
      waitlistStudentIds: FieldValue.arrayUnion(uid),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await writeNotification(uid, "Added to Waitlist", `You are waitlisted (position #${waitlistPosition}). We'll notify you when a seat opens.`, "training", "/dashboard/student/training");

  return { success: true, waitlistPosition };
});

// Promote first waitlisted student when a seat opens
async function promoteFromWaitlistInternal(batchId: string) {
  const batchRef = db.collection("program_batches").doc(batchId);

  await db.runTransaction(async (tx) => {
    const batchSnap = await tx.get(batchRef);
    if (!batchSnap.exists) return;
    const batch = batchSnap.data()!;
    const waitlist: string[] = batch.waitlistStudentIds || [];

    if (waitlist.length === 0) return;
    if (batch.enrolledCount >= batch.capacity) return;

    const nextUserId = waitlist[0];
    const enrollmentId = `${batchId}_${nextUserId}`;
    const enrollmentRef = db.collection("batch_enrollments").doc(enrollmentId);

    tx.update(enrollmentRef, {
      status: "active",
      updatedAt: FieldValue.serverTimestamp(),
    });

    const newWaitlist = waitlist.slice(1);
    const newCount = batch.enrolledCount + 1;
    tx.update(batchRef, {
      waitlistStudentIds: newWaitlist,
      enrolledCount: newCount,
      status: newCount >= batch.capacity ? "full" : batch.status,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export const promoteFromWaitlist = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin only.");
  }
  const { batchId } = z.object({ batchId: z.string() }).parse(request.data);
  await promoteFromWaitlistInternal(batchId);
  return { success: true };
});

// ---------------------------------------------------------------------------
// P5-4. Sessions
// ---------------------------------------------------------------------------

export const createSession = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "trainer") {
    throw new HttpsError("permission-denied", "Only admins or trainers can create sessions.");
  }

  const data = CreateSessionSchema.parse(request.data);

  const batchSnap = await db.collection("program_batches").doc(data.batchId).get();
  if (!batchSnap.exists) throw new HttpsError("not-found", "Batch not found.");
  const batch = batchSnap.data()!;

  if (role === "trainer" && !batch.trainerIds.includes(request.auth.uid)) {
    throw new HttpsError("permission-denied", "You are not assigned to this batch.");
  }

  const ref = db.collection("sessions").doc();
  await ref.set({
    ...data,
    id: ref.id,
    programId: batch.programId,
    status: "scheduled",
    createdBy: request.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, sessionId: ref.id };
});

export const bulkCreateSessions = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "trainer") {
    throw new HttpsError("permission-denied", "Only admins or trainers can create sessions.");
  }

  const { batchId, sessionTemplate } = BulkCreateSessionsSchema.parse(request.data);

  const batchSnap = await db.collection("program_batches").doc(batchId).get();
  if (!batchSnap.exists) throw new HttpsError("not-found", "Batch not found.");
  const batch = batchSnap.data()!;

  if (role === "trainer" && !batch.trainerIds.includes(request.auth.uid)) {
    throw new HttpsError("permission-denied", "You are not assigned to this batch.");
  }

  // Generate sessions from weekly schedule between startDate and endDate
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const scheduleDays: number[] = (batch.weeklySchedule.days as string[]).map((d: string) => dayMap[d] ?? 1);

  const start = new Date(batch.startDate + "T00:00:00+05:30");
  const end = new Date(batch.endDate + "T00:00:00+05:30");

  const sessionDocs: any[] = [];
  const current = new Date(start);

  let weekNum = 1;
  while (current <= end) {
    if (scheduleDays.includes(current.getDay())) {
      const dateStr = current.toISOString().split("T")[0];
      const ref = db.collection("sessions").doc();
      sessionDocs.push({
        id: ref.id,
        batchId,
        programId: batch.programId,
        title: `Week ${weekNum} Session`,
        date: dateStr,
        startTimeIST: batch.weeklySchedule.timeIST,
        durationMinutes: sessionTemplate.durationMinutes,
        topic: `Week ${weekNum} - ${batch.programTitle}`,
        meetingProvider: sessionTemplate.meetingProvider,
        joinLink: sessionTemplate.joinLink,
        status: "scheduled",
        createdBy: request.auth!.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    current.setDate(current.getDate() + 1);
    if (current.getDay() === 1) weekNum++; // Monday starts new week
  }

  // Batch write in groups of 500
  const chunkSize = 500;
  for (let i = 0; i < sessionDocs.length; i += chunkSize) {
    const chunk = sessionDocs.slice(i, i + chunkSize);
    const writeBatch = db.batch();
    for (const s of chunk) {
      writeBatch.set(db.collection("sessions").doc(s.id), s);
    }
    await writeBatch.commit();
  }

  return { success: true, sessionsCreated: sessionDocs.length };
});

export const updateSession = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "trainer") {
    throw new HttpsError("permission-denied", "Only admins or trainers can update sessions.");
  }

  const { sessionId, updates } = UpdateSessionSchema.parse(request.data);
  const sessionSnap = await db.collection("sessions").doc(sessionId).get();
  if (!sessionSnap.exists) throw new HttpsError("not-found", "Session not found.");
  const session = sessionSnap.data()!;

  if (role === "trainer") {
    const batchSnap = await db.collection("program_batches").doc(session.batchId).get();
    if (!batchSnap.data()!.trainerIds.includes(request.auth.uid)) {
      throw new HttpsError("permission-denied", "Not assigned to this batch.");
    }
  }

  const isReschedule = updates.date && updates.date !== session.date;
  const updateData: any = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (isReschedule) {
    updateData.rescheduledFrom = session.date;
    updateData.rescheduledAt = FieldValue.serverTimestamp();
    updateData.status = "rescheduled";
  }

  await db.collection("sessions").doc(sessionId).update(updateData);

  // Notify enrolled students on reschedule or cancel
  if (isReschedule || updates.status === "cancelled") {
    const enrollmentsSnap = await db.collection("batch_enrollments")
      .where("batchId", "==", session.batchId)
      .where("status", "==", "active")
      .get();

    const msg = updates.status === "cancelled"
      ? `Session "${session.title}" on ${session.date} has been cancelled. ${updates.cancelledReason || ""}`
      : `Session "${session.title}" has been rescheduled to ${updates.date} at ${updates.startTimeIST || session.startTimeIST}.`;

    await Promise.all(enrollmentsSnap.docs.map((e) =>
      writeNotification(e.data().userId, "Session Update", msg, "training", "/dashboard/student/schedule")
    ));
  }

  return { success: true };
});

// CRITICAL: Join link is only returned after verifying enrollment + time window
export const getSessionJoinLink = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");

  const { sessionId } = GetSessionJoinLinkSchema.parse(request.data);
  const uid = request.auth.uid;
  const role = request.auth.token.role;

  const sessionSnap = await db.collection("sessions").doc(sessionId).get();
  if (!sessionSnap.exists) throw new HttpsError("not-found", "Session not found.");
  const session = sessionSnap.data()!;

  // Admin & trainer can always get the link
  if (role !== "admin" && role !== "trainer") {
    // Check enrollment
    const enrollmentId = `${session.batchId}_${uid}`;
    const enrollmentSnap = await db.collection("batch_enrollments").doc(enrollmentId).get();
    if (!enrollmentSnap.exists || enrollmentSnap.data()!.status !== "active") {
      throw new HttpsError("permission-denied", "Not enrolled in this batch.");
    }

    // Enforce 15-minute window: link visible 15 min before start until session ends
    const [year, month, day] = session.date.split("-").map(Number);
    const [hour, minute] = session.startTimeIST.split(":").map(Number);
    // IST = UTC+5:30
    const sessionStartMs = Date.UTC(year, month - 1, day, hour - 5, minute - 30, 0);
    const sessionEndMs = sessionStartMs + session.durationMinutes * 60 * 1000;
    const windowOpenMs = sessionStartMs - 15 * 60 * 1000;
    const nowMs = Date.now();

    if (nowMs < windowOpenMs) {
      const minutesUntil = Math.ceil((windowOpenMs - nowMs) / 60000);
      throw new HttpsError("failed-precondition", `Join link is not available yet. Opens in ${minutesUntil} minute(s).`);
    }
    if (nowMs > sessionEndMs + 5 * 60 * 1000) { // 5-minute grace period after end
      throw new HttpsError("failed-precondition", "This session has ended.");
    }
  }

  // Log join event server-side
  const attendanceId = `${sessionId}_${uid}`;
  const attendanceRef = db.collection("session_attendance").doc(attendanceId);
  const existingAttendance = await attendanceRef.get();

  if (!existingAttendance.exists) {
    await attendanceRef.set({
      id: attendanceId,
      sessionId,
      batchId: session.batchId,
      userId: uid,
      status: "present", // Auto-mark present on join
      joinedAt: FieldValue.serverTimestamp(),
      markedBy: "system",
      markedAt: FieldValue.serverTimestamp(),
    });
  }

  return { joinLink: session.joinLink };
});

export const addSessionRecording = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "trainer") {
    throw new HttpsError("permission-denied", "Only trainers or admins can add recordings.");
  }

  const { sessionId, recordingLink, recordingVideoId, recordingProvider } = z.object({
    sessionId: z.string().min(1),
    recordingLink: z.string().url().optional(),
    recordingVideoId: z.string().optional(),
    recordingProvider: z.string().optional(),
  }).parse(request.data);

  await db.collection("sessions").doc(sessionId).update({
    recordingLink: recordingLink || null,
    recordingVideoId: recordingVideoId || null,
    recordingProvider: recordingProvider || null,
    status: "completed",
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});

// ---------------------------------------------------------------------------
// P5-5. Attendance
// ---------------------------------------------------------------------------

export const markSessionAttendance = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "trainer") {
    throw new HttpsError("permission-denied", "Only trainers or admins can mark attendance.");
  }

  const { sessionId, batchId, records } = MarkAttendanceSchema.parse(request.data);

  // Verify trainer is assigned to this batch
  if (role === "trainer") {
    const batchSnap = await db.collection("program_batches").doc(batchId).get();
    if (!batchSnap.data()!.trainerIds.includes(request.auth.uid)) {
      throw new HttpsError("permission-denied", "Not assigned to this batch.");
    }
  }

  const writeBatch = db.batch();
  for (const record of records) {
    const attendanceId = `${sessionId}_${record.userId}`;
    const ref = db.collection("session_attendance").doc(attendanceId);
    writeBatch.set(ref, {
      id: attendanceId,
      sessionId,
      batchId,
      userId: record.userId,
      status: record.status,
      markedBy: request.auth!.uid,
      markedAt: FieldValue.serverTimestamp(),
      remarks: record.remarks || null,
    }, { merge: true });
  }
  await writeBatch.commit();

  // Mark session as completed
  await db.collection("sessions").doc(sessionId).update({
    status: "completed",
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Recalculate attendance for all students in the batch
  // (done async to avoid timeout — trigger handles it)

  return { success: true, markedCount: records.length };
});

export const recordJoinEvent = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  // This is called from the front-end when a student clicks Join
  // The actual link enforcement is in getSessionJoinLink
  // This just logs the timestamp for analytics

  const { sessionId, batchId } = RecordJoinEventSchema.parse(request.data);
  const uid = request.auth.uid;

  const attendanceId = `${sessionId}_${uid}`;
  const ref = db.collection("session_attendance").doc(attendanceId);

  await ref.set({
    id: attendanceId,
    sessionId,
    batchId,
    userId: uid,
    joinedAt: FieldValue.serverTimestamp(),
    markedAt: FieldValue.serverTimestamp(),
    markedBy: "system",
    status: "present",
  }, { merge: true });

  return { success: true };
});

// Firestore trigger: recalculate attendancePercent when session_attendance is written
export const onSessionAttendanceWrite = onDocumentWritten(
  "session_attendance/{attendanceId}",
  async (event) => {
    const data = (event.data?.after?.data() || event.data?.before?.data()) as any;
    if (!data) return;

    const { batchId, userId } = data;
    if (!batchId || !userId) return;

    // Get all sessions for this batch
    const sessionsSnap = await db.collection("sessions")
      .where("batchId", "==", batchId)
      .where("status", "==", "completed")
      .get();

    if (sessionsSnap.empty) return;

    const sessionIds = sessionsSnap.docs.map((s) => s.id);

    // Get this student's attendance records
    const attendanceSnap = await db.collection("session_attendance")
      .where("batchId", "==", batchId)
      .where("userId", "==", userId)
      .get();

    const attended = attendanceSnap.docs.filter((a) =>
      ["present", "late", "excused", "present_recorded"].includes(a.data().status)
    );

    const totalSessions = sessionIds.length;
    const attendedCount = attended.length;
    const percent = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;

    const enrollmentId = `${batchId}_${userId}`;
    await db.collection("batch_enrollments").doc(enrollmentId).update({
      attendancePercent: percent,
      updatedAt: FieldValue.serverTimestamp(),
    }).catch(() => {
      // Enrollment might not exist yet (e.g., for test data)
    });
  }
);

export const calculateAttendanceSummary = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const { batchId } = z.object({ batchId: z.string().min(1) }).parse(request.data);

  const [sessionsSnap, attendanceSnap, enrollmentsSnap] = await Promise.all([
    db.collection("sessions").where("batchId", "==", batchId).where("status", "==", "completed").get(),
    db.collection("session_attendance").where("batchId", "==", batchId).get(),
    db.collection("batch_enrollments").where("batchId", "==", batchId).where("status", "==", "active").get(),
  ]);

  const totalSessions = sessionsSnap.size;
  const summary: Record<string, { attended: number; percent: number }> = {};

  for (const enrollment of enrollmentsSnap.docs) {
    const userId = enrollment.data().userId;
    const userAttendance = attendanceSnap.docs.filter(
      (a) => a.data().userId === userId && ["present", "late", "excused", "present_recorded"].includes(a.data().status)
    );
    const attended = userAttendance.length;
    summary[userId] = { attended, percent: totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0 };
  }

  return { totalSessions, summary };
});

// ---------------------------------------------------------------------------
// P5-6. Projects & Capstone
// ---------------------------------------------------------------------------

export const createProject = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "trainer") {
    throw new HttpsError("permission-denied", "Only trainers or admins can create projects.");
  }

  const data = CreateProjectSchema.parse(request.data);

  if (role === "trainer") {
    const batchSnap = await db.collection("program_batches").doc(data.batchId).get();
    if (!batchSnap.data()!.trainerIds.includes(request.auth.uid)) {
      throw new HttpsError("permission-denied", "Not assigned to this batch.");
    }
  }

  const ref = db.collection("projects").doc();
  await ref.set({
    ...data,
    id: ref.id,
    createdBy: request.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, projectId: ref.id };
});

export const submitProjectMilestone = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const uid = request.auth.uid;

  const data = SubmitProjectMilestoneSchema.parse(request.data);
  const { projectId, batchId, milestoneId } = data;

  // Verify enrollment
  const enrollmentId = `${batchId}_${uid}`;
  const enrollmentSnap = await db.collection("batch_enrollments").doc(enrollmentId).get();
  if (!enrollmentSnap.exists || enrollmentSnap.data()!.status !== "active") {
    throw new HttpsError("permission-denied", "Not enrolled in this batch.");
  }

  const projectSnap = await db.collection("projects").doc(projectId).get();
  if (!projectSnap.exists) throw new HttpsError("not-found", "Project not found.");

  // Check existing submissions to determine version
  const existingQuery = await db.collection("project_submissions")
    .where("projectId", "==", projectId)
    .where("userId", "==", uid)
    .where("milestoneId", "==", milestoneId)
    .orderBy("version", "desc")
    .limit(1)
    .get();

  const version = existingQuery.empty ? 1 : existingQuery.docs[0].data().version + 1;

  const ref = db.collection("project_submissions").doc();
  await ref.set({
    id: ref.id,
    projectId,
    batchId,
    userId: uid,
    milestoneId,
    version,
    githubUrl: data.githubUrl || null,
    demoUrl: data.demoUrl || null,
    figmaUrl: data.figmaUrl || null,
    driveUrl: data.driveUrl || null,
    description: data.description,
    status: "submitted",
    rubricScores: {},
    totalScore: 0,
    feedback: "",
    allowShowcase: false,
    submittedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, submissionId: ref.id, version };
});

export const gradeProjectMilestone = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "trainer") {
    throw new HttpsError("permission-denied", "Only mentors/trainers can grade projects.");
  }

  const { submissionId, rubricScores, feedback, requestChanges } = GradeProjectSchema.parse(request.data);

  const submissionSnap = await db.collection("project_submissions").doc(submissionId).get();
  if (!submissionSnap.exists) throw new HttpsError("not-found", "Submission not found.");
  const submission = submissionSnap.data()!;

  // Verify trainer is assigned to this batch
  if (role === "trainer") {
    const batchSnap = await db.collection("program_batches").doc(submission.batchId).get();
    if (!batchSnap.data()!.trainerIds.includes(request.auth.uid)) {
      throw new HttpsError("permission-denied", "Not assigned to this batch.");
    }
  }

  // Fetch project to calculate weighted score
  const projectSnap = await db.collection("projects").doc(submission.projectId).get();
  const project = projectSnap.data()!;

  let totalScore = 0;
  for (const item of project.rubric) {
    const score = rubricScores[item.criterionId] || 0;
    totalScore += Math.min(score, item.maxPoints);
  }

  const newStatus = requestChanges ? "changes_requested" : "approved";

  await db.collection("project_submissions").doc(submissionId).update({
    status: newStatus,
    rubricScores,
    totalScore,
    feedback,
    gradedBy: request.auth.uid,
    gradedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const msg = requestChanges
    ? `Your project submission has feedback. Please review and resubmit.`
    : `Your project milestone has been approved! Total score: ${totalScore}.`;

  await writeNotification(submission.userId, "Project Feedback", msg, "training", "/dashboard/student/projects");

  return { success: true, status: newStatus, totalScore };
});

export const optInToShowcase = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const uid = request.auth.uid;

  const { submissionId, consent } = OptInShowcaseSchema.parse(request.data);

  const submissionSnap = await db.collection("project_submissions").doc(submissionId).get();
  if (!submissionSnap.exists) throw new HttpsError("not-found", "Submission not found.");
  const submission = submissionSnap.data()!;

  if (submission.userId !== uid) {
    throw new HttpsError("permission-denied", "Can only manage your own submission.");
  }

  if (submission.status !== "approved") {
    throw new HttpsError("failed-precondition", "Only approved submissions can be showcased.");
  }

  await db.collection("project_submissions").doc(submissionId).update({
    allowShowcase: consent,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (consent) {
    const projectSnap = await db.collection("projects").doc(submission.projectId).get();
    const project = projectSnap.data()!;
    const batchSnap = await db.collection("program_batches").doc(submission.batchId).get();
    const batch = batchSnap.data()!;
    const userSnap = await db.collection("users").doc(uid).get();
    const user = userSnap.data()!;

    await db.collection("showcase").doc(submissionId).set({
      id: submissionId,
      projectId: submission.projectId,
      submissionId,
      studentId: uid,
      studentDisplayName: user.displayName || "GenZNex Student",
      batchId: submission.batchId,
      programTitle: batch.programTitle,
      title: project.title,
      brief: project.brief,
      demoUrl: submission.demoUrl || null,
      githubUrl: submission.githubUrl || null,
      thumbnailUrl: null,
      approvedAt: FieldValue.serverTimestamp(),
    });
  } else {
    // Remove from showcase if consent withdrawn
    await db.collection("showcase").doc(submissionId).delete().catch(() => {});
  }

  return { success: true, showcased: consent };
});

// ---------------------------------------------------------------------------
// P5-7. Assessments (Pre/Post Skill Tests)
// ---------------------------------------------------------------------------

export const startAssessment = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const uid = request.auth.uid;

  const { testId } = z.object({ testId: z.string().min(1) }).parse(request.data);

  const testSnap = await db.collection("aptitude_tests").doc(testId).get();
  if (!testSnap.exists) throw new HttpsError("not-found", "Test not found.");
  const test = testSnap.data()!;

  // Gather questions from question bank (without answers)
  const questionIds: string[] = test.sections.flatMap((s: any) => s.questionIds);
  const questionDocs = await Promise.all(
    questionIds.map((qId) => db.collection("question_bank").doc(qId).get())
  );

  const questions = questionDocs
    .filter((d) => d.exists)
    .map((d) => {
      const q = d.data()!;
      // Never include answers
      return { id: d.id, type: q.type, text: q.text, options: q.options, points: q.points, skillTag: q.skillTag };
    });

  // Create attempt doc
  const attemptRef = db.collection("quiz_attempts").doc();
  await attemptRef.set({
    id: attemptRef.id,
    quizId: testId,
    courseId: test.batchId || test.programId || "assessment",
    userId: uid,
    startedAt: FieldValue.serverTimestamp(),
    score: 0,
    totalPoints: questions.reduce((acc: number, q: any) => acc + q.points, 0),
    percentage: 0,
    passed: false,
    responses: {},
    status: "in_progress",
    createdAt: FieldValue.serverTimestamp(),
  });

  return { attemptId: attemptRef.id, questions, sections: test.sections };
});

export const submitAssessment = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const uid = request.auth.uid;

  const { attemptId, responses } = z.object({
    attemptId: z.string().min(1),
    responses: z.record(z.string(), z.any()),
  }).parse(request.data);

  const attemptSnap = await db.collection("quiz_attempts").doc(attemptId).get();
  if (!attemptSnap.exists) throw new HttpsError("not-found", "Attempt not found.");
  const attempt = attemptSnap.data()!;

  if (attempt.userId !== uid) throw new HttpsError("permission-denied", "Not your attempt.");
  if (attempt.status !== "in_progress") throw new HttpsError("failed-precondition", "Attempt already submitted.");

  const testSnap = await db.collection("aptitude_tests").doc(attempt.quizId).get();
  if (!testSnap.exists) throw new HttpsError("not-found", "Test not found.");
  const test = testSnap.data()!;

  const allQuestionIds: string[] = test.sections.flatMap((s: any) => s.questionIds);

  // Grade each question using private/answers
  let totalScore = 0;
  let totalPoints = 0;
  const skillScores: Record<string, { earned: number; max: number }> = {};

  for (const questionId of allQuestionIds) {
    const questionSnap = await db.collection("question_bank").doc(questionId).get();
    if (!questionSnap.exists) continue;
    const question = questionSnap.data()!;

    const answersSnap = await db.collection("question_bank").doc(questionId).collection("private").doc("answers").get();
    if (!answersSnap.exists) continue;
    const answerKey = answersSnap.data()!;

    const studentAnswer = responses[questionId];
    let earned = 0;
    const maxPoints = question.points || 1;

    if (question.type === "mcq_single" || question.type === "true_false") {
      if (studentAnswer === answerKey.correctIndex || studentAnswer === answerKey.correctBoolean) {
        earned = maxPoints;
      }
    } else if (question.type === "mcq_multi") {
      const correct = answerKey.correctIndices || [];
      const student = Array.isArray(studentAnswer) ? studentAnswer : [];
      if (JSON.stringify([...correct].sort()) === JSON.stringify([...student].sort())) {
        earned = maxPoints;
      }
    }

    totalScore += earned;
    totalPoints += maxPoints;

    const skillTag = question.skillTag || "general";
    if (!skillScores[skillTag]) skillScores[skillTag] = { earned: 0, max: 0 };
    skillScores[skillTag].earned += earned;
    skillScores[skillTag].max += maxPoints;
  }

  const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
  const passed = percentage >= (test.passingScore || 60);

  await db.collection("quiz_attempts").doc(attemptId).update({
    responses,
    score: totalScore,
    totalPoints,
    percentage,
    passed,
    skillScores,
    submittedAt: FieldValue.serverTimestamp(),
    status: "completed",
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, score: totalScore, totalPoints, percentage, passed, skillScores };
});

// ---------------------------------------------------------------------------
// P5-8. Mock Interviews & Booking
// ---------------------------------------------------------------------------

export const publishAvailability = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "trainer") {
    throw new HttpsError("permission-denied", "Only trainers or admins can publish availability.");
  }

  const { date, slots } = PublishAvailabilitySchema.parse(request.data);
  const interviewerId = request.auth.uid;
  const availId = `${interviewerId}_${date}`;

  await db.collection("interviewer_availability").doc(availId).set({
    id: availId,
    interviewerId,
    date,
    slots: slots.map((s) => ({ time: s.time, isBooked: false })),
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { success: true };
});

export const bookMockInterview = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const uid = request.auth.uid;

  const data = BookInterviewSchema.parse(request.data);
  const { interviewerId, date, time } = data;

  const availId = `${interviewerId}_${date}`;
  const availRef = db.collection("interviewer_availability").doc(availId);
  const interviewRef = db.collection("mock_interviews").doc();

  let interviewId = "";

  await db.runTransaction(async (tx) => {
    const availSnap = await tx.get(availRef);
    if (!availSnap.exists) throw new HttpsError("not-found", "Interviewer has no availability for this date.");

    const availData = availSnap.data()!;
    const slotIndex = (availData.slots as any[]).findIndex(
      (s: any) => s.time === time && !s.isBooked
    );

    if (slotIndex === -1) {
      throw new HttpsError("resource-exhausted", "This slot is not available. Please choose another time.");
    }

    // Mark slot as booked
    const updatedSlots = [...availData.slots];
    updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], isBooked: true, interviewId: interviewRef.id };

    tx.update(availRef, { slots: updatedSlots });

    // Fetch interviewer info for meeting link (placeholder)
    interviewId = interviewRef.id;
    tx.set(interviewRef, {
      id: interviewRef.id,
      batchId: data.batchId || null,
      programId: data.programId || null,
      studentId: uid,
      interviewerId,
      scheduledDate: date,
      scheduledTimeIST: time,
      durationMinutes: 45,
      meetingLink: `https://meet.google.com/genznex-${interviewRef.id.slice(0, 8)}`, // Placeholder
      status: "scheduled",
      feedbackSubmitted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  // Notify both parties
  await Promise.all([
    writeNotification(uid, "Mock Interview Scheduled!", `Your interview is on ${date} at ${time} IST.`, "interview", "/dashboard/student/interviews"),
    writeNotification(interviewerId, "New Interview Booking", `A student has booked a mock interview on ${date} at ${time}.`, "interview", "/dashboard/trainer/interviews"),
  ]);

  return { success: true, interviewId };
});

export const cancelMockInterview = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const uid = request.auth.uid;

  const { interviewId, reason } = z.object({
    interviewId: z.string().min(1),
    reason: z.string().min(5),
  }).parse(request.data);

  const interviewSnap = await db.collection("mock_interviews").doc(interviewId).get();
  if (!interviewSnap.exists) throw new HttpsError("not-found", "Interview not found.");
  const interview = interviewSnap.data()!;

  if (interview.studentId !== uid && interview.interviewerId !== uid && request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Cannot cancel this interview.");
  }

  await db.collection("mock_interviews").doc(interviewId).update({
    status: "cancelled",
    cancelledReason: reason,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Notify the other party
  const notifyUserId = uid === interview.studentId ? interview.interviewerId : interview.studentId;
  await writeNotification(notifyUserId, "Interview Cancelled", `Interview on ${interview.scheduledDate} at ${interview.scheduledTimeIST} was cancelled. Reason: ${reason}`, "interview", "/dashboard/student/interviews");

  // Re-open the availability slot
  const availId = `${interview.interviewerId}_${interview.scheduledDate}`;
  const availSnap = await db.collection("interviewer_availability").doc(availId).get();
  if (availSnap.exists) {
    const slots: any[] = availSnap.data()!.slots || [];
    const updatedSlots = slots.map((s: any) =>
      s.time === interview.scheduledTimeIST ? { ...s, isBooked: false, interviewId: null } : s
    );
    await db.collection("interviewer_availability").doc(availId).update({ slots: updatedSlots });
  }

  return { success: true };
});

export const submitInterviewFeedback = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const uid = request.auth.uid;
  const role = request.auth.token.role;
  if (role !== "trainer" && role !== "admin") {
    throw new HttpsError("permission-denied", "Only interviewers can submit feedback.");
  }

  const data = SubmitInterviewFeedbackSchema.parse(request.data);
  const { interviewId, ...feedbackData } = data;

  const interviewSnap = await db.collection("mock_interviews").doc(interviewId).get();
  if (!interviewSnap.exists) throw new HttpsError("not-found", "Interview not found.");
  const interview = interviewSnap.data()!;

  if (interview.interviewerId !== uid && role !== "admin") {
    throw new HttpsError("permission-denied", "Only the assigned interviewer can submit feedback.");
  }

  await db.collection("mock_interviews").doc(interviewId).update({
    status: "completed",
    feedbackSubmitted: true,
    feedback: {
      ...feedbackData,
      submittedAt: FieldValue.serverTimestamp(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  await writeNotification(interview.studentId, "Interview Feedback Ready", "Your mock interview feedback has been submitted. View your results.", "interview", "/dashboard/student/interviews");

  return { success: true };
});

export const getInterviewJoinLink = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const uid = request.auth.uid;

  const { interviewId } = GetInterviewJoinLinkSchema.parse(request.data);
  const interviewSnap = await db.collection("mock_interviews").doc(interviewId).get();
  if (!interviewSnap.exists) throw new HttpsError("not-found", "Interview not found.");
  const interview = interviewSnap.data()!;

  if (interview.studentId !== uid && interview.interviewerId !== uid && request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Not authorized for this interview.");
  }

  // Time window: 15 min before start
  const [year, month, day] = interview.scheduledDate.split("-").map(Number);
  const [hour, minute] = interview.scheduledTimeIST.split(":").map(Number);
  const startMs = Date.UTC(year, month - 1, day, hour - 5, minute - 30, 0);
  const windowOpenMs = startMs - 15 * 60 * 1000;
  const endMs = startMs + interview.durationMinutes * 60 * 1000;
  const nowMs = Date.now();

  if (request.auth.token.role !== "admin" && nowMs < windowOpenMs) {
    const minutesUntil = Math.ceil((windowOpenMs - nowMs) / 60000);
    throw new HttpsError("failed-precondition", `Link opens in ${minutesUntil} minute(s).`);
  }
  if (nowMs > endMs + 5 * 60 * 1000) {
    throw new HttpsError("failed-precondition", "This interview session has ended.");
  }

  return { meetingLink: interview.meetingLink };
});

// ---------------------------------------------------------------------------
// P5-9. Jobs & Placement
// ---------------------------------------------------------------------------

export const createJob = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "placement") {
    throw new HttpsError("permission-denied", "Only admins or placement officers can post jobs.");
  }

  const data = CreateJobSchema.parse(request.data);

  const ref = db.collection("jobs").doc();
  await ref.set({
    ...data,
    id: ref.id,
    status: "active",
    postedBy: request.auth.uid,
    applyUrl: data.externalApplyUrl || "",
    createdAt: FieldValue.serverTimestamp(),
  });

  return { success: true, jobId: ref.id };
});

export const applyToJob = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const uid = request.auth.uid;

  const { jobId, programId, batchId } = ApplyToJobSchema.parse(request.data);

  const jobSnap = await db.collection("jobs").doc(jobId).get();
  if (!jobSnap.exists) throw new HttpsError("not-found", "Job not found.");
  const job = jobSnap.data()!;

  if (job.status !== "active") {
    throw new HttpsError("failed-precondition", "This job listing is no longer active.");
  }

  // Check deadline
  const today = new Date().toISOString().split("T")[0];
  if (job.deadline && job.deadline < today) {
    throw new HttpsError("failed-precondition", "Application deadline has passed.");
  }

  // Check existing application
  const existingQuery = await db.collection("job_applications")
    .where("jobId", "==", jobId)
    .where("studentId", "==", uid)
    .limit(1)
    .get();

  if (!existingQuery.empty) {
    throw new HttpsError("already-exists", "You have already applied to this job.");
  }

  // Server-side eligibility checks
  if (job.programEligibility && job.programEligibility.length > 0 && programId) {
    if (!job.programEligibility.includes(programId)) {
      throw new HttpsError("failed-precondition", "You are not eligible for this position based on your program.");
    }
  }

  if (job.minAttendancePercent && batchId) {
    const enrollmentId = `${batchId}_${uid}`;
    const enrollmentSnap = await db.collection("batch_enrollments").doc(enrollmentId).get();
    if (enrollmentSnap.exists && enrollmentSnap.data()!.attendancePercent < job.minAttendancePercent) {
      throw new HttpsError("failed-precondition", `Minimum attendance of ${job.minAttendancePercent}% required.`);
    }
  }

  const userSnap = await db.collection("users").doc(uid).get();
  const user = userSnap.data()!;

  const ref = db.collection("job_applications").doc();
  await ref.set({
    id: ref.id,
    jobId,
    studentId: uid,
    studentName: user.displayName || "",
    programId: programId || null,
    batchId: batchId || null,
    status: "applied",
    appliedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    statusHistory: [{
      status: "applied",
      changedAt: new Date().toISOString(),
      changedBy: uid,
    }],
  });

  return { success: true, applicationId: ref.id };
});

export const updateApplicationStatus = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const role = request.auth.token.role;
  if (role !== "admin" && role !== "placement") {
    throw new HttpsError("permission-denied", "Only placement officers or admins can update application status.");
  }

  const { applicationId, status, note } = UpdateApplicationStatusSchema.parse(request.data);

  const appSnap = await db.collection("job_applications").doc(applicationId).get();
  if (!appSnap.exists) throw new HttpsError("not-found", "Application not found.");
  const application = appSnap.data()!;

  await db.collection("job_applications").doc(applicationId).update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
    statusHistory: FieldValue.arrayUnion({
      status,
      changedAt: new Date().toISOString(),
      changedBy: request.auth.uid,
      note: note || null,
    }),
  });

  const statusMessages: Record<string, string> = {
    shortlisted: "Congratulations! You have been shortlisted.",
    interview: "You have been selected for an interview. Check your email for details.",
    offered: "🎉 Offer received! You have been selected for this position.",
    rejected: "Thank you for applying. Unfortunately, you were not selected this time.",
  };

  if (statusMessages[status]) {
    await writeNotification(application.studentId, "Application Update", statusMessages[status], "placement", "/dashboard/student/placement");
  }

  return { success: true, status };
});

// ---------------------------------------------------------------------------
// P5-10. Resume Builder
// ---------------------------------------------------------------------------

export const saveResume = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be authenticated.");
  const uid = request.auth.uid;

  const data = SaveResumeSchema.parse(request.data);

  await db.collection("student_profiles").doc(uid).set({
    id: uid,
    userId: uid,
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Check if createdAt already exists
  const profileSnap = await db.collection("student_profiles").doc(uid).get();
  if (!profileSnap.data()?.createdAt) {
    await db.collection("student_profiles").doc(uid).update({
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  return { success: true };
});

// ---------------------------------------------------------------------------
// P5-11. Scheduled Jobs (Session Reminders)
// ---------------------------------------------------------------------------

// Runs every hour — finds sessions starting in approximately 24 hours
export const sessionReminder24h = onSchedule("every 60 minutes", async () => {
  const now = Date.now();
  const target24h = now + 24 * 60 * 60 * 1000;
  const windowMs = 35 * 60 * 1000; // ±35 minutes window

  const targetDate = new Date(target24h).toISOString().split("T")[0];
  const sessionsSnap = await db.collection("sessions")
    .where("date", "==", targetDate)
    .where("status", "==", "scheduled")
    .get();

  for (const sessionDoc of sessionsSnap.docs) {
    const session = sessionDoc.data();
    const [h, m] = session.startTimeIST.split(":").map(Number);
    const sessionMs = Date.UTC(
      Number(targetDate.split("-")[0]),
      Number(targetDate.split("-")[1]) - 1,
      Number(targetDate.split("-")[2]),
      h - 5, m - 30
    );

    if (Math.abs(sessionMs - target24h) > windowMs) continue;

    const enrollmentsSnap = await db.collection("batch_enrollments")
      .where("batchId", "==", session.batchId)
      .where("status", "==", "active")
      .get();

    await Promise.all(enrollmentsSnap.docs.map((e) =>
      writeNotification(
        e.data().userId,
        "Session Tomorrow",
        `Reminder: "${session.title}" is tomorrow at ${session.startTimeIST} IST.`,
        "training",
        "/dashboard/student/schedule"
      )
    ));
  }
});

// Runs every 15 minutes — finds sessions starting in approximately 30 minutes
export const sessionReminder30m = onSchedule("every 15 minutes", async () => {
  const now = Date.now();
  const target30m = now + 30 * 60 * 1000;
  const windowMs = 8 * 60 * 1000; // ±8 minutes

  const today = new Date().toISOString().split("T")[0];
  const sessionsSnap = await db.collection("sessions")
    .where("date", "==", today)
    .where("status", "==", "scheduled")
    .get();

  for (const sessionDoc of sessionsSnap.docs) {
    const session = sessionDoc.data();
    const [h, m] = session.startTimeIST.split(":").map(Number);
    const sessionMs = Date.UTC(
      Number(today.split("-")[0]),
      Number(today.split("-")[1]) - 1,
      Number(today.split("-")[2]),
      h - 5, m - 30
    );

    if (Math.abs(sessionMs - target30m) > windowMs) continue;

    const enrollmentsSnap = await db.collection("batch_enrollments")
      .where("batchId", "==", session.batchId)
      .where("status", "==", "active")
      .get();

    await Promise.all(enrollmentsSnap.docs.map((e) =>
      writeNotification(
        e.data().userId,
        "Session Starting Soon!",
        `"${session.title}" starts in ~30 minutes. Join on time!`,
        "training",
        "/dashboard/student/schedule"
      )
    ));
  }
});

// Runs daily at midnight IST (18:30 UTC) — auto-updates batch statuses
export const batchStatusUpdater = onSchedule("30 18 * * *", async () => {
  const today = new Date().toISOString().split("T")[0];

  // upcoming → open (if enrollment deadline not passed)
  const upcomingSnap = await db.collection("program_batches")
    .where("status", "==", "upcoming")
    .get();

  const writeBatch1 = db.batch();
  for (const doc of upcomingSnap.docs) {
    const batch = doc.data();
    if (batch.startDate <= today && batch.enrollmentDeadline >= today) {
      writeBatch1.update(doc.ref, { status: "open", updatedAt: FieldValue.serverTimestamp() });
    }
  }
  await writeBatch1.commit();

  // open → ongoing (when start date arrives)
  const openSnap = await db.collection("program_batches")
    .where("status", "==", "open")
    .get();

  const writeBatch2 = db.batch();
  for (const doc of openSnap.docs) {
    const batch = doc.data();
    if (batch.startDate <= today) {
      writeBatch2.update(doc.ref, { status: "ongoing", updatedAt: FieldValue.serverTimestamp() });
    }
  }
  await writeBatch2.commit();

  // ongoing → completed (when end date passes)
  const ongoingSnap = await db.collection("program_batches")
    .where("status", "==", "ongoing")
    .get();

  const writeBatch3 = db.batch();
  for (const doc of ongoingSnap.docs) {
    const batch = doc.data();
    if (batch.endDate < today) {
      writeBatch3.update(doc.ref, { status: "completed", updatedAt: FieldValue.serverTimestamp() });
    }
  }
  await writeBatch3.commit();
});
