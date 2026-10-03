/**
 * Migration 001: Phase 7 Schema & Operational Health Audit
 * Ensures /config/features and /config/system exist with default attributes.
 */

import { MigrationModule } from "./runner";
import { FieldValue } from "firebase-admin/firestore";

const migration: MigrationModule = {
  id: "001_phase7_schema_audit",
  description: "Initialize /config/features and /config/system default schema",
  async up(db, isDryRun) {
    let modified = 0;

    const featuresRef = db.collection("config").doc("features");
    const featuresDoc = await featuresRef.get();

    if (!featuresDoc.exists) {
      if (!isDryRun) {
        await featuresRef.set({
          installmentsEnabled: false,
          smsStubEnabled: false,
          whatsappStubEnabled: false,
          publicShowcaseEnabled: true,
          maintenanceMode: false,
          appCheckEnforced: false,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: "migration_001",
        });
      }
      modified++;
    }

    const systemRef = db.collection("config").doc("system");
    const systemDoc = await systemRef.get();

    if (!systemDoc.exists) {
      if (!isDryRun) {
        await systemRef.set({
          version: "1.0.0",
          refundWindowDays: 7,
          reconcileThresholdMinutes: 30,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      modified++;
    }

    return { modifiedCount: modified };
  },
};

export default migration;
