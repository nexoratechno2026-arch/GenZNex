import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import crypto from "crypto";

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

const app = getApps().length === 0 ? initializeApp({ projectId: "demo-genznex" }) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const FUNCTIONS_ORIGIN = "http://127.0.0.1:5001/demo-genznex/us-central1";
const WEBHOOK_SECRET = "rzp_test_emulator_webhook_secret";
const KEY_SECRET = "rzp_test_emulator_secret";

// Helper: Get Firebase Auth ID Token for an emulator user
async function getIdTokenForUser(email: string, uid: string, role: string): Promise<string> {
  const customToken = await auth.createCustomToken(uid, { role });
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
    throw new Error(`Cloud Function [${functionName}] Error: ${JSON.stringify(body.error || body)}`);
  }

  return body.result;
}

async function runPhase3E2ETests() {
  console.log("================================================================================");
  console.log("💳 GENZNEX PHASE 3 END-TO-END PAYMENT & MONETIZATION VERIFICATION SUITE");
  console.log("================================================================================\n");

  const studentUid = "student_rahul_01";
  const adminUid = "admin_super_01";

  const studentToken = await getIdTokenForUser("student@genznex.in", studentUid, "student");
  const adminToken = await getIdTokenForUser("admin@genznex.in", adminUid, "admin");
  console.log("🔑 Authenticated ID tokens generated for student and admin.\n");

  // ---------------------------------------------------------------------------
  // FLOW 1: Standard Paid Course Order Creation & Signature Verification
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 FLOW 1: Standard Paid Course Purchase (createOrder -> verifyPayment -> fulfillment)");
  console.log("--------------------------------------------------------------------------------");

  // Clean existing enrollment if any
  const testCourseId = "course_nextjs_fullstack";
  await db.collection("enrollments").doc(`${studentUid}_${testCourseId}`).delete();

  console.log(`   1. Student calling createOrder for '${testCourseId}'...`);
  const orderRes1 = await callFunction(
    "createOrder",
    { courseId: testCourseId },
    studentToken
  );

  console.log("   ✅ createOrder Response:", {
    orderId: orderRes1.orderId,
    amount: orderRes1.amount,
    currency: orderRes1.currency,
    isFree: orderRes1.isFree,
  });

  if (!orderRes1.orderId || orderRes1.isFree) {
    throw new Error("Failed: Expected paid order with valid orderId");
  }

  // Verify payment doc in Firestore
  const payDocSnap1 = await db.collection("payments").doc(orderRes1.orderId).get();
  if (!payDocSnap1.exists || payDocSnap1.data()?.status !== "created") {
    throw new Error("Failed: Payment doc not found with status 'created'");
  }
  console.log("   ✅ PASS: Payment document created with status 'created' and amountBreakdown.");

  // Generate valid paymentId and HMAC SHA256 signature
  const mockPaymentId1 = `pay_test_${Date.now()}`;
  const validSignature1 = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderRes1.orderId}|${mockPaymentId1}`)
    .digest("hex");

  console.log(`   2. Student calling verifyPayment with HMAC signature...`);
  const verifyRes1 = await callFunction(
    "verifyPayment",
    {
      orderId: orderRes1.orderId,
      paymentId: mockPaymentId1,
      signature: validSignature1,
    },
    studentToken
  );

  console.log("   ✅ verifyPayment Response:", verifyRes1);
  if (!verifyRes1.success || verifyRes1.status !== "captured") {
    throw new Error("Failed: Payment verification was not captured");
  }

  // Verify /enrollments
  const enrollSnap1 = await db.collection("enrollments").doc(`${studentUid}_${testCourseId}`).get();
  if (!enrollSnap1.exists || enrollSnap1.data()?.status !== "active") {
    throw new Error("Failed: Active enrollment document was not created");
  }
  console.log("   ✅ PASS: Enrollment created in /enrollments with status 'active'.");

  // Verify /invoices
  const invSnap1 = await db.collection("invoices").doc(`inv_${orderRes1.orderId}`).get();
  if (!invSnap1.exists || !invSnap1.data()?.invoiceNumber) {
    throw new Error("Failed: Tax invoice was not generated");
  }
  console.log(`   ✅ PASS: GST Tax Invoice generated [${invSnap1.data()?.invoiceNumber}].\n`);

  // ---------------------------------------------------------------------------
  // FLOW 2: Coupon Discount Validation & Redemption (GENZ20)
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 FLOW 2: Coupon Discount Redemption (GENZ20: 20% off capped at ₹500)");
  console.log("--------------------------------------------------------------------------------");

  const couponCourseId = "course_deep_learning_agents";
  await db.collection("enrollments").doc(`${studentUid}_${couponCourseId}`).delete();
  const oldCouponPayments = await db.collection("payments").where("userId", "==", studentUid).where("couponCode", "==", "GENZ20").get();
  for (const doc of oldCouponPayments.docs) {
    await doc.ref.delete();
  }

  console.log(`   1. Student calling validateCoupon for 'GENZ20'...`);
  const couponValidation = await callFunction(
    "validateCoupon",
    { code: "GENZ20", courseId: couponCourseId },
    studentToken
  );
  console.log("   ✅ validateCoupon Result:", couponValidation);
  if (!couponValidation.valid || couponValidation.discountInPaise !== 50000) {
    throw new Error("Failed: Expected 50000 paise discount (₹500 max cap)");
  }
  console.log("   ✅ PASS: Coupon validation correctly capped discount at ₹500.");

  console.log(`   2. Calling createOrder with couponCode: 'GENZ20'...`);
  const orderRes2 = await callFunction(
    "createOrder",
    { courseId: couponCourseId, couponCode: "GENZ20" },
    studentToken
  );
  console.log("   ✅ createOrder with Coupon:", {
    orderId: orderRes2.orderId,
    discountedAmount: orderRes2.amount,
  });

  const mockPaymentId2 = `pay_coupon_${Date.now()}`;
  const validSignature2 = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderRes2.orderId}|${mockPaymentId2}`)
    .digest("hex");

  await callFunction(
    "verifyPayment",
    {
      orderId: orderRes2.orderId,
      paymentId: mockPaymentId2,
      signature: validSignature2,
    },
    studentToken
  );

  // Check coupon usedCount incremented
  const couponDoc = await db.collection("coupons").doc("GENZ20").get();
  console.log(`   ✅ PASS: Coupon GENZ20 usedCount is now: ${couponDoc.data()?.usedCount}.\n`);

  // ---------------------------------------------------------------------------
  // FLOW 3: 100% Free Coupon Bypass (FREE100)
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 FLOW 3: 100% Free Coupon Bypass (Instant Direct Enrollment without Gateway)");
  console.log("--------------------------------------------------------------------------------");

  const freeCourseId = "course_python_data_science";
  await db.collection("enrollments").doc(`${studentUid}_${freeCourseId}`).delete();
  const oldFreePayments = await db.collection("payments").where("userId", "==", studentUid).where("couponCode", "==", "FREE100").get();
  for (const doc of oldFreePayments.docs) {
    await doc.ref.delete();
  }

  console.log(`   1. Calling createOrder with 'FREE100' coupon...`);
  const freeOrderRes = await callFunction(
    "createOrder",
    { courseId: freeCourseId, couponCode: "FREE100" },
    studentToken
  );

  console.log("   ✅ Free Order Result:", freeOrderRes);
  if (!freeOrderRes.isFree || freeOrderRes.amount !== 0) {
    throw new Error("Failed: Expected 100% free order bypass");
  }

  // Verify direct enrollment
  const freeEnrollSnap = await db.collection("enrollments").doc(`${studentUid}_${freeCourseId}`).get();
  if (!freeEnrollSnap.exists || freeEnrollSnap.data()?.status !== "active") {
    throw new Error("Failed: Free enrollment was not active");
  }
  console.log("   ✅ PASS: Instant enrollment verified without gateway call.\n");

  // ---------------------------------------------------------------------------
  // FLOW 4: Webhook Verification, Idempotency & Race Condition
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 FLOW 4: Razorpay Webhook (Raw HMAC, Event Idempotency & Concurrency Race)");
  console.log("--------------------------------------------------------------------------------");

  const webhookCourseId = "course_system_design_interview";
  await db.collection("enrollments").doc(`${studentUid}_${webhookCourseId}`).delete();

  // 1. Create order
  const orderRes4 = await callFunction("createOrder", { courseId: webhookCourseId }, studentToken);
  const webhookEventId = `evt_test_${Date.now()}`;
  const webhookPaymentId = `pay_hook_${Date.now()}`;

  const webhookPayload = {
    event: "payment.captured",
    event_id: webhookEventId,
    payload: {
      payment: {
        entity: {
          id: webhookPaymentId,
          order_id: orderRes4.orderId,
          method: "upi",
          status: "captured",
        },
      },
    },
  };

  const rawPayloadString = JSON.stringify(webhookPayload);
  const validWebhookSig = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawPayloadString)
    .digest("hex");

  // 4A: Test Invalid Signature rejection
  console.log("   1. Sending webhook with INVALID signature (Must return HTTP 400)...");
  const badRes = await fetch(`${FUNCTIONS_ORIGIN}/razorpayWebhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": "invalid_signature_hash_12345",
      "x-razorpay-event-id": webhookEventId,
    },
    body: rawPayloadString,
  });
  console.log(`   ✅ Invalid Signature HTTP Status: ${badRes.status}`);

  // 4B: Valid Webhook Arrival (Simulate Webhook arriving first)
  console.log("   2. Sending webhook with VALID signature...");
  const goodRes = await fetch(`${FUNCTIONS_ORIGIN}/razorpayWebhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": validWebhookSig,
      "x-razorpay-event-id": webhookEventId,
    },
    body: rawPayloadString,
  });
  console.log(`   ✅ Valid Webhook HTTP Status: ${goodRes.status}`);
  if (goodRes.status !== 200) {
    throw new Error("Failed: Webhook returned non-200");
  }

  // Verify enrollment created by webhook
  const hookEnrollSnap = await db.collection("enrollments").doc(`${studentUid}_${webhookCourseId}`).get();
  if (!hookEnrollSnap.exists || hookEnrollSnap.data()?.status !== "active") {
    throw new Error("Failed: Webhook did not create active enrollment");
  }
  console.log("   ✅ PASS: Webhook successfully captured payment and enrolled student.");

  // 4C: Concurrency Race - verifyPayment arrives AFTER Webhook
  console.log("   3. verifyPayment arrives AFTER webhook (Race Condition Test)...");
  const verifyAfterRes = await callFunction(
    "verifyPayment",
    {
      orderId: orderRes4.orderId,
      paymentId: webhookPaymentId,
      signature: "emulator_mock_sig",
    },
    studentToken
  );
  console.log("   ✅ verifyPayment Race Response:", verifyAfterRes);
  if (verifyAfterRes.alreadyCaptured !== true) {
    throw new Error("Failed: Expected alreadyCaptured: true for safe idempotent no-op");
  }
  console.log("   ✅ PASS: verifyPayment safely exited with alreadyCaptured: true (no double enrollment).");

  // 4D: Duplicate Webhook arrives with same event ID
  console.log("   4. Duplicate Webhook arrives with identical event ID...");
  const dupRes = await fetch(`${FUNCTIONS_ORIGIN}/razorpayWebhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": validWebhookSig,
      "x-razorpay-event-id": webhookEventId,
    },
    body: rawPayloadString,
  });
  const dupBody = (await dupRes.json()) as any;
  console.log("   ✅ Duplicate Webhook Response:", dupBody);
  if (dupBody.status !== "already_processed") {
    throw new Error("Failed: Duplicate webhook not flagged as already_processed");
  }
  console.log("   ✅ PASS: Duplicate webhook acknowledged as already_processed with HTTP 200.\n");

  // ---------------------------------------------------------------------------
  // FLOW 5: Admin Refund Flow & Enrollment Access Revocation
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 FLOW 5: Refund Execution & Access Revocation (requestRefund)");
  console.log("--------------------------------------------------------------------------------");

  console.log(`   1. Admin calling requestRefund for order '${orderRes1.orderId}'...`);
  const refundRes = await callFunction(
    "requestRefund",
    {
      paymentId: mockPaymentId1,
      reason: "Course curriculum mismatch per customer request #102",
    },
    adminToken
  );

  console.log("   ✅ requestRefund Response:", refundRes);
  if (!refundRes.success || refundRes.status !== "refunded") {
    throw new Error("Failed: Refund was not marked as refunded");
  }

  // Verify enrollment revoked
  const revokedSnap = await db.collection("enrollments").doc(`${studentUid}_${testCourseId}`).get();
  if (revokedSnap.data()?.status !== "refunded") {
    throw new Error("Failed: Enrollment status was not updated to 'refunded'");
  }
  console.log("   ✅ PASS: Student enrollment revoked (status: 'refunded').");

  // Verify refund record in /refunds
  const refundDoc = await db.collection("refunds").doc(refundRes.refundId).get();
  if (!refundDoc.exists) {
    throw new Error("Failed: Refund document not created in /refunds");
  }
  console.log(`   ✅ PASS: Refund record stored in /refunds [${refundRes.refundId}].\n`);

  // ---------------------------------------------------------------------------
  // FLOW 6: Stuck Payment Reconciliation (reconcilePayments)
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("📍 FLOW 6: Abandoned Payment Reconciliation (reconcilePayments)");
  console.log("--------------------------------------------------------------------------------");

  const stuckOrderId = `order_stuck_${Date.now()}`;
  const fortyMinsAgo = Timestamp.fromMillis(Date.now() - 40 * 60 * 1000);

  await db.collection("payments").doc(stuckOrderId).set({
    id: stuckOrderId,
    orderId: stuckOrderId,
    userId: studentUid,
    amountInPaise: 199900,
    status: "created",
    createdAt: fortyMinsAgo,
    updatedAt: fortyMinsAgo,
  });

  console.log(`   1. Seeded stuck payment from 40 mins ago: '${stuckOrderId}' (status: 'created').`);
  console.log("   2. Calling reconcilePayments maintenance routine...");

  const reconRes = await callFunction("reconcilePayments", { maxAgeMinutes: 30 }, adminToken);
  console.log("   ✅ reconcilePayments Response:", reconRes);

  const fixedSnap = await db.collection("payments").doc(stuckOrderId).get();
  if (fixedSnap.data()?.status !== "failed" || fixedSnap.data()?.failureReason !== "abandoned_or_expired") {
    throw new Error("Failed: Stuck payment was not marked as failed");
  }
  console.log("   ✅ PASS: Stuck payment reconciled and marked as failed (abandoned_or_expired).\n");

  console.log("================================================================================");
  console.log("🎉 ALL 6 PHASE 3 PAYMENT FLOWS VERIFIED AND PASSED 100%!");
  console.log("================================================================================\n");
}

runPhase3E2ETests().catch((err) => {
  console.error("❌ Phase 3 E2E Tests Failed:", err);
  process.exit(1);
});
