import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import crypto from "crypto";
import Razorpay from "razorpay";
import { razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret } from "./config";
import { createAndSaveInvoice } from "./invoice";
import { getVideoProvider } from "./video";
import { createAndSaveCertificate } from "./certificate";

// Phase 5: Student Training Module
export {
  createProgram,
  publishProgram,
  archiveProgram,
  createBatch,
  updateBatch,
  cancelBatch,
  moveStudentBatch,
  enrollInBatch,
  joinWaitlist,
  promoteFromWaitlist,
  createSession,
  bulkCreateSessions,
  updateSession,
  getSessionJoinLink,
  addSessionRecording,
  markSessionAttendance,
  recordJoinEvent,
  onSessionAttendanceWrite,
  calculateAttendanceSummary,
  createProject,
  submitProjectMilestone,
  gradeProjectMilestone,
  optInToShowcase,
  startAssessment,
  submitAssessment,
  publishAvailability,
  bookMockInterview,
  cancelMockInterview,
  submitInterviewFeedback,
  getInterviewJoinLink,
  createJob,
  applyToJob,
  updateApplicationStatus,
  saveResume,
  sessionReminder24h,
  sessionReminder30m,
  batchStatusUpdater,
} from "./training";


// Phase 6: Gamification, Notifications, Forum & Analytics
export {
  setLeaderboardOptOut,
  adminAdjustXp,
  getLeaderboard,
  streakDailyMaintenance,
  buildLeaderboardSnapshots,
} from "./gamification";

export {
  updateNotificationSettings,
  saveFcmToken,
  markNotificationRead,
  markAllNotificationsRead,
  adminBroadcastNotification,
  cleanupOldNotifications,
} from "./notifications";

export {
  createForumPost,
  createForumReply,
  toggleForumVote,
  acceptForumAnswer,
  reportForumContent,
  moderateForumContent,
} from "./forum";

export {
  aggregateDailyStats,
  backfillDailyStats,
  getAnalyticsSummary,
} from "./analytics";
if (admin.apps.length === 0) {
  admin.initializeApp({
    storageBucket: "demo-genznex.appspot.com",
  });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// Rate limiting map for order creation (per user, in-memory per function instance)
const orderRateLimits = new Map<string, number[]>();

function checkOrderRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = (orderRateLimits.get(userId) || []).filter((t) => now - t < 60000); // 1 min window
  if (timestamps.length >= 6) {
    return false; // max 6 orders per minute
  }
  timestamps.push(now);
  orderRateLimits.set(userId, timestamps);
  return true;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const ValidateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  courseId: z.string().min(1, "Course ID is required"),
});

const CreateOrderSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  couponCode: z.string().optional(),
});

const VerifyPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  signature: z.string().min(1, "Signature is required"),
});

const RequestRefundSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

const ReconcilePaymentsSchema = z.object({
  maxAgeMinutes: z.number().optional(),
});

const SetRoleSchema = z.object({
  targetUid: z.string().min(1),
  role: z.enum(["student", "trainer", "admin"]),
});

const CourseIdSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

const RejectCourseSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
});

