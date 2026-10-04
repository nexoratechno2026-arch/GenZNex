/**
 * GenZNex Domain Models & Firestore Schema Definitions
 * 14 Core Collections + Subcollections
 */

export type UserRole = "student" | "trainer" | "admin";

// 1. users: /users/{userId}
export interface UserDoc {
  uid: string;
  email: string;
  phoneNumber?: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  headline?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  createdAt: unknown; // Firestore Timestamp
  updatedAt: unknown; // Firestore Timestamp
}

// 2. courses: /courses/{courseId}
export type CourseStatus = "draft" | "pending_review" | "published" | "rejected" | "archived";
export type CourseCategory =
  | "Web Development"
  | "AI & Machine Learning"
  | "Data Analytics"
  | "Digital Marketing"
  | "Communication Skills"
  | "Placement Prep"
  | "Full Stack"
  | "Cybersecurity"
  | "DevOps & Cloud"
  | string;

export type CourseLevel = "beginner" | "intermediate" | "advanced" | "all_levels";
export type CourseLanguage = "English" | "Tamil";

export interface CourseInstructor {
  uid: string;
  name: string;
  photoURL?: string;
  headline?: string;
}

export interface CourseDoc {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  category: string;                       // e.g. "web-development"
  categoryName: string;                   // e.g. "Web Development"
  tags: string[];
  level: CourseLevel;
  language: CourseLanguage;
  priceInPaise: number;                   // 0 = Free
  discountPriceInPaise?: number;          // Optional promotional price in paise
  priceInInr?: number;                    // Convenient INR equivalent
  originalPriceInInr?: number;            // Convenient original INR equivalent
  thumbnailUrl: string;
  promoVideoUrl?: string;
  learningOutcomes: string[];
  requirements: string[];
  instructor: CourseInstructor;
  // Backward compatibility fields
  trainerId?: string;
  trainerName?: string;
  trainerAvatar?: string;
  rating: number;
  ratingCount: number;
  enrollmentCount: number;
  lessonCount: number;
  totalDurationMinutes: number;
  isFeatured: boolean;
  status: CourseStatus;
  rejectionReason?: string;
  submittedAt?: unknown;
  publishedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  // Legacy flag
  isPublished?: boolean;
}

