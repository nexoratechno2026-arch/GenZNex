/**
 * GenZNex Versioned Database Migration Framework
 * Supports:
 * - Sequential execution of migrations
 * - Dry-run mode (--dry-run)
 * - Idempotency ledger in `/migrations/{migrationId}`
 * - Audit logging of execution time and operator
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

const app = getApps().length === 0 ? initializeApp({ projectId: "demo-genznex" }) : getApps()[0];
const db = getFirestore(app);

export interface MigrationModule {
  id: string;
  description: string;
  up: (db: FirebaseFirestore.Firestore, isDryRun: boolean) => Promise<{ modifiedCount: number }>;
}

async function runMigrations() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("================================================================================");
  console.log(`📦 GENZNEX FIRESTORE MIGRATION RUNNER ${isDryRun ? "[DRY RUN MODE]" : "[LIVE EXECUTION]"}`);
  console.log("================================================================================\n");

  const migrationsDir = path.resolve(__dirname);
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.match(/^\d+.*\.ts$/) && !f.endsWith("runner.ts"))
    .sort();

  if (files.length === 0) {
    console.log("No pending migration files found.");
    return;
  }

  for (const file of files) {
    const migrationPath = path.join(migrationsDir, file);
    const migration: MigrationModule = require(migrationPath).default;

    if (!migration || !migration.id) {
      console.warn(`⚠️ Skipping invalid migration file: ${file}`);
      continue;
    }

    // Check if already executed
    const ledgerRef = db.collection("migrations").doc(migration.id);
    const ledgerDoc = await ledgerRef.get();

    if (ledgerDoc.exists && !isDryRun) {
      console.log(`⏭️  Skipping [${migration.id}] - Already applied on ${ledgerDoc.data()?.appliedAt?.toDate?.() || "earlier"}`);
      continue;
    }

    console.log(`⏳ Applying migration: [${migration.id}] - ${migration.description}...`);
    const start = Date.now();

    try {
      const result = await migration.up(db, isDryRun);
      const elapsed = Date.now() - start;

      if (!isDryRun) {
        await ledgerRef.set({
          id: migration.id,
          description: migration.description,
          appliedAt: FieldValue.serverTimestamp(),
          elapsedMs: elapsed,
          modifiedDocuments: result.modifiedCount,
          operator: process.env.USER || process.env.USERNAME || "migration_runner",
        });
      }

      console.log(`   ✅ Success: ${result.modifiedCount} docs processed in ${elapsed}ms ${isDryRun ? "(simulated)" : ""}`);
    } catch (err: any) {
      console.error(`   ❌ Failed applying [${migration.id}]:`, err.message);
      process.exit(1);
    }
  }

  console.log("\n================================================================================");
  console.log("🏁 MIGRATION RUNNER FINISHED.");
  console.log("================================================================================\n");
}

if (require.main === module) {
  runMigrations().catch(console.error);
}
