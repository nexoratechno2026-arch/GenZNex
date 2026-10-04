"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { GoogleIcon } from "@/components/ui/GoogleIcon";

export default function VerifyPortalPage() {
  const router = useRouter();
  const [certId, setCertId] = useState("");
  const [error, setError] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = certId.trim();
    if (!cleanId) {
      setError("Please enter a valid Certificate ID");
      return;
    }
    setError("");
    router.push(`/verify/${encodeURIComponent(cleanId)}`);
  };

  const handleSampleFill = (sampleId: string) => {
    setCertId(sampleId);
    setError("");
    router.push(`/verify/${encodeURIComponent(sampleId)}`);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 flex flex-col justify-center py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full mx-auto space-y-10 text-center">
          
          {/* Header */}
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-sm">
              <GoogleIcon name="verified" size={32} filled />
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Verify Certificate
            </h1>
            
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
              Authenticate digital certificates and academic credentials issued by GenZNex. Enter the unique Certificate ID to inspect course completion records and trainer verification.
            </p>
          </div>

          {/* Search Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6 text-left">
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label
                  htmlFor="certificate-id-input"
                  className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2"
                >
                  Enter Certificate ID
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                    <GoogleIcon name="badge" size={20} />
                  </div>
                  <input
                    id="certificate-id-input"
                    type="text"
                    value={certId}
                    onChange={(e) => {
                      setCertId(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="e.g. GZN-2026-A1B2C3D4"
                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-2xl pl-12 pr-4 py-3.5 text-sm sm:text-base font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400 placeholder:font-sans focus:outline-none focus:border-violet-500 shadow-sm uppercase"
                  />
                </div>
                {error && (
                  <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                    <GoogleIcon name="error" size={14} />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <GoogleIcon name="verified" size={18} />
                <span>Verify Credential</span>
              </button>
            </form>

            {/* Quick Demo Sample */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">Want to test verification?</span>
              <button
                type="button"
                onClick={() => handleSampleFill("GZN-2026-A1B2C3D4")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 hover:bg-violet-500/20 font-mono font-semibold transition cursor-pointer"
              >
                <span>Sample: GZN-2026-A1B2C3D4</span>
                <GoogleIcon name="arrow_forward" size={14} />
              </button>
            </div>
          </div>

          {/* Verification Guarantees Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <GoogleIcon name="lock" size={18} />
              </div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Tamper-Proof Registry</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Cryptographically validated against the official GenZNex database to prevent credential falsification.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <GoogleIcon name="qr_code_scanner" size={18} />
              </div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">QR Code Enabled</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Every certificate includes a verifiable QR code linking directly to its permanent cryptographic ledger record.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <GoogleIcon name="badge" size={18} />
              </div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Employer Validated</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Instant validation of student capstone grade scores, instructor endorsements, and course milestones.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