// Subcollection: /courses/{courseId}/modules/{moduleId}
export interface ModuleDoc {
  id: string;
  courseId?: string;
  title: string;
  order: number;
  description?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Subcollection: /courses/{courseId}/modules/{moduleId}/lessons/{lessonId}
export type LessonType = "video" | "pdf" | "text" | "link";

export interface VideoMetadata {
  provider: "mux" | "bunny" | "vimeo" | "youtube" | "googledrive";
  videoId: string;
  durationSeconds?: number;
}

export interface LessonDoc {
  id: string;
  courseId?: string;
  moduleId: string;
  title: string;
  order: number;
  type: LessonType;
  durationMinutes: number;
  isPreview: boolean;
  videoMetadata?: VideoMetadata;
  videoProviderId?: string; // Legacy field
  pdfUrl?: string;
  textContent?: string;
  externalLink?: string;
  notesMarkdown?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Category Document: /categories/{categoryId}
export interface CategoryDoc {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  courseCount: number;
  order: number;
}

// Audit Log Document: /audit_logs/{logId}
export interface AuditLogDoc {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: UserRole;
  action: "course_approve" | "course_reject" | "course_feature" | "course_unfeature" | "course_archive" | string;
  targetId: string;
  details: Record<string, unknown>;
  timestamp: unknown;
}

// 3. enrollments: /enrollments/{userId_courseId}
export type EnrollmentStatus = "active" | "completed" | "refunded" | "suspended";

export interface EnrollmentDoc {
  id: string; // Typically `${userId}_${courseId}`
  userId: string;
  courseId: string;
  trainerId: string;
  orderId: string;
  paymentId: string;
  status: EnrollmentStatus;
  progressPercentage: number;
  completedLessons: string[]; // List of completed lesson IDs
  enrolledAt: unknown;
  updatedAt: unknown;
}

// 4. progress: /progress/{userId_courseId}
export interface ProgressDoc {
  id: string; // `${userId}_${courseId}`
  userId: string;
  courseId: string;
  lastAccessedLessonId?: string;
  completedLessonIds: string[];
  quizScores: Record<string, number>; // quizId -> percentage score
  percentComplete: number;
  lastActiveAt: unknown;
}

// 5. Quizzes: /courses/{courseId}/quizzes/{quizId}
export type QuizQuestionType = "mcq_single" | "mcq_multi" | "true_false" | "short_answer";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  text: string;
  options?: string[]; // For MCQ & true/false
  points: number;
  explanation?: string;
  imageUrl?: string;
}

export type QuizShowAnswersPolicy = "never" | "after_pass" | "always";

export interface QuizDoc {
  id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  title: string;
  description?: string;
  passingScore: number; // e.g. 70 (%)
  timeLimitMinutes?: number; // 0 or undefined = untimed
  maxAttempts?: number; // 0 or undefined = unlimited
  shuffleQuestions?: boolean;
  showAnswersAfterSubmit: QuizShowAnswersPolicy;
  questions: QuizQuestion[]; // Answers EXCLUDED (stored in /private/answers)
  createdAt: unknown;
  updatedAt?: unknown;
}

// Server-Only Answer Key: /courses/{courseId}/quizzes/{quizId}/private/answers
export interface QuestionGradingRule {
  correctIndices?: number[]; // For mcq_single (length 1) or mcq_multi
  correctBoolean?: boolean; // For true_false
  correctText?: string; // For short_answer exact
  keywords?: string[]; // For short_answer keyword match
  isCaseSensitive?: boolean;
  partialCredit?: boolean;
}

export interface QuizPrivateAnswersDoc {
  id: "answers";
  quizId: string;
  answers: Record<string, QuestionGradingRule>; // questionId -> QuestionGradingRule
}

// Student Quiz Attempt: /quiz_attempts/{attemptId}
export type QuizAttemptStatus = "in_progress" | "completed" | "timed_out";

export interface QuizAttemptDoc {
  id: string;
  quizId: string;
  courseId: string;
  userId: string;
  startedAt: unknown;
  submittedAt?: unknown;
  timeLimitMinutes?: number;
  isTimedOut?: boolean;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  responses: Record<string, any>; // questionId -> student answer
  status: QuizAttemptStatus;
  createdAt: unknown;
  updatedAt?: unknown;
}

// 6. Assignments: /courses/{courseId}/assignments/{assignmentId}
export type AssignmentLatePolicy = "reject" | "deduct_points" | "allow_with_flag";

export interface AssignmentDoc {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  instructionsMarkdown: string;
  dueDate?: unknown;
  maxPoints: number;
  passingScore?: number;
  allowedFileTypes: string[]; // e.g. ["pdf", "zip", "png", "jpg"]
  maxFileSizeBytes: number; // e.g. 25 * 1024 * 1024
  latePolicy: AssignmentLatePolicy;
  latePenaltyPercent?: number; // e.g. 10%
  createdAt: unknown;
  updatedAt?: unknown;
}

// Assignment Submissions: /submissions/{submissionId}
export type SubmissionStatus = "submitted" | "graded" | "resubmit_requested";

export interface SubmissionDoc {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  textSubmission?: string;
  fileStoragePath?: string;
  fileDownloadUrl?: string;
  fileName?: string;
  submittedAt: unknown;
  isLate: boolean;
  status: SubmissionStatus;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: unknown;
  createdAt: unknown;
  updatedAt?: unknown;
}

// Per-Lesson Progress: /enrollments/{userId_courseId}/lesson_progress/{lessonId}
export interface LessonProgressDoc {
  id: string; // lessonId
  lessonId: string;
  courseId: string;
  userId: string;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  completedAt?: unknown;
  updatedAt: unknown;
}

// Lesson Notes: /enrollments/{userId_courseId}/notes/{noteId}
export interface LessonNoteDoc {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  timestampSeconds: number;
  noteText: string;
  createdAt: unknown;
}

// 7. batches: /batches/{batchId}
export type BatchStatus = "upcoming" | "ongoing" | "completed";

export interface BatchDoc {
  id: string;
  courseId: string;
  courseTitle: string;
  name: string; // e.g. "Alpha Batch 2026"
  trainerId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  capacity: number;
  enrolledStudentIds: string[];
  schedule: string; // e.g. "Mon, Wed, Fri 7:00 PM IST"
  meetingLink?: string;
  status: BatchStatus;
  createdAt: unknown;
}

// 8. attendance: /attendance/{batchId_date}
export type AttendanceRecordStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  status: AttendanceRecordStatus;
  markedAt: unknown;
  remarks?: string;
}

