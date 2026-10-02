"use client";

import React, { useState } from "react";
import { 
  Users, 
  ShieldCheck, 
  Layers, 
  Key, 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/context/AuthContext";
import type { UserRole } from "@/types/schema";

export default function AdminDashboardPage() {
  const { userProfile, user } = useAuth();
  const adminName = userProfile?.displayName || user?.displayName || "Admin";

  const [targetUid, setTargetUid] = useState("");
  const [targetRole, setTargetRole] = useState<UserRole>("trainer");
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAssignRole = (e: React.FormEvent) => {
    e.preventDefault();
    setAssigning(true);
    setSuccessMsg(null);

    // Emulate Cloud Function / Script call
    setTimeout(() => {
      setAssigning(false);
      setSuccessMsg(`Successfully assigned custom claim { role: "${targetRole}" } to UID: ${targetUid}`);
      setTargetUid("");
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-card border border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-purple-950/20 to-indigo-950/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 mb-2 border border-rose-500/30">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System Overview, {adminName} 🛡️
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Manage custom claims, audit security rule violations, and approve course submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4" />
            Zero-Trust Enforced
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card glow="purple" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">42</div>
          <div className="text-[11px] text-purple-300 mt-1">Students &amp; Trainers</div>
        </Card>

        <Card glow="cyan" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Verified Trainers</span>
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">5</div>
          <div className="text-[11px] text-cyan-300 mt-1">Active instructors</div>
        </Card>

        <Card glow="emerald" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Published Courses</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">8</div>
          <div className="text-[11px] text-emerald-400 mt-1">All verified</div>
        </Card>

        <Card glow="none" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Security Block Rate</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">100%</div>
          <div className="text-[11px] text-emerald-400 mt-1">Zero illegal client writes</div>
        </Card>
      </div>

      {/* Main Administrative Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Role Assignment Utility */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assign Auth Custom Claims (RBAC)</CardTitle>
              <CardDescription>
                Assign &apos;student&apos;, &apos;trainer&apos;, or &apos;admin&apos; roles to any user UID. Enforced in Firebase Auth tokens and checked by Firestore security rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleAssignRole} className="space-y-4">
                <Input
                  id="admin-target-uid-input"
                  label="Target User UID or Email"
                  placeholder="e.g. trainer_vikram_01 or vikram@genznex.in"
                  value={targetUid}
                  onChange={(e) => setTargetUid(e.target.value)}
                  leftIcon={<Key className="w-4 h-4" />}
                  required
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Select Role Claim
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["student", "trainer", "admin"] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTargetRole(r)}
                        className={`p-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                          targetRole === r
                            ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30"
                            : "bg-[#121422] border-gray-800 text-gray-400 hover:text-white"
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
                >
                  Set Custom Claim Role
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security Architecture Checklist */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rules Enforcement Matrix</CardTitle>
              <CardDescription>All 14 collections secured.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#121422] border border-gray-800 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>/payments &amp; /enrollments</span>
                </div>
                <div className="text-gray-400 text-[11px]">Direct client writes strictly rejected.</div>
              </div>

              <div className="p-3 rounded-xl bg-[#121422] border border-gray-800 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>/certificates</span>
                </div>
                <div className="text-gray-400 text-[11px]">Generated exclusively via Cloud Functions.</div>
              </div>

              <div className="p-3 rounded-xl bg-[#121422] border border-gray-800 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Secret Manager</span>
                </div>
                <div className="text-gray-400 text-[11px]">Razorpay credentials isolated via `defineSecret`.</div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
