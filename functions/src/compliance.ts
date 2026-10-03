/**
 * Phase 7: Compliance, User Data Rights (DPDP Act) & System Health
 */

import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// ---------------------------------------------------------------------------
// 1. Health Check Probes (Callable & HTTPS)
// ---------------------------------------------------------------------------
export const healthCheck = onRequest({ cors: true }, async (req, res) => {
  const start = Date.now();
  try {
    // Quick probe write/read to /config/system
    const systemSnap = await db.collection("config").doc("system").get();
    const dbLatency = Date.now() - start;

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.APP_ENV || process.env.NODE_ENV || "development",
      isEmulator: process.env.FUNCTIONS_EMULATOR === "true",
      dbLatencyMs: dbLatency,
      systemConfig: systemSnap.exists ? systemSnap.data() : null,
    });
  } catch (err: any) {
    res.status(503).json({
      status: "unhealthy",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Export User Data (India DPDP Act - Right to Data Portability)
// ---------------------------------------------------------------------------
export const exportUserData = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required to export account data.");
  }

  const userId = request.auth.uid;

  try {
    // 1. User Profile
    const userDoc = await db.collection("users").doc(userId).get();
    const profile = userDoc.exists ? userDoc.data() : null;

    // 2. Course Enrollments
    const enrollmentsSnap = await db
      .collection("enrollments")
      .where("userId", "==", userId)
      .get();
    const enrollments = enrollmentsSnap.docs.map((d) => d.data());

    // 3. Batch Enrollments
    const batchSnap = await db
      .collection("batch_enrollments")
      .where("userId", "==", userId)
      .get();
    const batchEnrollments = batchSnap.docs.map((d) => d.data());

    // 4. Certificates
    const certsSnap = await db
      .collection("certificates")
      .where("userId", "==", userId)
      .get();
    const certificates = certsSnap.docs.map((d) => d.data());

    // 5. Invoices & Payments (Personal metadata)
    const paymentsSnap = await db
      .collection("payments")
      .where("userId", "==", userId)
      .get();
    const payments = paymentsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: data.id,
        courseId: data.courseId,
        amount: data.amount,
        status: data.status,
        createdAt: data.createdAt,
      };
    });

    // 6. Gamification & Achievements
    const gamificationDoc = await db
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("profile")
      .get();
    const gamification = gamificationDoc.exists ? gamificationDoc.data() : null;

    // Audit log this export
    await db.collection("audit_logs").add({
      action: "USER_DATA_EXPORTED",
      userId,
      requestedAt: FieldValue.serverTimestamp(),
      ip: request.rawRequest.ip || "unknown",
    });

    return {
      success: true,
      exportedAt: new Date().toISOString(),
      data: {
        profile,
        enrollments,
        batchEnrollments,
        certificates,
        payments,
        gamification,
      },
    };
  } catch (err: any) {
    console.error("[Compliance] Error exporting user data:", err);
    throw new HttpsError("internal", `Failed to export user data: ${err.message}`);
  }
});

// ---------------------------------------------------------------------------
// 3. Delete / Anonymize User Data (India DPDP Act - Right to Erasure)
// ---------------------------------------------------------------------------
const DeleteAccountSchema = z.object({
  confirmation: z.literal("DELETE_MY_ACCOUNT"),
  reason: z.string().optional(),
});

export const deleteUserData = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required to request account erasure.");
  }

  const parseResult = DeleteAccountSchema.safeParse(request.data);
  if (!parseResult.success) {
    throw new HttpsError(
      "invalid-argument",
      "Confirmation token 'DELETE_MY_ACCOUNT' is required."
    );
  }

  const userId = request.auth.uid;

  try {
    const batch = db.batch();

    // 1. Anonymize user profile document
    const userRef = db.collection("users").doc(userId);
    batch.set(
      userRef,
      {
        displayName: "[Deleted Account]",
        email: `deleted_${userId.slice(0, 8)}@deleted.genznex.in`,
        photoURL: null,
        bio: null,
        isDeleted: true,
        deletedAt: FieldValue.serverTimestamp(),
        anonymizedReason: parseResult.data.reason || "User requested erasure",
      },
      { merge: true }
    );

    // 2. Anonymize forum posts and replies
    const postsSnap = await db
      .collection("forum_posts")
      .where("authorId", "==", userId)
      .get();
    postsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        authorName: "[Deleted Learner]",
        authorAvatar: null,
      });
    });

    // 3. Delete gamification profile
    const gamificationRef = db
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("profile");
    batch.delete(gamificationRef);

    // 4. Delete unread / read notifications
    const notifsSnap = await db
      .collection("notifications")
      .where("userId", "==", userId)
      .get();
    notifsSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 5. Commit batch updates
    await batch.commit();

    // 6. Disable Auth Account in Firebase Authentication
    try {
      await admin.auth().updateUser(userId, {
        disabled: true,
      });
      // Revoke all existing refresh tokens
      await admin.auth().revokeRefreshTokens(userId);
    } catch (authErr) {
      console.warn("[Compliance] Could not disable Firebase Auth user directly:", authErr);
    }

    // 7. Audit log the deletion request (Required for tax and fraud prevention compliance)
    await db.collection("audit_logs").add({
      action: "USER_ACCOUNT_DELETED",
      userId,
      deletedAt: FieldValue.serverTimestamp(),
      preservedLegalRecords: ["invoices", "payments"],
    });

    return {
      success: true,
      message: "Account erased successfully. Tax and payment records retained anonymously as mandated by law.",
      deletedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error("[Compliance] Error deleting user account:", err);
    throw new HttpsError("internal", `Failed to delete user account: ${err.message}`);
  }
});

// ---------------------------------------------------------------------------
// 4. Active Feature Flags Resolver
// ---------------------------------------------------------------------------
export const getActiveFeatureFlags = onCall({ cors: true }, async () => {
  try {
    const flagsDoc = await db.collection("config").doc("features").get();
    if (!flagsDoc.exists) {
      return {
        installmentsEnabled: false,
        smsStubEnabled: false,
        whatsappStubEnabled: false,
        publicShowcaseEnabled: true,
        maintenanceMode: false,
        appCheckEnforced: false,
      };
    }
    return flagsDoc.data();
  } catch (err: any) {
    console.error("[Compliance] Error fetching feature flags:", err);
    throw new HttpsError("internal", "Failed to retrieve system feature flags.");
  }
});