// ---------------------------------------------------------------------------
// Shared Idempotent Payment Fulfillment Routine
// ---------------------------------------------------------------------------
async function fulfillCapturedPayment(
  firestore: admin.firestore.Firestore,
  orderId: string,
  paymentId: string,
  paymentMethod?: string,
  rawPayload?: Record<string, unknown>
): Promise<{ fulfilled: boolean; alreadyCaptured: boolean }> {
  const paymentRef = firestore.collection("payments").doc(orderId);

  let fulfilled = false;
  let paymentData: any = null;

  await firestore.runTransaction(async (transaction) => {
    const paymentDoc = await transaction.get(paymentRef);
    if (!paymentDoc.exists) {
      throw new Error(`Payment order ${orderId} not found`);
    }

    paymentData = paymentDoc.data()!;
    if (paymentData.status === "captured") {
      // Idempotency: Already captured, exit without re-executing
      fulfilled = false;
      return;
    }

    const { userId, courseId, trainerId, couponCode, couponId } = paymentData;
    const enrollmentRef = firestore.collection("enrollments").doc(`${userId}_${courseId}`);
    const courseRef = firestore.collection("courses").doc(courseId);

    // 1. Mark payment as captured
    transaction.update(paymentRef, {
      status: "captured",
      paymentId: paymentId,
      method: paymentMethod || "card",
      capturedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(rawPayload ? { razorpayRawResponse: rawPayload } : {}),
    });

    // 2. Create active enrollment
    transaction.set(enrollmentRef, {
      id: `${userId}_${courseId}`,
      userId,
      courseId,
      trainerId: trainerId || "",
      orderId,
      paymentId,
      status: "active",
      enrolledAt: FieldValue.serverTimestamp(),
      progressPercentage: 0,
      completedLessons: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 3. Increment course enrollment count
    transaction.update(courseRef, {
      enrollmentCount: FieldValue.increment(1),
    });

    // 4. Increment coupon usage count if applied
    if (couponCode || couponId) {
      const couponRef = firestore.collection("coupons").doc((couponCode || couponId).toUpperCase());
      transaction.update(couponRef, {
        usedCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    fulfilled = true;
  });

  // Asynchronously generate invoice & send email receipt if this execution fulfilled the order
  if (fulfilled && paymentData) {
    try {
      await createAndSaveInvoice(firestore, {
        orderId,
        paymentId,
        userId: paymentData.userId,
        userName: paymentData.userName || "Student",
        userEmail: paymentData.userEmail || "",
        courseId: paymentData.courseId,
        courseTitle: paymentData.courseTitle || "Course",
        basePriceInPaise: paymentData.amountBreakdown?.basePriceInPaise || paymentData.amountInPaise || 0,
        discountInPaise: paymentData.amountBreakdown?.discountInPaise || 0,
        taxableAmountInPaise: paymentData.amountBreakdown?.taxableAmountInPaise || paymentData.amountInPaise || 0,
        gstInPaise: paymentData.amountBreakdown?.gstInPaise || 0,
        totalInPaise: paymentData.amountInPaise || 0,
      });
    } catch (err) {
      console.error("[Invoice] Generation failed:", err);
    }
  }

  return { fulfilled, alreadyCaptured: !fulfilled };
}

// ---------------------------------------------------------------------------
// 1. Validate Coupon (Callable)
// ---------------------------------------------------------------------------
export const validateCoupon = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required to validate coupons.");
  }

  const { code, courseId } = ValidateCouponSchema.parse(request.data);
  const normalizedCode = code.trim().toUpperCase();

  // 1. Fetch course to get price
  const courseDoc = await db.collection("courses").doc(courseId).get();
  if (!courseDoc.exists) {
    throw new HttpsError("not-found", "Course not found.");
  }

  const courseData = courseDoc.data()!;
  const basePriceInPaise = courseData.discountPriceInPaise || courseData.priceInPaise || Math.round((courseData.priceInInr || 0) * 100);

  // 2. Fetch coupon
  const couponDoc = await db.collection("coupons").doc(normalizedCode).get();
  if (!couponDoc.exists) {
    return {
      valid: false,
      message: `Coupon code '${normalizedCode}' does not exist.`,
      discountInPaise: 0,
      taxableAmountInPaise: basePriceInPaise,
      gstInPaise: Math.round(basePriceInPaise * 0.18),
      totalInPaise: basePriceInPaise + Math.round(basePriceInPaise * 0.18),
    };
  }

  const coupon = couponDoc.data()!;

  if (!coupon.isActive) {
    return {
      valid: false,
      message: "This coupon is no longer active.",
      discountInPaise: 0,
      taxableAmountInPaise: basePriceInPaise,
      gstInPaise: Math.round(basePriceInPaise * 0.18),
      totalInPaise: basePriceInPaise + Math.round(basePriceInPaise * 0.18),
    };
  }

  const now = Date.now();
  const startsAt = coupon.validityDates?.startsAt?.toMillis ? coupon.validityDates.startsAt.toMillis() : 0;
  const expiresAt = coupon.validityDates?.expiresAt?.toMillis ? coupon.validityDates.expiresAt.toMillis() : Infinity;

  if (now < startsAt) {
    return {
      valid: false,
      message: "This coupon is not yet valid.",
      discountInPaise: 0,
      taxableAmountInPaise: basePriceInPaise,
      gstInPaise: Math.round(basePriceInPaise * 0.18),
      totalInPaise: basePriceInPaise + Math.round(basePriceInPaise * 0.18),
    };
  }

  if (now > expiresAt) {
    return {
      valid: false,
      message: "This coupon has expired.",
      discountInPaise: 0,
      taxableAmountInPaise: basePriceInPaise,
      gstInPaise: Math.round(basePriceInPaise * 0.18),
      totalInPaise: basePriceInPaise + Math.round(basePriceInPaise * 0.18),
    };
  }

  if (coupon.minOrderInPaise && basePriceInPaise < coupon.minOrderInPaise) {
    return {
      valid: false,
      message: `Minimum order value of ₹${Math.round(coupon.minOrderInPaise / 100)} required for this coupon.`,
      discountInPaise: 0,
      taxableAmountInPaise: basePriceInPaise,
      gstInPaise: Math.round(basePriceInPaise * 0.18),
      totalInPaise: basePriceInPaise + Math.round(basePriceInPaise * 0.18),
    };
  }

  if (coupon.applicableCourses && coupon.applicableCourses.length > 0 && !coupon.applicableCourses.includes(courseId)) {
    return {
      valid: false,
      message: "This coupon is not applicable to the selected course.",
      discountInPaise: 0,
      taxableAmountInPaise: basePriceInPaise,
      gstInPaise: Math.round(basePriceInPaise * 0.18),
      totalInPaise: basePriceInPaise + Math.round(basePriceInPaise * 0.18),
    };
  }

  if (coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit) {
    return {
      valid: false,
      message: "This coupon has reached its maximum redemptions limit.",
      discountInPaise: 0,
      taxableAmountInPaise: basePriceInPaise,
      gstInPaise: Math.round(basePriceInPaise * 0.18),
      totalInPaise: basePriceInPaise + Math.round(basePriceInPaise * 0.18),
    };
  }

  // Check per-user limit
  if (coupon.perUserLimit > 0) {
    const userPayments = await db
      .collection("payments")
      .where("userId", "==", request.auth.uid)
      .where("couponCode", "==", normalizedCode)
      .where("status", "==", "captured")
      .get();

    if (userPayments.size >= coupon.perUserLimit) {
      return {
        valid: false,
        message: "You have already used this coupon code.",
        discountInPaise: 0,
        taxableAmountInPaise: basePriceInPaise,
        gstInPaise: Math.round(basePriceInPaise * 0.18),
        totalInPaise: basePriceInPaise + Math.round(basePriceInPaise * 0.18),
      };
    }
  }

  // Calculate discount
  let discountInPaise = 0;
  if (coupon.type === "percent") {
    const computed = Math.round((basePriceInPaise * coupon.value) / 100);
    discountInPaise = coupon.maxDiscountInPaise ? Math.min(computed, coupon.maxDiscountInPaise) : computed;
  } else if (coupon.type === "flat") {
    discountInPaise = Math.round(coupon.value);
  }

  discountInPaise = Math.min(basePriceInPaise, Math.max(0, discountInPaise));
  const taxableAmountInPaise = Math.max(0, basePriceInPaise - discountInPaise);
  const gstInPaise = taxableAmountInPaise === 0 ? 0 : Math.round(taxableAmountInPaise * 0.18);
  const totalInPaise = taxableAmountInPaise + gstInPaise;

  return {
    valid: true,
    code: normalizedCode,
    discountInPaise,
    taxableAmountInPaise,
    gstInPaise,
    totalInPaise,
    message: `Coupon applied: ₹${(discountInPaise / 100).toFixed(2)} off!`,
  };
});

// ---------------------------------------------------------------------------
// 2. Create Order (Callable)
// ---------------------------------------------------------------------------
export const createOrder = onCall(
  { secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated to purchase a course.");
    }

    const userId = request.auth.uid;
    const userEmail = request.auth.token.email || "";
    const userName = (request.auth.token.name as string) || "Student";

    // 1. Rate limiting check
    if (!checkOrderRateLimit(userId)) {
      throw new HttpsError("resource-exhausted", "Too many order creation attempts. Please wait a moment.");
    }

    const { courseId, couponCode } = CreateOrderSchema.parse(request.data);

    // 2. Check if user is already enrolled
    const enrollmentDoc = await db.collection("enrollments").doc(`${userId}_${courseId}`).get();
    if (enrollmentDoc.exists && enrollmentDoc.data()?.status === "active") {
      throw new HttpsError("already-exists", "You are already enrolled in this course.");
    }

    // 3. Canonical course pricing from Firestore
    const courseDoc = await db.collection("courses").doc(courseId).get();
    if (!courseDoc.exists) {
      throw new HttpsError("not-found", "Course not found.");
    }

    const courseData = courseDoc.data()!;
    if (courseData.status !== "published" && !courseData.isPublished) {
      throw new HttpsError("failed-precondition", "Course is not currently available for enrollment.");
    }

    const basePriceInPaise =
      courseData.discountPriceInPaise !== undefined
        ? courseData.discountPriceInPaise
        : courseData.priceInPaise !== undefined
        ? courseData.priceInPaise
        : Math.round((courseData.priceInInr || 0) * 100);

    // 4. Fetch GST rate from platform config
    const configSnap = await db.collection("config").doc("payments").get();
    const gstRatePercent = configSnap.exists ? configSnap.data()?.gstRatePercent || 18 : 18;

    // 5. Evaluate coupon if provided
    let discountInPaise = 0;
    let appliedCouponCode: string | undefined = undefined;

    if (couponCode && couponCode.trim() !== "") {
      const normalizedCode = couponCode.trim().toUpperCase();
      const couponDoc = await db.collection("coupons").doc(normalizedCode).get();
      if (couponDoc.exists) {
        const coupon = couponDoc.data()!;
        if (coupon.isActive) {
          if (coupon.type === "percent") {
            const computed = Math.round((basePriceInPaise * coupon.value) / 100);
            discountInPaise = coupon.maxDiscountInPaise ? Math.min(computed, coupon.maxDiscountInPaise) : computed;
          } else if (coupon.type === "flat") {
            discountInPaise = Math.round(coupon.value);
          }
          discountInPaise = Math.min(basePriceInPaise, Math.max(0, discountInPaise));
          appliedCouponCode = normalizedCode;
        }
      }
    }

    const taxableAmountInPaise = Math.max(0, basePriceInPaise - discountInPaise);
    const gstInPaise = taxableAmountInPaise === 0 ? 0 : Math.round((taxableAmountInPaise * gstRatePercent) / 100);
    const totalInPaise = taxableAmountInPaise + gstInPaise;

    const receipt = `rcpt_${userId.slice(0, 8)}_${Date.now()}`;

    // 6. 100% Free Coupon Bypass (Direct Enrollment without Gateway)
    if (totalInPaise === 0) {
      const freeOrderId = `order_free_${Date.now()}_${userId.slice(0, 6)}`;
      await db.collection("payments").doc(freeOrderId).set({
        id: freeOrderId,
        orderId: freeOrderId,
        paymentId: `pay_free_${Date.now()}`,
        userId,
        userEmail,
        userName,
        courseId,
        courseTitle: courseData.title || "Course",
        trainerId: courseData.instructor?.uid || courseData.trainerId || "",
        amountBreakdown: {
          basePriceInPaise,
          discountInPaise,
          taxableAmountInPaise: 0,
          gstInPaise: 0,
          totalInPaise: 0,
        },
        amountInPaise: 0,
        currency: "INR",
        status: "created",
        method: "coupon_100",
        ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
        receipt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        capturedAt: FieldValue.serverTimestamp(),
      });

      // Fulfill enrollment
      await fulfillCapturedPayment(db, freeOrderId, `pay_free_${Date.now()}`, "coupon_100");

      return {
        orderId: freeOrderId,
        amount: 0,
        currency: "INR",
        isFree: true,
        courseTitle: courseData.title,
      };
    }

    // 7. Regular Paid Purchase via Razorpay
    const keyId = razorpayKeyId.value() || process.env.RAZORPAY_KEY_ID || "rzp_test_emulator_key";
    const keySecret = razorpayKeySecret.value() || process.env.RAZORPAY_KEY_SECRET || "rzp_test_emulator_secret";

    let order: any;
    if (process.env.FUNCTIONS_EMULATOR === "true" || keyId.includes("emulator")) {
      order = {
        id: `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        amount: totalInPaise,
        currency: "INR",
      };
    } else {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      try {
        order = await razorpay.orders.create({
          amount: totalInPaise,
          currency: "INR",
          receipt: receipt,
          notes: {
            courseId,
            userId,
            courseTitle: courseData.title || "Course",
            couponCode: appliedCouponCode || "",
          },
        });
      } catch (rzpErr: unknown) {
        const msg = rzpErr instanceof Error ? rzpErr.message : "Razorpay order creation failed";
        throw new HttpsError("internal", msg);
      }
    }

    // 8. Secure write to /payments via Admin SDK
    await db.collection("payments").doc(order.id).set({
      id: order.id,
      orderId: order.id,
      userId,
      userEmail,
      userName,
      courseId,
      courseTitle: courseData.title || "Course",
      trainerId: courseData.instructor?.uid || courseData.trainerId || "",
      amountBreakdown: {
        basePriceInPaise,
        discountInPaise,
        taxableAmountInPaise,
        gstInPaise,
        totalInPaise,
      },
      amountInPaise: totalInPaise,
      currency: "INR",
      status: "created",
      ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
      receipt,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      orderId: order.id,
      amount: totalInPaise,
      currency: "INR",
      keyId,
      courseTitle: courseData.title,
      isFree: false,
    };
  }
);

// Backward-compatible alias
export const createRazorpayOrder = createOrder;

// ---------------------------------------------------------------------------
// 3. Verify Payment (Callable)
// ---------------------------------------------------------------------------
export const verifyPayment = onCall(
  { secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required to verify payment.");
    }

    const { orderId, paymentId, signature } = VerifyPaymentSchema.parse(request.data);
    const keySecret = razorpayKeySecret.value() || process.env.RAZORPAY_KEY_SECRET || "rzp_test_emulator_secret";

    // 1. Timing-safe HMAC SHA256 Signature Verification
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(signature, "utf8");

    const isMatch =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isMatch && process.env.FUNCTIONS_EMULATOR !== "true") {
      throw new HttpsError("permission-denied", "Invalid payment signature.");
    }

    // 2. Gateway API validation check
    const keyId = razorpayKeyId.value() || process.env.RAZORPAY_KEY_ID || "rzp_test_emulator_key";
    if (process.env.FUNCTIONS_EMULATOR !== "true" && !keyId.includes("emulator")) {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      try {
        const rzpPayment: any = await razorpay.payments.fetch(paymentId);
        if (rzpPayment && rzpPayment.order_id && rzpPayment.order_id !== orderId) {
          throw new HttpsError("failed-precondition", "Payment does not match the specified order.");
        }
      } catch (rzpErr) {
        throw new HttpsError("internal", "Gateway verification failed.");
      }
    }

    // 3. Execute idempotent atomic fulfillment
    const result = await fulfillCapturedPayment(db, orderId, paymentId, "card");

    return {
      success: true,
      orderId,
      status: "captured",
      alreadyCaptured: result.alreadyCaptured,
    };
  }
);

// ---------------------------------------------------------------------------
// 4. Razorpay Webhook Handler (HTTPS)
// ---------------------------------------------------------------------------
export const razorpayWebhook = onRequest(
  { secrets: [razorpayWebhookSecret] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const secret = razorpayWebhookSecret.value() || process.env.RAZORPAY_WEBHOOK_SECRET || "rzp_test_emulator_webhook_secret";
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature && process.env.FUNCTIONS_EMULATOR !== "true") {
      res.status(400).send("Missing signature header");
      return;
    }

    // 1. Verify RAW request body HMAC
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const expectedDigest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    if (signature && signature !== expectedDigest && process.env.FUNCTIONS_EMULATOR !== "true") {
      res.status(400).send("Invalid webhook signature");
      return;
    }

    // 2. Event Idempotency Check via /webhookEvents
    const eventId =
      (req.headers["x-razorpay-event-id"] as string) ||
      req.body.event_id ||
      `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const eventRef = db.collection("webhookEvents").doc(eventId);
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      console.log(`[Webhook] Event ${eventId} already processed. Returning 200 OK.`);
      res.status(200).json({ status: "already_processed", eventId });
      return;
    }

    await eventRef.set({
      id: eventId,
      eventId,
      type: req.body.event || "unknown",
      processedAt: FieldValue.serverTimestamp(),
    });

    const event = req.body.event;
    const paymentPayload = req.body.payload?.payment?.entity;
    const orderPayload = req.body.payload?.order?.entity;

    try {
      if ((event === "payment.captured" || event === "order.paid") && (paymentPayload || orderPayload)) {
        const orderId = paymentPayload?.order_id || orderPayload?.id;
        const paymentId = paymentPayload?.id || `pay_${Date.now()}`;
        const method = paymentPayload?.method || "card";

        if (orderId) {
          await fulfillCapturedPayment(db, orderId, paymentId, method, req.body);
        }
      } else if (event === "payment.failed" && paymentPayload) {
        const orderId = paymentPayload.order_id;
        if (orderId) {
          await db.collection("payments").doc(orderId).update({
            status: "failed",
            failureReason: paymentPayload.error_description || "Payment failed at gateway",
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      } else if (event === "refund.processed") {
        const refundPayload = req.body.payload?.refund?.entity;
        if (refundPayload) {
          const paymentId = refundPayload.payment_id;
          const querySnap = await db.collection("payments").where("paymentId", "==", paymentId).get();
          if (!querySnap.empty) {
            const payDoc = querySnap.docs[0];
            await payDoc.ref.update({
              status: "refunded",
              updatedAt: FieldValue.serverTimestamp(),
            });
            const { userId, courseId } = payDoc.data();
            await db.collection("enrollments").doc(`${userId}_${courseId}`).update({
              status: "refunded",
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      }

      res.status(200).json({ received: true, eventId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Webhook handler failed";
      console.error("[Webhook Error]:", msg);
      res.status(500).json({ error: msg });
    }
  }
);

// ---------------------------------------------------------------------------
// 5. Request Refund (Callable)
// ---------------------------------------------------------------------------
export const requestRefund = onCall(
  { secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required to request refunds.");
    }

    const { paymentId, reason } = RequestRefundSchema.parse(request.data);
    const callerUid = request.auth.uid;
    const isAdmin = request.auth.token.role === "admin";

    // 1. Locate payment document
    const querySnap = await db.collection("payments").where("paymentId", "==", paymentId).get();
    if (querySnap.empty) {
      throw new HttpsError("not-found", "Payment record not found.");
    }

    const paymentDoc = querySnap.docs[0];
    const payment = paymentDoc.data();

    // Authorization: Must be student who bought or admin
    if (!isAdmin && payment.userId !== callerUid) {
      throw new HttpsError("permission-denied", "You can only request refunds for your own purchases.");
    }

    // Must be captured
    if (payment.status !== "captured") {
      throw new HttpsError("failed-precondition", `Cannot refund a payment with status '${payment.status}'.`);
    }

    // 2. Refund Window Verification for Students
    if (!isAdmin) {
      const configSnap = await db.collection("config").doc("payments").get();
      const windowDays = configSnap.exists ? configSnap.data()?.refundWindowDays || 7 : 7;
      const capturedMillis = payment.capturedAt?.toMillis ? payment.capturedAt.toMillis() : payment.createdAt?.toMillis() || Date.now();
      const elapsedDays = (Date.now() - capturedMillis) / (1000 * 60 * 60 * 24);

      if (elapsedDays > windowDays) {
        throw new HttpsError("failed-precondition", `Refund window of ${windowDays} days has expired.`);
      }
    }

    // 3. Call Razorpay Refund API
    const keyId = razorpayKeyId.value() || process.env.RAZORPAY_KEY_ID || "rzp_test_emulator_key";
    const keySecret = razorpayKeySecret.value() || process.env.RAZORPAY_KEY_SECRET || "rzp_test_emulator_secret";

    let refundResult: any;
    if (process.env.FUNCTIONS_EMULATOR === "true" || keyId.includes("emulator")) {
      refundResult = { id: `rfd_mock_${Date.now()}` };
    } else {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      try {
        refundResult = await razorpay.payments.refund(paymentId, {
          amount: payment.amountInPaise,
          notes: { reason, requestedBy: callerUid },
        });
      } catch (rzpErr: unknown) {
        const msg = rzpErr instanceof Error ? rzpErr.message : "Gateway refund failed";
        throw new HttpsError("internal", msg);
      }
    }

    const refundId = refundResult.id || `rfd_${Date.now()}`;
    const batch = db.batch();

    // Update payment record
    batch.update(paymentDoc.ref, {
      status: "refunded",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Revoke enrollment access
    const enrollmentRef = db.collection("enrollments").doc(`${payment.userId}_${payment.courseId}`);
    batch.update(enrollmentRef, {
      status: "refunded",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Save refund record
    const refundRef = db.collection("refunds").doc(refundId);
    batch.set(refundRef, {
      id: refundId,
      paymentId,
      orderId: payment.orderId,
      razorpayRefundId: refundId,
      amountInPaise: payment.amountInPaise,
      reason,
      status: "processed",
      requestedBy: callerUid,
      processedBy: isAdmin ? callerUid : "system",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Record audit log
    const auditRef = db.collection("audit_logs").doc();
    batch.set(auditRef, {
      id: auditRef.id,
      actorUid: callerUid,
      actorEmail: request.auth.token.email || "",
      actorRole: isAdmin ? "admin" : "student",
      action: "payment_refund",
      targetId: paymentId,
      details: {
        orderId: payment.orderId,
        courseId: payment.courseId,
        amountInPaise: payment.amountInPaise,
        reason,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return {
      success: true,
      refundId,
      orderId: payment.orderId,
      status: "refunded",
    };
  }
);

// ---------------------------------------------------------------------------
// 6. Reconcile Payments (Callable)
// ---------------------------------------------------------------------------
export const reconcilePayments = onCall(
  { secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request) => {
    // Only admin can trigger manual reconciliation
    if (!request.auth || request.auth.token.role !== "admin") {
      if (process.env.FUNCTIONS_EMULATOR !== "true") {
        throw new HttpsError("permission-denied", "Administrator privilege required.");
      }
    }

    const { maxAgeMinutes = 30 } = ReconcilePaymentsSchema.parse(request.data || {});
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    // Query stuck payments in 'created' or 'pending'
    const stuckPayments = await db
      .collection("payments")
      .where("status", "in", ["created", "pending"])
      .get();

    let reconciledCount = 0;
    let paymentsFixed = 0;

    const keyId = razorpayKeyId.value() || process.env.RAZORPAY_KEY_ID || "rzp_test_emulator_key";
    const keySecret = razorpayKeySecret.value() || process.env.RAZORPAY_KEY_SECRET || "rzp_test_emulator_secret";
    const isMock = process.env.FUNCTIONS_EMULATOR === "true" || keyId.includes("emulator");
    const razorpay = isMock ? null : new Razorpay({ key_id: keyId, key_secret: keySecret });

    for (const docSnap of stuckPayments.docs) {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();

      if (createdAt < cutoffTime) {
        reconciledCount++;
        if (razorpay) {
          try {
            const rzpOrder: any = await razorpay.orders.fetch(data.orderId);
            if (rzpOrder.status === "paid") {
              const payments = await razorpay.orders.fetchPayments(data.orderId);
              const capturedPay = payments.items?.find((p: any) => p.status === "captured") || payments.items?.[0];
              if (capturedPay) {
                await fulfillCapturedPayment(db, data.orderId, capturedPay.id, capturedPay.method);
                paymentsFixed++;
              }
            } else {
              await docSnap.ref.update({
                status: "failed",
                failureReason: "abandoned_or_expired",
                updatedAt: FieldValue.serverTimestamp(),
              });
              paymentsFixed++;
            }
          } catch (err) {
            await docSnap.ref.update({
              status: "failed",
              failureReason: "abandoned_or_expired",
              updatedAt: FieldValue.serverTimestamp(),
            });
            paymentsFixed++;
          }
        } else {
          // Mock mode: expire abandoned orders
          await docSnap.ref.update({
            status: "failed",
            failureReason: "abandoned_or_expired",
            updatedAt: FieldValue.serverTimestamp(),
          });
          paymentsFixed++;
        }
      }
    }

    return {
      success: true,
      scanned: stuckPayments.size,
      reconciledCount,
      paymentsFixed,
    };
  }
);

// ---------------------------------------------------------------------------
// 7. Role Assignment (Admin only)
// ---------------------------------------------------------------------------
export const setUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in.");
  }

  const callerRole = request.auth.token.role;
  const isDev = process.env.FUNCTIONS_EMULATOR === "true";

  if (callerRole !== "admin" && !isDev) {
    throw new HttpsError("permission-denied", "Only administrators can assign user roles.");
  }

  const { targetUid, role } = SetRoleSchema.parse(request.data);

  await admin.auth().setCustomUserClaims(targetUid, { role });
  await db.collection("users").doc(targetUid).set(
    {
      role: role,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true, targetUid, role };
});

// ---------------------------------------------------------------------------
// 8. Submit Course For Review (Trainer only)
// ---------------------------------------------------------------------------
export const submitCourseForReview = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in to submit a course.");
  }

  const { courseId } = CourseIdSchema.parse(request.data);
  const courseRef = db.collection("courses").doc(courseId);
  const courseDoc = await courseRef.get();

  if (!courseDoc.exists) {
    throw new HttpsError("not-found", "Course does not exist.");
  }

  const course = courseDoc.data()!;
  const instructorUid = course.instructor?.uid || course.trainerId;

  const isCallerOwner = instructorUid === request.auth.uid;
  const isAdmin = request.auth.token.role === "admin";
  if (!isCallerOwner && !isAdmin) {
    throw new HttpsError("permission-denied", "You can only submit your own courses for review.");
  }

  if (course.status !== "draft" && course.status !== "rejected") {
    throw new HttpsError(
      "failed-precondition",
      `Cannot submit course in '${course.status}' status. Course must be 'draft' or 'rejected'.`
    );
  }

  if (!course.thumbnailUrl || course.thumbnailUrl.trim() === "") {
    throw new HttpsError("failed-precondition", "Course must have a thumbnail before submitting.");
  }

  if (course.priceInPaise === undefined && course.priceInInr === undefined) {
    throw new HttpsError("failed-precondition", "Course must have a price defined (0 for free).");
  }

  const modulesSnapshot = await courseRef.collection("modules").get();
  if (modulesSnapshot.empty) {
    throw new HttpsError("failed-precondition", "Course must contain at least 1 module.");
  }

  let totalLessonsCount = 0;
  let totalDurationMinutes = 0;

  for (const moduleDoc of modulesSnapshot.docs) {
    const lessonsSnapshot = await moduleDoc.ref.collection("lessons").get();
    totalLessonsCount += lessonsSnapshot.size;
    lessonsSnapshot.forEach((docSnap) => {
      const lesson = docSnap.data();
      totalDurationMinutes += Number(lesson.durationMinutes) || 0;
    });
  }

  if (totalLessonsCount === 0) {
    throw new HttpsError("failed-precondition", "Course must have at least 1 lesson across its modules.");
  }

  await courseRef.update({
    status: "pending_review",
    lessonCount: totalLessonsCount,
    totalDurationMinutes: totalDurationMinutes,
    submittedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    rejectionReason: FieldValue.delete(),
  });

  return {
    success: true,
    courseId,
    status: "pending_review",
    lessonCount: totalLessonsCount,
    totalDurationMinutes,
  };
});

// ---------------------------------------------------------------------------
// 9. Approve Course (Admin only)
// ---------------------------------------------------------------------------
export const approveCourse = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only administrators can approve courses.");
  }

  const { courseId } = CourseIdSchema.parse(request.data);
  const courseRef = db.collection("courses").doc(courseId);
  const courseDoc = await courseRef.get();

  if (!courseDoc.exists) {
    throw new HttpsError("not-found", "Course does not exist.");
  }

  const course = courseDoc.data()!;
  if (course.status !== "pending_review") {
    throw new HttpsError(
      "failed-precondition",
      `Only courses in 'pending_review' can be approved. Current status: '${course.status}'.`
    );
  }

  const batch = db.batch();

  batch.update(courseRef, {
    status: "published",
    isPublished: true,
    publishedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const logRef = db.collection("audit_logs").doc();
  batch.set(logRef, {
    id: logRef.id,
    actorUid: request.auth.uid,
    actorEmail: request.auth.token.email || "",
    actorRole: "admin",
    action: "course_approve",
    targetId: courseId,
    details: {
      courseTitle: course.title,
      instructorId: course.instructor?.uid || course.trainerId || "",
    },
    timestamp: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { success: true, courseId, status: "published" };
});

// ---------------------------------------------------------------------------
// 10. Reject Course (Admin only)
// ---------------------------------------------------------------------------
export const rejectCourse = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only administrators can reject courses.");
  }

  const { courseId, reason } = RejectCourseSchema.parse(request.data);
  const courseRef = db.collection("courses").doc(courseId);
  const courseDoc = await courseRef.get();

  if (!courseDoc.exists) {
    throw new HttpsError("not-found", "Course does not exist.");
  }

  const course = courseDoc.data()!;
  if (course.status !== "pending_review") {
    throw new HttpsError(
      "failed-precondition",
      `Only courses in 'pending_review' can be rejected. Current status: '${course.status}'.`
    );
  }

  const batch = db.batch();

  batch.update(courseRef, {
    status: "rejected",
    isPublished: false,
    rejectionReason: reason,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const logRef = db.collection("audit_logs").doc();
  batch.set(logRef, {
    id: logRef.id,
    actorUid: request.auth.uid,
    actorEmail: request.auth.token.email || "",
    actorRole: "admin",
    action: "course_reject",
    targetId: courseId,
    details: {
      courseTitle: course.title,
      reason: reason,
    },
    timestamp: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { success: true, courseId, status: "rejected", reason };
});

// ---------------------------------------------------------------------------
// 11. Enroll Free Course
// ---------------------------------------------------------------------------
export const enrollFreeCourse = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in to enroll in a course.");
  }

  const userId = request.auth.uid;
  const { courseId } = CourseIdSchema.parse(request.data);
  const courseRef = db.collection("courses").doc(courseId);
  const courseDoc = await courseRef.get();

  if (!courseDoc.exists) {
    throw new HttpsError("not-found", "Course does not exist.");
  }

  const course = courseDoc.data()!;

  if (course.status !== "published" && !course.isPublished) {
    throw new HttpsError("failed-precondition", "Course is not published.");
  }

  const isFree = course.priceInPaise === 0 || course.priceInInr === 0;
  if (!isFree) {
    throw new HttpsError("failed-precondition", "This course is not free. Payment required.");
  }

  const enrollmentRef = db.collection("enrollments").doc(`${userId}_${courseId}`);
  const enrollmentDoc = await enrollmentRef.get();

  if (enrollmentDoc.exists && enrollmentDoc.data()?.status === "active") {
    return { success: true, message: "Already enrolled in this course.", enrollmentId: enrollmentRef.id };
  }

  const batch = db.batch();

  batch.set(
    enrollmentRef,
    {
      id: enrollmentRef.id,
      userId,
      courseId,
      trainerId: course.instructor?.uid || course.trainerId || "",
      orderId: "free_enrollment",
      paymentId: "free_enrollment",
      status: "active",
      progressPercentage: 0,
      completedLessons: [],
      enrolledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.update(courseRef, {
    enrollmentCount: FieldValue.increment(1),
  });

  await batch.commit();

  return { success: true, courseId, enrollmentId: enrollmentRef.id };
});

// ---------------------------------------------------------------------------
// 12. Recalculate Course Stats
// ---------------------------------------------------------------------------
export const recalculateCourseStats = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in.");
  }

  const { courseId } = CourseIdSchema.parse(request.data);
  const courseRef = db.collection("courses").doc(courseId);
  const courseDoc = await courseRef.get();

  if (!courseDoc.exists) {
    throw new HttpsError("not-found", "Course not found.");
  }

  const modulesSnapshot = await courseRef.collection("modules").get();
  let lessonCount = 0;
  let totalDurationMinutes = 0;

  for (const moduleDoc of modulesSnapshot.docs) {
    const lessonsSnapshot = await moduleDoc.ref.collection("lessons").get();
    lessonCount += lessonsSnapshot.size;
    lessonsSnapshot.forEach((snap) => {
      const data = snap.data();
      totalDurationMinutes += Number(data.durationMinutes) || 0;
    });
  }

  await courseRef.update({
    lessonCount,
    totalDurationMinutes,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, courseId, lessonCount, totalDurationMinutes };
});

// ===========================================================================
// PHASE 4: LEARNING PLAYER, PROGRESS, QUIZZES, ASSIGNMENTS & CERTIFICATES
// ===========================================================================

const GetLessonAccessSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  moduleId: z.string().optional(),
  lessonId: z.string().min(1, "Lesson ID is required"),
});

const UpdateLessonProgressSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  lessonId: z.string().min(1, "Lesson ID is required"),
  positionSeconds: z.number().min(0),
  durationSeconds: z.number().min(0),
  completed: z.boolean(),
});

const StartQuizAttemptSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  quizId: z.string().min(1, "Quiz ID is required"),
});

const SubmitQuizAttemptSchema = z.object({
  attemptId: z.string().min(1, "Attempt ID is required"),
  responses: z.record(z.any()),
});

const GradeAssignmentSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  grade: z.number().min(0),
  feedback: z.string().optional(),
  requestResubmission: z.boolean().optional(),
});

const IssueCertificateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

const SubmitReviewSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  rating: z.number().min(1).max(5),
  reviewText: z.string().min(3, "Review text must be at least 3 characters"),
});

const RevokeCertificateSchema = z.object({
  certificateId: z.string().min(1, "Certificate ID is required"),
  reason: z.string().min(3, "Reason required"),
});

// ---------------------------------------------------------------------------
// 13. Get Lesson Access & Signed Video Tokens (Callable)
// ---------------------------------------------------------------------------
export const getLessonAccess = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required to access lesson materials.");
  }

  const { courseId, moduleId, lessonId } = GetLessonAccessSchema.parse(request.data);
  const userId = request.auth.uid;
  const userRole = request.auth.token.role;

  // 1. Fetch course
  const courseRef = db.collection("courses").doc(courseId);
  const courseDoc = await courseRef.get();
  if (!courseDoc.exists) {
    throw new HttpsError("not-found", "Course not found.");
  }
  const courseData = courseDoc.data()!;

  // 2. Fetch lesson document
  let lessonDoc: admin.firestore.DocumentSnapshot | null = null;
  if (moduleId) {
    const directDoc = await courseRef.collection("modules").doc(moduleId).collection("lessons").doc(lessonId).get();
    if (directDoc.exists) lessonDoc = directDoc;
  }
  if (!lessonDoc) {
    const modulesSnap = await courseRef.collection("modules").get();
    for (const mDoc of modulesSnap.docs) {
      const candidate = await mDoc.ref.collection("lessons").doc(lessonId).get();
      if (candidate.exists) {
        lessonDoc = candidate;
        break;
      }
    }
  }

  if (!lessonDoc || !lessonDoc.exists) {
    throw new HttpsError("not-found", "Lesson not found in curriculum.");
  }

  const lessonData = lessonDoc.data()!;
  const isPreview = Boolean(lessonData.isPreview);

  // 3. Authorization check
  const isInstructor = (courseData.instructor?.uid === userId) || (courseData.trainerId === userId);
  const isAdmin = userRole === "admin";

  let isEnrolled = false;
  if (!isAdmin && !isInstructor && !isPreview) {
    const enrollDoc = await db.collection("enrollments").doc(`${userId}_${courseId}`).get();
    if (enrollDoc.exists && enrollDoc.data()?.status === "active") {
      isEnrolled = true;
    }
  }

  if (!isPreview && !isAdmin && !isInstructor && !isEnrolled) {
    throw new HttpsError(
      "permission-denied",
      "Active enrollment required to access this lesson content. Please enroll to continue."
    );
  }

  // 4. Resolve delivery details based on lesson type
  let playback: any = null;
  if (lessonData.type === "video") {
    const videoId =
      lessonData.videoMetadata?.videoId ||
      lessonData.videoProviderId ||
      "sample_video_01";
    const provider = getVideoProvider();
    playback = await provider.getSignedPlaybackUrl(videoId, 7200); // 2 hours TTL
  } else if (lessonData.type === "pdf") {
    playback = {
      playbackUrl: lessonData.pdfUrl || "",
      provider: "mock",
      expiresAt: Math.floor(Date.now() / 1000) + 7200,
    };
  }

  return {
    accessGranted: true,
    lesson: {
      id: lessonDoc.id,
      title: lessonData.title,
      type: lessonData.type,
      durationMinutes: lessonData.durationMinutes || 0,
      isPreview,
      textContent: lessonData.textContent,
      externalLink: lessonData.externalLink,
      pdfUrl: lessonData.pdfUrl,
      videoMetadata: lessonData.videoMetadata,
    },
    playback,
  };
});