export interface AttendanceDoc {
  id: string; // `${batchId}_${date}`
  batchId: string;
  date: string; // YYYY-MM-DD
  sessionTopic: string;
  records: Record<string, AttendanceRecord>; // userId -> AttendanceRecord
  recordedByTrainerId: string;
  createdAt: unknown;
}

// 9. payments: /payments/{orderId}
export type PaymentStatus = 
  | "created" 
  | "pending" 
  | "captured" 
  | "failed" 
  | "refunded" 
  | "partially_refunded";

export interface PaymentAmountBreakdown {
  basePriceInPaise: number;
  discountInPaise: number;
  taxableAmountInPaise: number;
  gstInPaise: number; // 18% of taxable amount
  totalInPaise: number; // taxableAmount + gst
}

export interface PaymentDoc {
  id: string; // Razorpay orderId
  orderId: string;
  paymentId?: string; // Razorpay payment ID (e.g. pay_XYZ...)
  userId: string;
  userEmail: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  trainerId: string;
  amountBreakdown: PaymentAmountBreakdown;
  amountInPaise: number; // totalInPaise
  currency: "INR";
  status: PaymentStatus;
  method?: string; // "card" | "upi" | "netbanking" | "wallet" | "coupon_100"
  couponId?: string;
  couponCode?: string;
  receipt: string;
  failureReason?: string;
  razorpayRawResponse?: Record<string, unknown>;
  createdAt: unknown;
  updatedAt: unknown;
  capturedAt?: unknown;
}

// Webhook idempotency: /webhookEvents/{eventId}
export interface WebhookEventDoc {
  id: string; // Event ID e.g. "event_..."
  eventId: string;
  type: string;
  processedAt: unknown;
}

// 10. coupons: /coupons/{couponId}
export type CouponDiscountType = "percent" | "flat";

export interface CouponDoc {
  id: string; // Uppercase code e.g. "GENZ50"
  code: string;
  type: CouponDiscountType;
  value: number; // e.g. 20 for 20%, or 50000 for ₹500 in paise
  maxDiscountInPaise?: number; // Cap for percent discounts
  minOrderInPaise: number; // Minimum course price required
  validityDates: {
    startsAt: unknown;
    expiresAt: unknown;
  };
  usageLimit: number; // Total max redemptions
  perUserLimit: number; // Max redemptions per student (default 1)
  applicableCourses: string[]; // empty array = all courses
  applicableCategories: string[]; // empty array = all categories
  isActive: boolean;
  usedCount: number;
  createdAt: unknown;
  updatedAt: unknown;
}

// Invoices: /invoices/{invoiceId}
export interface InvoiceDoc {
  id: string; // Unique invoice ID
  invoiceNumber: string; // e.g. "GZN-INV-2026-1042"
  paymentId: string;
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  amountBreakdown: PaymentAmountBreakdown;
  gstRatePercent: number;
  hsnSacCode: string;
  storagePath: string; // "invoices/{userId}/{invoiceNumber}.pdf"
  pdfUrl?: string;
  createdAt: unknown;
}

// Refunds: /refunds/{refundId}
export interface RefundDoc {
  id: string;
  paymentId: string; // Razorpay payment ID (pay_...)
  orderId: string; // Razorpay order ID (order_...)
  razorpayRefundId: string; // rfd_...
  amountInPaise: number;
  reason: string;
  status: "processed" | "failed" | "pending";
  requestedBy: string; // User ID or Admin ID
  processedBy: string; // Admin ID or 'system'
  createdAt: unknown;
}

// Platform Config: /config/payments
export interface PaymentConfigDoc {
  gstRatePercent: number; // default: 18
  businessName: string; // "GenZNex EdTech Private Limited"
  gstin: string; // "27AABCU9603R1ZM"
  businessAddress: string; // "241, East Permanur, Anna Park Backside, Salem-7, Tamil Nadu 636007, India"
  invoicePrefix: string; // "GZN-INV-2026-"
  currentInvoiceSequence: number; // e.g. 1000
  refundWindowDays: number; // default: 7
  hsnSacCode: string; // "999293" (Commercial training & coaching)
  caDisclaimer: string;
  updatedAt: unknown;
}

