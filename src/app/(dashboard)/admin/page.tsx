"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/context/AuthContext";
import { functions } from "@/lib/firebase/client";
import { httpsCallable } from "firebase/functions";
import type { UserRole } from "@/types/schema";

interface AdminModuleCard {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge: string;
}

const ADMIN_MODULES: AdminModuleCard[] = [
  {
    title: "Course Approvals",
    description: "Review, approve, or reject instructor-submitted curriculum courses.",
    href: "/admin/courses",
    icon: "verified",
    badge: "Curriculum",
  },
  {
    title: "Payments & Refunds",
    description: "Inspect Razorpay transactions, audit trail, and trigger refunds.",
    href: "/admin/payments",
    icon: "receipt_long",
    badge: "Financial",
  },
  {
    title: "Revenue & Ledger",
    description: "Financial breakdown, GST tax calculation, and invoice generation.",
    href: "/admin/revenue",
    icon: "payments",
    badge: "Settlement",
  },
  {
    title: "Discount Coupons",
    description: "Create, activate, and manage percentage & flat promotional codes.",
    href: "/admin/coupons",
    icon: "sell",
    badge: "Marketing",
  },
  {
    title: "Platform Analytics",
    description: "Real-time user enrollments, completion rates, and platform metrics.",
    href: "/admin/analytics",
    icon: "analytics",
    badge: "Telemetry",
  },
  {
    title: "Curriculum Cohorts",
    description: "Manage cohort syllabus, sprint tracks, and schedule timelines.",
    href: "/programs",
    icon: "layers",
    badge: "Cohorts",
  },
  {
    title: "Job Opportunities",
    description: "Manage tech job listings, referral links, and student applications.",
    href: "/jobs",
    icon: "work",
    badge: "Careers",
  },
  {
    title: "System Health API",
    description: "Probe database connectivity, function uptime, and microservice status.",
    href: "/api/health",
    icon: "monitor_heart",
    badge: "Uptime",
  },
];

export default function AdminDashboardPage() {
  const { userProfile, user } = useAuth();
  const adminName = userProfile?.displayName || user?.displayName || "Admin";

  const [targetUid, setTargetUid] = useState("");
  const [targetRole, setTargetRole] = useState<UserRole>("trainer");
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUid.trim()) return;

    setAssigning(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const setUserRoleFn = httpsCallable<{ targetUid: string; role: UserRole }, { success: boolean }>(
        functions,
        "setUserRole"
      );
      await setUserRoleFn({ targetUid: targetUid.trim(), role: targetRole });
      setSuccessMsg(`Successfully assigned role "${targetRole}" to UID: ${targetUid}`);
      setTargetUid("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign role";
      setErrorMsg(`Role assignment error: ${msg}`);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 mb-2">
            <GoogleIcon name="shield" size={13} />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Executive Operations Desk, {adminName}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Manage system-wide permissions, verify trainer course submissions, and monitor financial transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white flex items-center gap-1.5 shadow-sm">
            <GoogleIcon name="lock" size={14} className="text-violet-600 dark:text-violet-400" />
            <span>RBAC Active</span>
          </span>
        </div>
      </div>

      {/* Connected Admin Modules Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
            <GoogleIcon name="apps" size={16} />
            <span>Connected Administrative Routes</span>
          </h2>
          <span className="text-xs text-neutral-500 font-bold">8 Operational Desks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ADMIN_MODULES.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all hover:shadow-sm flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-900 dark:text-white group-hover:scale-105 transition-transform">
                    <GoogleIcon name={mod.icon} size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    {mod.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 line-clamp-2">
                  {mod.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-white">
                <span>Access Module</span>
                <GoogleIcon name="arrow_forward" size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Operations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Role Assignment Tool */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <GoogleIcon name="key" size={18} className="text-violet-600 dark:text-violet-400" />
                <span>Assign Custom Claims (RBAC Engine)</span>
              </CardTitle>
              <CardDescription className="text-xs text-neutral-600 dark:text-neutral-400">
                Directly configure user security claims (&apos;student&apos;, &apos;trainer&apos;, or &apos;admin&apos;). Enforced via Firebase Auth custom claims and Firestore security rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <GoogleIcon name="check_circle" size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <GoogleIcon name="error" size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAssignRole} className="space-y-4">
                <Input
                  id="admin-target-uid-input"
                  label="Target User UID"
                  placeholder="e.g. trainer_vikram_01 or user auth UID"
                  value={targetUid}
                  onChange={(e) => setTargetUid(e.target.value)}
                  leftIcon={<GoogleIcon name="person" size={16} />}
                  required
                />

                <div>
                  <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-2">
                    Select Role Claim
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["student", "trainer", "admin"] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTargetRole(r)}
                        className={`p-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                          targetRole === r
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm"
                            : "bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  id="admin-assign-role-btn"
                  type="submit"
                  variant="primary"
                  loading={assigning}
                  className="rounded-xl px-5 py-2.5"
                >
                  Apply Role Claim
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Security Matrix & Pre-configured Accounts */}
        <div className="space-y-6">
          <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <GoogleIcon name="badge" size={18} className="text-amber-500" />
                <span>Default Test Accounts</span>
              </CardTitle>
              <CardDescription className="text-xs text-neutral-600 dark:text-neutral-400">
                Pre-seeded accounts in local Firebase Emulator:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-1">
                <div className="font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                  <span>Super Admin</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 uppercase font-bold">admin</span>
                </div>
                <div className="text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">admin@genznex.in</div>
                <div className="text-neutral-500 font-mono text-[10px]">Pass: Password@123</div>
              </div>

              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-1">
                <div className="font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                  <span>Instructor</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 uppercase font-bold">trainer</span>
                </div>
                <div className="text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">vikram@genznex.in</div>
                <div className="text-neutral-500 font-mono text-[10px]">Pass: Password@123</div>
              </div>

              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-1">
                <div className="font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                  <span>Student</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 uppercase font-bold">student</span>
                </div>
                <div className="text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">student@genznex.in</div>
                <div className="text-neutral-500 font-mono text-[10px]">Pass: Password@123</div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