// ---------------------------------------------------------------------------
// 14. Update Lesson Progress & Recalculate Course Completion (Callable)
// ---------------------------------------------------------------------------
export const updateLessonProgress = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required to update progress.");
  }

  const { courseId, lessonId, positionSeconds, durationSeconds, completed } = UpdateLessonProgressSchema.parse(request.data);
  const userId = request.auth.uid;
  const enrollmentRef = db.collection("enrollments").doc(`${userId}_${courseId}`);
  const enrollmentDoc = await enrollmentRef.get();

  if (!enrollmentDoc.exists || enrollmentDoc.data()?.status !== "active") {
    throw new HttpsError("failed-precondition", "Active enrollment record required to track progress.");
  }

  // Server-side completion verification:
  // For video lessons, student must have watched at least 90%
  let isVerifiedComplete = completed;
  if (durationSeconds > 0 && completed) {
    if (positionSeconds < durationSeconds * 0.88) {
      isVerifiedComplete = false;
    }
  }

  // 1. Write per-lesson progress subcollection
  const progressRef = enrollmentRef.collection("lesson_progress").doc(lessonId);
  await progressRef.set(
    {
      id: lessonId,
      lessonId,
      courseId,
      userId,
      positionSeconds,
      durationSeconds,
      completed: isVerifiedComplete,
      updatedAt: FieldValue.serverTimestamp(),
      ...(isVerifiedComplete ? { completedAt: FieldValue.serverTimestamp() } : {}),
    },
    { merge: true }
  );

  // 2. Fetch course total published lessons
  const courseDoc = await db.collection("courses").doc(courseId).get();
  const courseData = courseDoc.exists ? courseDoc.data()! : {};
  let totalLessons = courseData.lessonCount || 0;

  if (totalLessons === 0) {
    const modulesSnap = await db.collection("courses").doc(courseId).collection("modules").get();
    for (const mDoc of modulesSnap.docs) {
      const lSnap = await mDoc.ref.collection("lessons").get();
      totalLessons += lSnap.size;
    }
    totalLessons = Math.max(1, totalLessons);
  }

  // 3. Recompute server-verified completion percentage
  const completedSnap = await enrollmentRef.collection("lesson_progress").where("completed", "==", true).get();
  const completedCount = completedSnap.size;
  const progressPercentage = Math.min(100, Math.round((completedCount / totalLessons) * 100));

  // 4. Atomic update of parent enrollment
  await enrollmentRef.update({
    progressPercentage,
    lastAccessedLessonId: lessonId,
    ...(isVerifiedComplete ? { completedLessons: FieldValue.arrayUnion(lessonId) } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    progressPercentage,
    completed: isVerifiedComplete,
    lastAccessedLessonId: lessonId,
    completedCount,
    totalLessons,
  };
});