// 11. certificates: /certificates/{certificateId}
export type CertificateStatus = "valid" | "revoked";

export interface CertificateDoc {
  id: string; // e.g. "GZN-2026-A1B2C3D4"
  certificateNumber: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  trainerId?: string;
  trainerName?: string;
  issueDate: unknown;
  completionDate?: unknown;
  gradePercent?: number;
  verificationUrl: string;
  storagePath: string; // "certificates/{certificateId}.pdf"
  pdfUrl?: string;
  status: CertificateStatus;
  revocationReason?: string;
  issuedByAdminOrTrainerId: string;
  createdAt: unknown;
}

// Course Reviews: /courses/{courseId}/reviews/{userId}
export interface CourseReviewDoc {
  id: string; // userId
  courseId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5
  reviewText: string;
  isHidden: boolean;
  trainerReply?: {
    text: string;
    repliedAt: unknown;
  };
  createdAt: unknown;
  updatedAt: unknown;
}


export type NotificationType =
  | "course"
  | "batch"
  | "payment"
  | "system"
  | "training"
  | "payment_success"
  | "invoice_generated"
  | "enrollment_success"
  | "course_approved"
  | "course_rejected"
  | "session_reminder_24h"
  | "session_reminder_30m"
  | "session_rescheduled"
  | "session_cancelled"
  | "assignment_graded"
  | "quiz_result"
  | "certificate_issued"
  | "waitlist_promoted"
  | "forum_reply"
  | "forum_accepted"
  | "badge_earned"
  | "level_up"
  | "streak_at_risk"
  | "job_application_status"
  | "job_alert"
  | "system_broadcast";

export interface NotificationDoc {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: unknown;
}

// 14. jobs: /jobs/{jobId}
export type JobType = "Full-time" | "Internship";
export type JobStatus = "active" | "expired";

export interface JobDoc {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  location: string; // e.g. "Remote" | "Bangalore" | "Mumbai" | "Delhi-NCR"
  type: JobType;
  stipendOrSalary: string; // e.g. "₹8-12 LPA" or "₹30k/mo"
  description: string;
  requirements: string[];
  applyUrl: string;
  status: JobStatus;
  postedBy: string;
  createdAt: unknown;
}

// Convenience Type Aliases
export type Course = CourseDoc;
export type Module = ModuleDoc;
export type Lesson = LessonDoc;
export type Category = CategoryDoc;
export type AuditLog = AuditLogDoc;
export type UserProfile = UserDoc;
export type Enrollment = EnrollmentDoc;
export type Progress = ProgressDoc;
export type Quiz = QuizDoc;
export type Submission = SubmissionDoc;
export type Batch = BatchDoc;
export type Attendance = AttendanceDoc;
export type PaymentRecord = PaymentDoc;
export type Coupon = CouponDoc;
export type Invoice = InvoiceDoc;
export type Refund = RefundDoc;
export type PaymentConfig = PaymentConfigDoc;
export type WebhookEvent = WebhookEventDoc;
export type Certificate = CertificateDoc;
export type CourseReview = CourseReviewDoc;
export type Assignment = AssignmentDoc;
export type QuizAttempt = QuizAttemptDoc;
export type LessonNote = LessonNoteDoc;
export type LessonProgress = LessonProgressDoc;
export type ForumPost = ForumPostDoc;
export type Notification = NotificationDoc;
export type Job = JobDoc;

// =============================================================================
// PHASE 5: STUDENT TRAINING MODULE TYPES
// =============================================================================

// --- Training Programs ---

export type ProgramType = "bootcamp" | "internship" | "skill_track";
export type ProgramMode = "online" | "offline" | "hybrid";
export type ProgramStatus = "draft" | "published" | "archived";

export interface WeekSyllabusItem {
  week: number;
  title: string;
  topics: string[];
}

export interface ProgramCurriculum {
  linkedCourseIds: string[];
  weeklySyllabus: WeekSyllabusItem[];
}

