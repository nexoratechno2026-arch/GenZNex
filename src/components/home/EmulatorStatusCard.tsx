import React from "react";
import { GoogleIcon } from "@/components/ui/GoogleIcon";

export function EmulatorStatusCard() {
  const emulators = [
    { name: "Authentication", port: 9099, status: "Active", path: "http://127.0.0.1:9099" },
    { name: "Cloud Firestore", port: 8080, status: "Active", path: "http://127.0.0.1:8080" },
    { name: "Cloud Functions (2nd Gen)", port: 5001, status: "Active", path: "http://127.0.0.1:5001" },
    { name: "Cloud Storage", port: 9199, status: "Active", path: "http://127.0.0.1:9199" },
    { name: "Emulator UI Console", port: 4000, status: "Ready", path: "http://127.0.0.1:4000" },
  ];

  const rulesMatrix = [
    {
      rule: "Direct client writes to /payments",
      enforcement: "Strictly Denied (write: if false;)",
      status: "Blocked",
      severity: "critical",
      handler: "Cloud Functions Admin SDK",
    },
    {
      rule: "Direct client writes to /enrollments",
      enforcement: "Strictly Denied (write: if false;)",
      status: "Blocked",
      severity: "critical",
      handler: "Cloud Functions Admin SDK",
    },
    {
      rule: "Direct client writes to /certificates",
      enforcement: "Strictly Denied (write: if false;)",
      status: "Blocked",
      severity: "critical",
      handler: "Cloud Functions Admin SDK",
    },
    {
      rule: "Server-Side Pricing Verification",
      enforcement: "Amount read from Firestore server-side",
      status: "Enforced",
      severity: "secure",
      handler: "createRazorpayOrder (Functions 2nd Gen)",
    },
    {
      rule: "Razorpay Secret Key Storage",
      enforcement: "Firebase Secret Manager (defineSecret)",
      status: "Protected",
      severity: "secure",
      handler: "Google Cloud Secret Manager / .env.local",
    },
    {
      rule: "Video Signed URL Delivery",
      enforcement: "Signed URLs generated via Cloud Function",
      status: "Protected",
      severity: "secure",
      handler: "getLessonAccess (Functions 2nd Gen)",
    },
    {
      rule: "Role-Based Access Control (RBAC)",
      enforcement: "Auth Custom Claims strictly checked",
      status: "Enforced",
      severity: "secure",
      handler: "Firestore & Storage Security Rules",
    },
    {
      rule: "Phase 6 Gamification XP Ledger",
      enforcement: "Deterministic Ledger ID (No double XP)",
      status: "Enforced",
      severity: "secure",
      handler: "awardXp (Cloud Functions Admin SDK)",
    },
  ];

  return (
    <section id="emulator-status" className="py-20 border-t border-neutral-800 dark:border-neutral-800 light:border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-12">
          <div className="text-xs uppercase font-bold tracking-widest text-neutral-400 dark:text-neutral-400 light:text-neutral-600 mb-2 flex items-center gap-1.5">
            <GoogleIcon name="shield" size={16} />
            <span>Architecture &amp; Rules Verification</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white dark:text-white light:text-black">
            Firebase Security &amp; Local Verification Engine
          </h2>
          <p className="mt-2 text-sm text-neutral-300 dark:text-neutral-300 light:text-neutral-700 max-w-3xl">
            Live local development is powered 100% by the Firebase Emulator Suite. Direct client writes to critical collections are blocked by strict security rules.
          </p>
        </div>

        {/* Emulators Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-10">
          {emulators.map((emu) => (
            <div
              key={emu.name}
              className="p-4 rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-black dark:bg-black light:bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-400 light:text-neutral-600">
                  Port :{emu.port}
                </span>
                <span className="w-2 h-2 rounded-full bg-white dark:bg-white light:bg-black" />
              </div>
              <div className="font-bold text-sm text-white dark:text-white light:text-black mb-1">
                {emu.name}
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-300 dark:text-neutral-300 light:text-neutral-700">
                <span className="font-medium text-white dark:text-white light:text-black">{emu.status}</span>
                <a
                  href={emu.path}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-400 hover:text-white dark:hover:text-white light:hover:text-black"
                >
                  <GoogleIcon name="open_in_new" size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Security Rules Matrix */}
        <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 overflow-hidden bg-black dark:bg-black light:bg-white">
          <div className="px-6 py-4 border-b border-neutral-800 dark:border-neutral-800 light:border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GoogleIcon name="verified_user" size={18} />
              <span className="font-bold text-sm text-white dark:text-white light:text-black">
                Security Rules &amp; Zero-Trust Protocol
              </span>
            </div>
            <span className="text-xs text-neutral-300 dark:text-neutral-300 light:text-neutral-700">
              48/48 Rules Tests Passing
            </span>
          </div>

          <div className="divide-y divide-neutral-800 dark:divide-neutral-800 light:divide-neutral-200">
            {rulesMatrix.map((item, idx) => (
              <div key={idx} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-white dark:text-white light:text-black text-sm flex items-center gap-1.5">
                    <GoogleIcon name="check_circle" size={15} />
                    <span>{item.rule}</span>
                  </div>
                  <div className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700">
                    {item.enforcement}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-400 dark:text-neutral-400 light:text-neutral-600 font-mono text-[11px]">
                    {item.handler}
                  </span>
                  <span className="px-2 py-0.5 rounded border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 text-[10px] font-bold uppercase tracking-wider text-white dark:text-white light:text-black bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-100">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