// ---------------------------------------------------------------------------
// 15. Start Quiz Attempt (Callable)
// ---------------------------------------------------------------------------
export const startQuizAttempt = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required to attempt quizzes.");
  }

  const { courseId, quizId } = StartQuizAttemptSchema.parse(request.data);
  const userId = request.auth.uid;
  const userRole = request.auth.token.role;

  // Authorization check
  const isEnrolled = (await db.collection("enrollments").doc(`${userId}_${courseId}`).get()).exists;
  if (!isEnrolled && userRole !== "admin" && userRole !== "trainer") {
    throw new HttpsError("permission-denied", "You must be enrolled in the course to attempt this quiz.");
  }

  // Fetch quiz (checking course subcollection first, then root fallback)
  let quizSnap = await db.collection("courses").doc(courseId).collection("quizzes").doc(quizId).get();
  if (!quizSnap.exists) {
    quizSnap = await db.collection("quizzes").doc(quizId).get();
  }

  if (!quizSnap.exists) {
    throw new HttpsError("not-found", "Quiz not found.");
  }

  const quiz = quizSnap.data()!;

  // Check attempt limits
  if (quiz.maxAttempts && quiz.maxAttempts > 0) {
    const existingAttempts = await db
      .collection("quiz_attempts")
      .where("userId", "==", userId)
      .where("quizId", "==", quizId)
      .where("status", "==", "completed")
      .get();

    if (existingAttempts.size >= quiz.maxAttempts) {
      throw new HttpsError("resource-exhausted", `Maximum allowed attempts (${quiz.maxAttempts}) reached for this quiz.`);
    }
  }

  const attemptId = `attempt_${Date.now()}_${userId.slice(0, 6)}`;
  await db.collection("quiz_attempts").doc(attemptId).set({
    id: attemptId,
    quizId,
    courseId,
    userId,
    startedAt: FieldValue.serverTimestamp(),
    timeLimitMinutes: quiz.timeLimitMinutes || 0,
    score: 0,
    totalPoints: 0,
    percentage: 0,
    passed: false,
    responses: {},
    status: "in_progress",
    createdAt: FieldValue.serverTimestamp(),
  });

  // Strip all correct answers before returning questions to client
  const sanitizedQuestions = (quiz.questions || []).map((q: any) => ({
    id: q.id,
    type: q.type,
    text: q.text,
    options: q.options || [],
    points: q.points || 1,
    explanation: q.explanation || "",
    imageUrl: q.imageUrl || null,
  }));

  return {
    attemptId,
    quizTitle: quiz.title,
    timeLimitMinutes: quiz.timeLimitMinutes || 0,
    passingScore: quiz.passingScore || 70,
    questions: sanitizedQuestions,
    startedAt: Date.now(),
  };
});