export interface TrainingProgramDoc {
  id: string;
  title: string;
  slug: string;
  type: ProgramType;
  shortDescription: string;
  description: string;
  durationWeeks: number;
  mode: ProgramMode;
  curriculum: ProgramCurriculum;
  outcomes: string[];
  eligibility: string;
  priceInPaise: number; // 0 = free
  certificateTemplateId?: string;
  isFeatured: boolean;
  status: ProgramStatus;
  instructorIds: string[]; // trainer UIDs
  thumbnailUrl?: string;
  faqs?: { question: string; answer: string }[];
  createdBy: string; // admin UID
  createdAt: unknown;
  updatedAt: unknown;
}

// --- Batches (extends existing BatchDoc with Phase 5 fields) ---
// Phase 5 uses a new `batches` model. The old BatchDoc is kept for compatibility.

export type BatchStatus5 =
  | "upcoming"
  | "open"
  | "full"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface WeeklySchedule {
  days: string[]; // e.g. ["Mon", "Wed", "Fri"]
  timeIST: string; // e.g. "19:00"
}

export interface ProgramBatchDoc {
  id: string;
  programId: string;
  programTitle: string;
  name: string;
  trainerIds: string[];
  mentorIds: string[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  weeklySchedule: WeeklySchedule;
  timezone: "Asia/Kolkata";
  capacity: number;
  enrolledCount: number; // denormalized, CF-only write
  enrollmentDeadline: string; // YYYY-MM-DD
  status: BatchStatus5;
  waitlistEnabled: boolean;
  waitlistStudentIds: string[]; // ordered FIFO, CF-only write
  minAttendancePercent: number; // default 75
  priceInPaise: number;
  createdAt: unknown;
  updatedAt: unknown;
}

// --- Batch Enrollments ---

export type BatchEnrollmentStatus =
  | "active"
  | "completed"
  | "refunded"
  | "waitlisted"
  | "cancelled";

export interface BatchEnrollmentDoc {
  id: string; // "${batchId}_${userId}"
  batchId: string;
  userId: string;
  userName: string;
  userEmail: string;
  programId: string;
  orderId: string;
  paymentId: string;
  status: BatchEnrollmentStatus;
  attendancePercent: number; // denormalized
  enrolledAt: unknown;
  updatedAt: unknown;
}

// --- Sessions ---

export type SessionStatus =
  | "scheduled"
  | "live"
  | "completed"
  | "cancelled"
  | "rescheduled";
export type MeetingProvider = "google_meet" | "zoom" | "custom";

export interface SessionDoc {
  id: string;
  batchId: string;
  programId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTimeIST: string; // "HH:MM"
  durationMinutes: number;
  topic: string;
  meetingProvider: MeetingProvider;
  // joinLink is NEVER sent to client. Retrieved only via getSessionJoinLink CF.
  joinLink: string;
  recordingLink?: string;
  recordingVideoId?: string;
  recordingProvider?: string;
  status: SessionStatus;
  cancelledReason?: string;
  rescheduledFrom?: string;
  rescheduledAt?: unknown;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
}

// --- Session Attendance (one doc per session×student) ---

export type SessionAttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "excused"
  | "present_recorded";

export interface SessionAttendanceDoc {
  id: string; // "${sessionId}_${userId}"
  sessionId: string;
  batchId: string;
  userId: string;
  status: SessionAttendanceStatus;
  joinedAt?: unknown; // server-recorded on join-click
  watchPercent?: number; // for recorded attendance threshold
  markedBy: string; // trainerId or "system"
  markedAt: unknown;
  overriddenBy?: string;
  remarks?: string;
}

// --- Projects ---

export type ProjectSubmissionType =
  | "github_url"
  | "demo_url"
  | "file"
  | "figma_url"
  | "drive_url";

export interface RubricItem {
  criterionId: string;
  criterion: string;
  description: string;
  maxPoints: number;
  weight: number; // 0-1, sum should equal 1
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  order: number;
}

export interface ProjectDoc {
  id: string;
  programId?: string;
  batchId?: string;
  title: string;
  brief: string; // Markdown
  requirements: string[];
  rubric: RubricItem[];
  milestones: ProjectMilestone[];
  allowedSubmissionTypes: ProjectSubmissionType[];
  teamSize: number; // 1 = individual
  allowPeerReview: boolean;
  peerReviewCount: number;
  showcaseEligible: boolean;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
}

// --- Project Submissions ---

export type ProjectSubmissionStatus =
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export interface ProjectSubmissionDoc {
  id: string;
  projectId: string;
  batchId: string;
  userId: string; // or team lead
  teamId?: string;
  milestoneId: string;
  version: number;
  githubUrl?: string;
  demoUrl?: string;
  figmaUrl?: string;
  driveUrl?: string;
  fileStoragePath?: string;
  fileDownloadUrl?: string;
  description: string;
  status: ProjectSubmissionStatus;
  rubricScores: Record<string, number>; // criterionId → points
  totalScore: number;
  feedback: string;
  gradedBy?: string;
  gradedAt?: unknown;
  allowShowcase: boolean; // student consent
  submittedAt: unknown;
  updatedAt: unknown;
}

// --- Project Teams ---

export interface ProjectTeamDoc {
  id: string;
  projectId: string;
  batchId: string;
  name: string;
  leadUserId: string;
  memberIds: string[];
  invitePending: string[];
  createdAt: unknown;
}

// --- Aptitude Tests & Question Bank ---

export type AssessmentType =
  | "pre_assessment"
  | "post_assessment"
  | "aptitude"
  | "practice";
export type TestMode = "practice" | "test";

export interface TestSection {
  id: string;
  title: string;
  skillTag: string;
  timeLimitMinutes: number;
  questionIds: string[];
}

export interface AptitudeTestDoc {
  id: string;
  batchId?: string;
  programId?: string;
  type: AssessmentType;
  title: string;
  sections: TestSection[];
  passingScore: number; // %
  mode: TestMode;
  createdAt: unknown;
  updatedAt: unknown;
}

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface QuestionBankDoc {
  id: string;
  type: QuizQuestionType; // reuse from Phase 4
  text: string;
  options?: string[];
  points: number;
  difficulty: QuestionDifficulty;
  skillTag: string;
  topic: string;
  explanation?: string;
  createdBy: string;
  createdAt: unknown;
}

// --- Mock Interviews ---

export type MockInterviewStatus =
  | "pending"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export interface InterviewFeedback {
  communication: number; // 1-5
  technicalDepth: number;
  problemSolving: number;
  confidence: number;
  overall: number;
  strengths: string;
  improvements: string;
  submittedAt: unknown;
}

export interface MockInterviewDoc {
  id: string;
  batchId?: string;
  programId?: string;
  studentId: string;
  interviewerId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTimeIST: string; // "HH:MM"
  durationMinutes: number;
  meetingLink: string; // gated, same CF pattern as sessions
  status: MockInterviewStatus;
  feedbackSubmitted: boolean;
  feedback?: InterviewFeedback;
  cancelledReason?: string;
  createdAt: unknown;
  updatedAt: unknown;
  // TODO Phase 6: AI interview practice hook — extend with aiSessionId field
}

export interface InterviewerSlot {
  time: string; // "HH:MM"
  isBooked: boolean;
  interviewId?: string;
}

export interface InterviewerAvailabilityDoc {
  id: string; // "${interviewerId}_${date}"
  interviewerId: string;
  date: string; // YYYY-MM-DD
  slots: InterviewerSlot[];
  createdAt: unknown;
}

// --- Student Profiles (Resume/Placement) ---

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
  gpa?: string;
}

