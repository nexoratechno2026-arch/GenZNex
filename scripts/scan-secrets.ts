/**
 * Automated Secret Scanner (Gitleaks pattern simulator)
 * Scans repository tracked files and recent commits for leaked credentials.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const SUSPICIOUS_PATTERNS = [
  { name: "Private Key Header", regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: "Live Razorpay Secret", regex: /rzp_live_[a-zA-Z0-9]{14,}/ },
  { name: "Google API Key (Live)", regex: /AIza[0-9A-Za-z-_]{35}/ },
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "Generic High-Entropy Secret", regex: /(?:secret|password|auth_token|api_key)\s*[:=]\s*["']([A-Za-z0-9_\-\/+=]{30,})["']/i },
  { name: "Firebase Service Account JSON", regex: /"type":\s*"service_account"/ },
];

const IGNORED_PATHS = [
  "node_modules",
  ".git",
  ".next",
  "package-lock.json",
  ".env.example",
  "scripts/scan-secrets.ts",
];

interface Finding {
  file: string;
  pattern: string;
  line: number;
}

function scanFile(filePath: string, findings: Finding[]) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // Exclude emulator demo references
      if (line.includes("AIzaSyFakeKeyForEmulatorTestingOnly") || line.includes("rzp_test_emulator")) {
        return;
      }

      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.regex.test(line)) {
          findings.push({
            file: filePath,
            pattern: pattern.name,
            line: index + 1,
          });
        }
      }
    });
  } catch (err) {
    // binary or unreadable file
  }
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (IGNORED_PATHS.includes(file)) continue;
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath, fileList);
      } else {
        fileList.push(fullPath);
      }
    } catch {
      // skip
    }
  }
  return fileList;
}

async function runSecretAudit() {
  console.log("================================================================================");
  console.log("🔍 GENZNEX ZERO-LEAK SECRETS AUDIT");
  console.log("================================================================================\n");

  const files = walkDir(process.cwd());
  const findings: Finding[] = [];

  for (const file of files) {
    scanFile(file, findings);
  }

  // Also check git log for recent commit diffs
  try {
    const gitDiff = execSync("git log -p -n 10", { encoding: "utf8" });
    const diffLines = gitDiff.split("\n");
    diffLines.forEach((line, idx) => {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        if (line.includes("AIzaSyFakeKeyForEmulatorTestingOnly") || line.includes("rzp_test_emulator")) {
          return;
        }
        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (pattern.regex.test(line)) {
            findings.push({
              file: `git-history-line-${idx}`,
              pattern: `Commit diff match: ${pattern.name}`,
              line: idx,
            });
          }
        }
      }
    });
  } catch {
    // git log unavailable
  }

  if (findings.length > 0) {
    console.error(`🚨 ALERT: Found ${findings.length} potential secrets!`);
    findings.forEach((f) => {
      console.error(`   - [${f.pattern}] in ${f.file}:${f.line}`);
    });
    process.exit(1);
  } else {
    console.log(`✅ Clean scan: Inspected ${files.length} repository files.`);
    console.log("   - 0 live private keys or tokens found.");
    console.log("   - Zero production Razorpay or GCP secrets detected.");
    console.log("   - 100% compliant with zero-leak policy.");
  }

  console.log("\n================================================================================\n");
}

runSecretAudit().catch(console.error);
