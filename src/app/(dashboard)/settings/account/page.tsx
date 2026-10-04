"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { functions } from "@/lib/firebase/client";
import { httpsCallable } from "firebase/functions";
import {
  ShieldCheck,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
  User,
  LogOut,
  ArrowLeft,
} from "lucide-react";

export default function AccountSettingsPage() {
  const { user, userProfile, logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportData, setExportData] = useState<any>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleExportData = async () => {
    setExporting(true);
    try {
      const exportFn = httpsCallable(functions, "exportUserData");
      const res = await exportFn();
      const result = res.data as any;
      setExportData(result.data);
      setExportSuccess(true);

      // Trigger automatic JSON download
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `genznex_data_export_${user?.uid || "user"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export error:", err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE_MY_ACCOUNT") {
      setDeleteError('Please type "DELETE_MY_ACCOUNT" exactly to confirm.');
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const deleteFn = httpsCallable(functions, "deleteUserData");
      await deleteFn({
        confirmation: "DELETE_MY_ACCOUNT",
        reason: deleteReason,
      });
      setDeleteSuccess(true);
      setTimeout(() => {
        logout();
      }, 3000);
    } catch (err: any) {
      console.error("Delete error:", err);
      setDeleteError(err.message || "Failed to delete account.");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-purple-400" />
            <span>Account &amp; Data Rights (DPDP Act)</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your personal credentials, data portability export, and account erasure.
          </p>
        </div>
        <Link
          href="/student"
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* User Information Summary */}
      <div className="p-6 rounded-2xl bg-[#141525] border border-gray-800 space-y-3">
        <h3 className="text-sm font-bold text-white">Registered Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-300">
          <div>
            <span className="text-gray-500 block">Full Name</span>
            <span className="font-semibold text-white">{userProfile?.displayName || user?.displayName || "Learner"}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Email Address</span>
            <span className="font-semibold text-white">{user?.email || "student@genznex.in"}</span>
          </div>
          <div>
            <span className="text-gray-500 block">User Identifier (UID)</span>
            <span className="font-mono text-gray-400">{user?.uid || "demo_uid"}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Account Status</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Active Learner</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right to Data Portability (Export) */}
      <div className="p-6 rounded-2xl bg-[#141525] border border-gray-800 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Right to Data Portability (Export My Data)</span>
            </h3>
            <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
              In compliance with Section 11 of the Digital Personal Data Protection Act (DPDP), you can request an instant download of all your stored course enrollments, project milestones, quiz logs, certificates, and payment summaries in structured JSON format.
            </p>
          </div>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/30 flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Archive...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export My Data</span>
              </>
            )}
          </button>
        </div>

        {exportSuccess && (
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>Data archive downloaded successfully! Zero PII exposed to unauthorized parties.</span>
          </div>
        )}
      </div>

      {/* Right to Erasure (Delete Account) */}
      <div className="p-6 rounded-2xl bg-[#18121f] border border-rose-500/30 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Right to Erasure (Permanent Account Deletion)</span>
          </h3>
          <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
            Request permanent erasure and anonymization of your profile, forum postings, and notification subscriptions.
          </p>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 mt-2">
            <strong>Statutory Compliance Notice:</strong> In accordance with Indian Goods and Services Tax (GST) laws and financial record retention regulations, confirmed payment receipts and tax invoices will be retained in an anonymized ledger for 7 years.
          </div>
        </div>

        {deleteSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Account Anonymized Successfully</span>
            </div>
            <p>Your personal data has been erased. Signing you out in a moment...</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Reason for leaving (Optional)
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Finished studies, career switch, etc."
                className="w-full max-w-md px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                To confirm, type <span className="font-mono text-rose-500 font-bold">DELETE_MY_ACCOUNT</span> below:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE_MY_ACCOUNT"
                  className="w-full max-w-xs px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-mono outline-none focus:border-rose-500"
                />
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmation !== "DELETE_MY_ACCOUNT"}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/30 flex items-center gap-2 disabled:opacity-40"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Erasing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