export interface Experience {
  company: string;
  role: string;
  startDate: string; // YYYY-MM
  endDate?: string;
  description: string;
  isCurrent: boolean;
}

export type ResumeTemplate = "classic" | "modern" | "minimal";

export interface StudentProfileDoc {
  id: string; // userId
  userId: string;
  headline: string;
  summary: string;
  education: Education[];
  skills: string[];
  experience: Experience[];
  links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    other?: string;
  };
  preferredRoles: string[];
  preferredLocations: string[];
  resumeStoragePath?: string;
  resumeDownloadUrl?: string;
  resumeTemplate?: ResumeTemplate;
  resumeData?: Record<string, unknown>;
  isProfileVisible: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

// --- Jobs (Phase 5 extended) ---

export type JobApplyMethod = "internal" | "external";

export interface JobDocV2 extends Omit<JobDoc, "stipendOrSalary"> {
  programEligibility: string[]; // programIds or [] = all
  minAttendancePercent?: number;
  minScore?: number;
  deadline: string; // YYYY-MM-DD
  applyMethod: JobApplyMethod;
  externalApplyUrl?: string;
  skills?: string[];
  stipendOrSalary?: string; // optional in V2 (required in base JobDoc)
  companyPartnerId?: string;
}

// --- Job Applications ---

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview"
  | "offered"
  | "rejected"
  | "withdrawn";

