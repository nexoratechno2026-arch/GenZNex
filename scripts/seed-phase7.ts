/**
 * Phase 7 Seeding: Feature Flags & System Health Config
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

const app = getApps().length === 0
  ? initializeApp({ projectId: "demo-genznex" })
  : getApps()[0];

const db = getFirestore(app);

async function seedPhase7Config() {
  console.log("================================================================================");
  console.log("⚙️  SEEDING PHASE 7 DYNAMIC FEATURE FLAGS & SYSTEM HEALTH CONFIG");
  console.log("================================================================================\n");

  const featureFlagsRef = db.collection("config").doc("features");
  await featureFlagsRef.set(
    {
      installmentsEnabled: false, // Risky/staged feature
      smsStubEnabled: false,      // Behind flag until vendor integrated
      whatsappStubEnabled: false, // Behind flag
      publicShowcaseEnabled: true,
      maintenanceMode: false,
      maintenanceNotice: "",
      appCheckEnforced: false,    // Staged rollout: metrics mode first
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "system_phase7_seed",
    },
    { merge: true }
  );
  console.log("✅ Seeded /config/features (Dynamic operational toggles).");

  // Also seed /config/system health parameters
  const systemRef = db.collection("config").doc("system");
  await systemRef.set(
    {
      version: "1.0.0-phase7",
      minClientVersion: "1.0.0",
      reconcileThresholdMinutes: 30,
      refundWindowDays: 7,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log("✅ Seeded /config/system (Uptime, refund window, reconciliation timers).");

  console.log("\n================================================================================");
  console.log("🎉 PHASE 7 CONFIG SEEDING COMPLETE!");
  console.log("================================================================================\n");
}

seedPhase7Config().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