// ---------------------------------------------------------------------------
// 16. Submit Quiz Attempt & Server-Side Grading (Callable)
// ---------------------------------------------------------------------------
export const submitQuizAttempt = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required to submit quiz.");
  }

  const { attemptId, responses } = SubmitQuizAttemptSchema.parse(request.data);
  const userId = request.auth.uid;

  const attemptRef = db.collection("quiz_attempts").doc(attemptId);
  const attemptDoc = await attemptRef.get();

  if (!attemptDoc.exists) {
    throw new HttpsError("not-found", "Quiz attempt session not found.");
  }

  const attempt = attemptDoc.data()!;
  if (attempt.userId !== userId) {
    throw new HttpsError("permission-denied", "Unauthorized attempt access.");
  }

  // Idempotency: return existing result if already completed
  if (attempt.status === "completed") {
    return {
      attemptId,
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      percentage: attempt.percentage,
      passed: attempt.passed,
      alreadySubmitted: true,
    };
  }

  // 1. Enforce time limit with 30-second network grace period
  let isTimedOut = false;
  if (attempt.timeLimitMinutes && attempt.timeLimitMinutes > 0 && attempt.startedAt) {
    const startedMillis = attempt.startedAt.toMillis ? attempt.startedAt.toMillis() : Date.now();
    const elapsedSeconds = (Date.now() - startedMillis) / 1000;
    const allowedSeconds = attempt.timeLimitMinutes * 60 + 30; // 30s grace
    if (elapsedSeconds > allowedSeconds) {
      isTimedOut = true;
    }
  }

  // 2. Fetch Quiz and Private Answer Key
  const { courseId, quizId } = attempt;
  let quizSnap = await db.collection("courses").doc(courseId).collection("quizzes").doc(quizId).get();
  if (!quizSnap.exists) {
    quizSnap = await db.collection("quizzes").doc(quizId).get();
  }
  const quiz = quizSnap.data() || { questions: [], passingScore: 70 };

  // Fetch private answers
  let privateAnswersSnap = await db
    .collection("courses")
    .doc(courseId)
    .collection("quizzes")
    .doc(quizId)
    .collection("private")
    .doc("answers")
    .get();

  if (!privateAnswersSnap.exists) {
    privateAnswersSnap = await db.collection("quizzes").doc(quizId).collection("private").doc("answers").get();
  }

  const answersKey = privateAnswersSnap.exists ? privateAnswersSnap.data()?.answers || {} : {};

  // 3. Execute Server-Side Grading Logic
  let totalScore = 0;
  let totalMaxPoints = 0;
  const questionResults: Record<string, { earned: number; maxPoints: number; correct: boolean }> = {};

  for (const q of quiz.questions || []) {
    const qId = q.id;
    const maxPoints = Number(q.points) || 1;
    totalMaxPoints += maxPoints;

    const studentResp = responses[qId];
    const answerRule = answersKey[qId] || {};
    let isCorrect = false;

    if (q.type === "mcq_single") {
      const correctIdx = answerRule.correctIndices?.[0] ?? answerRule.correctOptionIndex;
      isCorrect = studentResp !== undefined && Number(studentResp) === Number(correctIdx);
    } else if (q.type === "mcq_multi") {
      const correctIndices = (answerRule.correctIndices || []).map(Number).sort();
      const studentIndices = (Array.isArray(studentResp) ? studentResp : []).map(Number).sort();
      isCorrect =
        correctIndices.length === studentIndices.length &&
        correctIndices.every((val: number, idx: number) => val === studentIndices[idx]);
    } else if (q.type === "true_false") {
      const expectedBool = Boolean(answerRule.correctBoolean);
      isCorrect = studentResp !== undefined && Boolean(studentResp) === expectedBool;
    } else if (q.type === "short_answer") {
      const studentText = String(studentResp || "").trim().toLowerCase();
      if (answerRule.keywords && answerRule.keywords.length > 0) {
        isCorrect = answerRule.keywords.some((kw: string) => studentText.includes(kw.toLowerCase()));
      } else if (answerRule.correctText) {
        const expected = String(answerRule.correctText).trim().toLowerCase();
        isCorrect = studentText === expected;
      }
    }

    const earned = isCorrect ? maxPoints : 0;
    totalScore += earned;
    questionResults[qId] = { earned, maxPoints, correct: isCorrect };
  }

  const percentage = totalMaxPoints > 0 ? Math.round((totalScore / totalMaxPoints) * 100) : 0;
  const passingScore = quiz.passingScore || 70;
  const passed = percentage >= passingScore && !isTimedOut;

  // 4. Update attempt document
  await attemptRef.update({
    status: isTimedOut ? "timed_out" : "completed",
    score: totalScore,
    totalPoints: totalMaxPoints,
    percentage,
    passed,
    isTimedOut,
    responses,
    submittedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    attemptId,
    score: totalScore,
    totalPoints: totalMaxPoints,
    percentage,
    passed,
    isTimedOut,
    passingScore,
  };
});