export interface ApplicationStatusHistory {
  status: ApplicationStatus;
  changedAt: unknown;
  changedBy: string;
  note?: string;
}

export interface JobApplicationDoc {
  id: string;
  jobId: string;
  studentId: string;
  studentName: string;
  programId?: string;
  batchId?: string;
  status: ApplicationStatus;
  resumeSnapshotUrl?: string;
  appliedAt: unknown;
  updatedAt: unknown;
  statusHistory: ApplicationStatusHistory[];
}

// --- Company Partners ---

export interface CompanyPartnerDoc {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
  description: string;
  hiringFor: string[];
  createdAt: unknown;
}

// --- Public Showcase ---

export interface ShowcaseDoc {
  id: string; // submissionId
  projectId: string;
  submissionId: string;
  studentId: string;
  studentDisplayName: string; // privacy: displayName only, no email
  batchId: string;
  programTitle: string;
  title: string;
  brief: string;
  demoUrl?: string;
  githubUrl?: string;
  thumbnailUrl?: string;
  approvedAt: unknown;
}

// --- Phase 5 Training Config ---
export interface TrainingConfigDoc {
  recordedWatchThresholdPercent: number; // default 70
  defaultMinAttendancePercent: number; // default 75
  maxWaitlistSize: number; // default 50
  updatedAt: unknown;
}

// Phase 5 Convenience Aliases
export type TrainingProgram = TrainingProgramDoc;
export type ProgramBatch = ProgramBatchDoc;
export type BatchEnrollment = BatchEnrollmentDoc;
export type Session = SessionDoc;
export type SessionAttendance = SessionAttendanceDoc;
export type Project = ProjectDoc;
export type ProjectSubmission = ProjectSubmissionDoc;
export type ProjectTeam = ProjectTeamDoc;
export type AptitudeTest = AptitudeTestDoc;
export type QuestionBank = QuestionBankDoc;
export type MockInterview = MockInterviewDoc;
export type InterviewerAvailability = InterviewerAvailabilityDoc;
export type StudentProfile = StudentProfileDoc;
export type JobApplication = JobApplicationDoc;
export type CompanyPartner = CompanyPartnerDoc;
export type Showcase = ShowcaseDoc;

// ============================================================================
// PHASE 6: GAMIFICATION, NOTIFICATIONS, FORUM & ANALYTICS
// ============================================================================

// --- 1. Gamification Engine Types ---
export type XpEventType =
  | "lesson_completed"
  | "quiz_passed"
  | "quiz_perfect"
  | "assignment_passed"
  | "session_attended"
  | "project_approved"
  | "course_completed"
  | "review_posted"
  | "forum_answer_accepted"
  | "daily_login";

export type LevelName = "Rookie" | "Explorer" | "Achiever" | "Pro" | "Legend";

export interface XpLedgerDoc {
  id: string; // `${userId}_${eventType}_${refId}`
  userId: string;
  eventType: XpEventType;
  refId: string;
  xpAwarded: number;
  metadata?: Record<string, unknown>;
  awardedAt: unknown;
  dateIST: string; // YYYY-MM-DD
}

export interface UserGamificationDoc {
  userId: string;
  totalXp: number;
  currentLevel: number;
  levelName: LevelName;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  streakFreezesRemaining: number; // default 1 per week
  streakFreezeLastGrantedWeek?: string; // YYYY-WW
  leaderboardOptOut: boolean;
  earnedBadgeIds: string[];
  updatedAt: unknown;
}

export type BadgeCategory = "learning" | "streak" | "community" | "milestone";
export type BadgeCriteriaType = "count" | "streak" | "score" | "special";

export interface BadgeDoc {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon identifier
  category: BadgeCategory;
  criteriaType: BadgeCriteriaType;
  threshold: number;
  order: number;
}

export interface UserBadgeAwardDoc {
  id: string; // `${userId}_${badgeId}`
  userId: string;
  badgeId: string;
  badgeName: string;
  awardedAt: unknown;
}

