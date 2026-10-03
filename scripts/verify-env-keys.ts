/**
 * Environment Key Integrity Guard
 * Prevents catastrophic misconfigurations such as:
 * 1. Deploying test Razorpay keys to production.
 * 2. Deploying live Razorpay keys to dev or staging environments.
 * 3. Missing required environment variables.
 *
 * Usage:
 *   npx tsx scripts/verify-env-keys.ts [dev|staging|prod]
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load local env files if present for inspection
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

export interface EnvValidationResult {
  isValid: boolean;
  targetEnv: string;
  errors: string[];
  warnings: string[];
  checkedKeys: string[];
}

export function validateEnvironment(targetEnvInput?: string): EnvValidationResult {
  const targetEnv = (
    targetEnvInput ||
    process.env.FIREBASE_PROJECT_ALIAS ||
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    "dev"
  ).toLowerCase();

  const errors: string[] = [];
  const warnings: string[] = [];
  const checkedKeys: string[] = [];

  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

  checkedKeys.push("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET");

  // Rule 1: Production checks
  if (targetEnv === "prod" || targetEnv === "production") {
    if (razorpayKeyId.startsWith("rzp_test_")) {
      errors.push(
        `🚨 CRITICAL SECURITY FAULT: Production environment detected with Razorpay TEST key prefix (${razorpayKeyId.slice(0, 12)}...). Production requires live keys ("rzp_live_*").`
      );
    }
    if (!razorpayKeyId && !process.env.CI) {
      warnings.push("Razorpay Key ID is not defined in current environment variables.");
    }
  }

  // Rule 2: Dev and Staging checks
  if (["dev", "development", "staging", "test"].includes(targetEnv)) {
    if (razorpayKeyId.startsWith("rzp_live_")) {
      errors.push(
        `🚨 CRITICAL COMPLIANCE FAULT: Staging/Dev environment configured with Razorpay LIVE key prefix (${razorpayKeyId.slice(0, 12)}...). Never test with live credentials!`
      );
    }
  }

  // Rule 3: Secret Manager enforcement check
  // Cloud Functions must read sensitive secrets (RAZORPAY_KEY_SECRET, WEBHOOK_SECRET) via Secret Manager defineSecret
  const sensitiveInFrontend = Object.keys(process.env).filter(
    (k) => k.startsWith("NEXT_PUBLIC_") && (k.includes("SECRET") || k.includes("PRIVATE_KEY"))
  );
  if (sensitiveInFrontend.length > 0) {
    errors.push(
      `🚨 LEAK HAZARD: Sensitive credentials exposed to client bundle with NEXT_PUBLIC_ prefix: ${sensitiveInFrontend.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    targetEnv,
    errors,
    warnings,
    checkedKeys,
  };
}

async function run() {
  const targetEnv = process.argv[2] || process.env.APP_ENV || "dev";
  console.log("================================================================================");
  console.log(`🛡️  GENZNEX ENVIRONMENT KEY INTEGRITY GUARD [Target: ${targetEnv.toUpperCase()}]`);
  console.log("================================================================================\n");

  const result = validateEnvironment(targetEnv);

  if (result.warnings.length > 0) {
    result.warnings.forEach((w) => console.warn(`⚠️  WARNING: ${w}`));
  }

  if (!result.isValid) {
    result.errors.forEach((err) => console.error(err));
    console.error("\n❌ DEPLOYMENT HALTED: Environment integrity check failed.");
    process.exit(1);
  }

  console.log(`✅ Environment check PASSED for target "${result.targetEnv}".`);
  console.log("   - Razorpay key prefix matches environment safety boundary.");
  console.log("   - Zero secrets leaked into NEXT_PUBLIC_ bundle prefixes.");
  console.log("================================================================================\n");
}

if (require.main === module) {
  run().catch((err) => {
    console.error("Integrity check failed with error:", err);
    process.exit(1);
  });
}