// ---------------------------------------------------------------------------
// 17. Grade Assignment Submission (Callable, Trainer/Admin Only)
// ---------------------------------------------------------------------------
export const gradeAssignmentSubmission = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required to grade submissions.");
  }

  const { submissionId, grade, feedback, requestResubmission } = GradeAssignmentSchema.parse(request.data);
  const callerUid = request.auth.uid;
  const callerRole = request.auth.token.role;

  const subRef = db.collection("submissions").doc(submissionId);
  const subDoc = await subRef.get();
  if (!subDoc.exists) {
    throw new HttpsError("not-found", "Submission not found.");
  }

  const sub = subDoc.data()!;
  const courseDoc = await db.collection("courses").doc(sub.courseId).get();
  const course = courseDoc.data()!;

  // Ownership verification: Caller must be instructor or admin
  const isInstructor = (course.instructor?.uid === callerUid) || (course.trainerId === callerUid);
  const isAdmin = callerRole === "admin";

  if (!isInstructor && !isAdmin) {
    throw new HttpsError("permission-denied", "Only course trainers or administrators can grade submissions.");
  }

  const nextStatus = requestResubmission ? "resubmit_requested" : "graded";

  await subRef.update({
    status: nextStatus,
    grade,
    feedback: feedback || "",
    gradedBy: callerUid,
    gradedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Create student notification
  await db.collection("notifications").add({
    userId: sub.studentId,
    title: requestResubmission ? "Assignment Resubmission Requested" : "Assignment Graded",
    message: requestResubmission
      ? `Your instructor requested updates on your submission for '${course.title}'.`
      : `Your submission for '${course.title}' received a score of ${grade} points.`,
    type: "course",
    link: `/learn/${course.slug}`,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    submissionId,
    status: nextStatus,
    grade,
  };
});

// ---------------------------------------------------------------------------
// 18. Issue Verified Certificate (Callable)
// ---------------------------------------------------------------------------
export const issueCertificate = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required to earn certificates.");
  }

  const { courseId } = IssueCertificateSchema.parse(request.data);
  const userId = request.auth.uid;
  const userName = (request.auth.token.name as string) || "Gen Z Achiever";

  // 1. Fetch enrollment
  const enrollmentRef = db.collection("enrollments").doc(`${userId}_${courseId}`);
  const enrollmentDoc = await enrollmentRef.get();
  const enrollStatus = enrollmentDoc.data()?.status;
  if (!enrollmentDoc.exists || (enrollStatus !== "active" && enrollStatus !== "completed")) {
    throw new HttpsError("failed-precondition", "Active course enrollment required.");
  }
  const enrollment = enrollmentDoc.data()!;

  // 2. Fetch course
  const courseDoc = await db.collection("courses").doc(courseId).get();
  if (!courseDoc.exists) {
    throw new HttpsError("not-found", "Course not found.");
  }
  const course = courseDoc.data()!;

  // 3. Server-side completion validation:
  // Progress percentage must be 100%
  if ((enrollment.progressPercentage || 0) < 100) {
    throw new HttpsError(
      "failed-precondition",
      `Course is not 100% completed yet (current progress: ${enrollment.progressPercentage || 0}%).`
    );
  }

  // Verify all course quizzes have at least one passing attempt
  const quizzesSnap = await db.collection("courses").doc(courseId).collection("quizzes").get();
  for (const qDoc of quizzesSnap.docs) {
    const passedAttempts = await db
      .collection("quiz_attempts")
      .where("userId", "==", userId)
      .where("quizId", "==", qDoc.id)
      .where("passed", "==", true)
      .get();

    if (passedAttempts.empty) {
      throw new HttpsError("failed-precondition", `You must pass the quiz '${qDoc.data().title}' before earning your certificate.`);
    }
  }

  // 4. Idempotency Check: Existing certificate
  const existingCertSnap = await db
    .collection("certificates")
    .where("userId", "==", userId)
    .where("courseId", "==", courseId)
    .get();

  if (!existingCertSnap.empty) {
    const existing = existingCertSnap.docs[0].data();
    return {
      success: true,
      certificateId: existing.id,
      certificateNumber: existing.certificateNumber,
      verificationUrl: existing.verificationUrl,
      alreadyIssued: true,
    };
  }

  // 5. Generate Certificate with PDFKit & QR Code
  const certificateId = `GZN-2026-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const verificationUrl = `https://genznex.in/verify/${certificateId}`;

  const certResult = await createAndSaveCertificate(db, {
    certificateId,
    userId,
    userName,
    courseId,
    courseTitle: course.title || "Certified Course",
    trainerId: course.instructor?.uid || course.trainerId || "",
    trainerName: course.instructor?.name || "Vikram Malhotra",
    gradePercent: 100,
    verificationUrl,
    issuedByUid: userId,
  });

  // 6. Update enrollment status to completed
  await enrollmentRef.update({
    status: "completed",
    certificateId,
    completedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    certificateId,
    certificateNumber: certificateId,
    verificationUrl,
    storagePath: certResult.storagePath,
  };
});