export type LeaderboardScope = "weekly" | "alltime" | "course" | "batch";

export interface LeaderboardRankItem {
  rank: number;
  userId: string;
  displayName: string;
  photoURL?: string;
  xp: number;
  level: number;
  levelName: string;
}

export interface LeaderboardSnapshotDoc {
  id: string; // "global_weekly" | "global_alltime" | `course_${courseId}` | `batch_${batchId}`
  type: LeaderboardScope;
  scopeId?: string;
  rankings: LeaderboardRankItem[];
  generatedAt: unknown;
}

export interface GamificationConfigDoc {
  xpRules: Record<XpEventType, number>;
  dailyCaps: Partial<Record<XpEventType, number>>;
  levelFormula: {
    base: number;
    multiplier: number;
  };
  levels: Array<{ level: number; name: LevelName; minXp: number }>;
}

// --- 2. Notification Engine Types ---
export type NotificationChannel = "in_app" | "push" | "email" | "sms";

// NotificationType is defined above in core models

export interface NotificationSettingsDoc {
  userId: string;
  channels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
  types: Partial<Record<NotificationType, boolean>>;
  quietHours: {
    enabled: boolean;
    startIST: string; // e.g. "22:00"
    endIST: string;   // e.g. "08:00"
  };
  updatedAt: unknown;
}

export interface NotificationQueueItemDoc {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  channels: NotificationChannel[];
  data?: Record<string, string>;
  linkUrl?: string;
  status: "pending" | "processing" | "sent" | "failed" | "dead_letter";
  attempts: number;
  maxAttempts: number;
  scheduledFor?: unknown;
  createdAt: unknown;
  error?: string;
}

export interface FcmTokenDoc {
  token: string;
  userId: string;
  userAgent?: string;
  lastUsedAt: unknown;
  createdAt: unknown;
}

// --- 3. Discussion Forum & Doubt Clearing Types ---
export type ForumScopeType = "course" | "batch" | "global";

export interface ForumPostDoc {
  id: string;
  scopeType: ForumScopeType;
  scopeId: string; // courseId or batchId
  lessonId?: string;
  videoTimestampSeconds?: number;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  title: string;
  content: string; // markdown
  tags: string[];
  imageUrls: string[];
  replyCount: number;
  upvoteCount: number;
  isResolved: boolean;
  hasAcceptedAnswer: boolean;
  acceptedReplyId?: string;
  isPinned: boolean;
  isLocked: boolean;
  status: "active" | "hidden" | "deleted";
  reportCount: number;
  lastActivityAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface ForumReplyDoc {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  content: string;
  isAccepted: boolean;
  isInstructorAnswer: boolean;
  upvoteCount: number;
  status: "active" | "hidden" | "deleted";
  createdAt: unknown;
  updatedAt: unknown;
}

export interface ForumVoteDoc {
  id: string; // `${userId}_${targetType}_${targetId}`
  userId: string;
  targetType: "post" | "reply";
  targetId: string;
  createdAt: unknown;
}

export interface ForumReportDoc {
  id: string;
  reporterId: string;
  targetType: "post" | "reply";
  targetId: string;
  postId: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: unknown;
}

// --- 4. Analytics & Event Aggregation Types ---
export interface DailyStatsDoc {
  date: string; // YYYY-MM-DD
  activeUsers: { dau: number };
  signups: number;
  revenueInPaise: number;
  ordersCount: number;
  lessonsCompleted: number;
  quizzesAttempted: number;
  quizzesPassed: number;
  certificatesIssued: number;
  forumPostsCreated: number;
  forumRepliesCreated: number;
  notificationsSent: number;
  notificationsFailed: number;
  updatedAt: unknown;
}

export interface TrackEventParams {
  eventName: string;
  category?: string;
  label?: string;
  value?: number;
  params?: Record<string, unknown>;
}

// --- 5. Phase 7: Dynamic Feature Flags Configuration (/config/features) ---
export interface FeatureFlagsDoc {
  installmentsEnabled: boolean;
  smsStubEnabled: boolean;
  whatsappStubEnabled: boolean;
  publicShowcaseEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceNotice?: string;
  appCheckEnforced: boolean;
  updatedAt: unknown;
  updatedBy?: string;
}