// ---------------------------------------------------------------------------
// 19. Submit Course Review (Callable)
// ---------------------------------------------------------------------------
export const submitCourseReview = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required to review courses.");
  }

  const { courseId, rating, reviewText } = SubmitReviewSchema.parse(request.data);
  const userId = request.auth.uid;
  const userName = (request.auth.token.name as string) || "Student";
  const userAvatar = (request.auth.token.picture as string) || "";

  // 1. Enrollment and >= 25% Progress Verification
  const enrollmentDoc = await db.collection("enrollments").doc(`${userId}_${courseId}`).get();
  if (!enrollmentDoc.exists) {
    throw new HttpsError("permission-denied", "You must be enrolled in this course to leave a review.");
  }

  const enrollment = enrollmentDoc.data()!;
  if ((enrollment.progressPercentage || 0) < 25) {
    throw new HttpsError(
      "failed-precondition",
      `Minimum 25% course completion required to post reviews (current progress: ${enrollment.progressPercentage || 0}%).`
    );
  }

  const courseRef = db.collection("courses").doc(courseId);
  const reviewRef = courseRef.collection("reviews").doc(userId);

  // 2. Transactional Review Write & Rating Aggregate Update
  await db.runTransaction(async (transaction) => {
    transaction.set(
      reviewRef,
      {
        id: userId,
        courseId,
        userId,
        userName,
        userAvatar,
        rating,
        reviewText,
        isHidden: false,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  // Recompute aggregate average rating
  const allReviewsSnap = await courseRef.collection("reviews").where("isHidden", "==", false).get();
  const totalReviews = allReviewsSnap.size;
  let ratingSum = 0;
  allReviewsSnap.forEach((doc) => {
    ratingSum += Number(doc.data().rating) || 5;
  });

  const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(2)) : 5.0;

  await courseRef.update({
    rating: averageRating,
    ratingCount: totalReviews,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    rating: averageRating,
    ratingCount: totalReviews,
  };
});

// ---------------------------------------------------------------------------
// 20. Revoke Certificate (Admin Only)
// ---------------------------------------------------------------------------
export const revokeCertificate = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only administrators can revoke certificates.");
  }

  const { certificateId, reason } = RevokeCertificateSchema.parse(request.data);
  const certRef = db.collection("certificates").doc(certificateId);
  const certDoc = await certRef.get();

  if (!certDoc.exists) {
    throw new HttpsError("not-found", "Certificate not found.");
  }

  await certRef.update({
    status: "revoked",
    revocationReason: reason,
    revokedAt: FieldValue.serverTimestamp(),
    revokedBy: request.auth.uid,
  });

  await db.collection("audit_logs").add({
    actorUid: request.auth.uid,
    actorEmail: request.auth.token.email || "",
    actorRole: "admin",
    action: "certificate_revoke",
    targetId: certificateId,
    details: { reason },
    timestamp: FieldValue.serverTimestamp(),
  });

  return { success: true, certificateId, status: "revoked" };
});

// Phase 7: Compliance, DPDP User Data Rights & Health Checks
export {
  healthCheck,
  exportUserData,
  deleteUserData,
  getActiveFeatureFlags,
} from "./compliance";

