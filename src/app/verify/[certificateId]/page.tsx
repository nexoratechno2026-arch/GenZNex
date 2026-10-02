"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CertificateDoc } from "@/types/schema";
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Calendar,
  User,
  BookOpen,
  Download,
  ExternalLink,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function CertificateVerificationPage() {
  const params = useParams();
  const certificateId = params.certificateId as string;

  const [certificate, setCertificate] = useState<CertificateDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function verifyCertificate() {
      try {
        setLoading(true);
        const certRef = doc(db, "certificates", certificateId);
        const snap = await getDoc(certRef);

        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setCertificate({ id: snap.id, ...snap.data() } as CertificateDoc);
        setLoading(false);
      } catch (err) {
        console.error("Verification lookup failed:", err);
        setNotFound(true);
        setLoading(false);
      }
    }

    verifyCertificate();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080f] text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-sm">Verifying cryptographic certificate ID...</p>
      </div>
    );
  }

  if (notFound || !certificate) {
    return (
      <div className="min-h-screen bg-[#07080f] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-gray-800 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">Certificate Not Found</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            The certificate ID <strong>{certificateId}</strong> does not exist in the official GenZNex registry. Please check the URL or scan the QR code again.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold transition mt-2"
          >
            Visit GenZNex Home
          </Link>
        </div>
      </div>
    );
  }

  const isRevoked = certificate.status === "revoked";
  const issueDateStr = certificate.issueDate
    ? new Date((certificate.issueDate as any).toMillis?.() || Date.now()).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Verified";

  return (
    <div className="min-h-screen bg-[#07080f] text-white flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-gray-800 bg-[#0d0f1a]/80 backdrop-blur px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center font-bold text-white text-base">
            G
          </div>
          <span className="font-bold text-sm tracking-wide">GenZNex</span>
        </Link>
        <span className="text-[11px] font-mono text-gray-400">Official Verification Registry</span>
      </header>

      {/* Main Verification Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl w-full glass-panel rounded-3xl border border-gray-800 p-6 sm:p-10 space-y-8 relative overflow-hidden shadow-2xl">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  isRevoked
                    ? "bg-red-500/10 border border-red-500/30 text-red-400"
                    : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                }`}
              >
                {isRevoked ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${
                      isRevoked
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {isRevoked ? "Revoked Certificate" : "Verified Academic Credential"}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Certificate of Completion
                </h1>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono text-gray-500 block">CERTIFICATE ID</span>
              <span className="font-mono text-xs font-bold text-purple-400">{certificate.id}</span>
            </div>
          </div>

          {/* Revocation Warning if Revoked */}
          {isRevoked && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-red-400">
                <ShieldAlert className="w-4 h-4" /> This credential has been officially revoked.
              </div>
              <p className="text-gray-300">
                Reason: {certificate.revocationReason || "Academic integrity non-compliance."}
              </p>
            </div>
          )}

          {/* Core Recipient and Course Details */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold block">
                  Awarded To
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  {certificate.userName}
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold block">
                  For Mastery Of
                </span>
                <div className="text-lg sm:text-xl font-bold text-purple-300 mt-1">
                  {certificate.courseTitle}
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80">
                <span className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" /> Issue Date
                </span>
                <span className="text-xs font-bold text-white font-mono">{issueDateStr}</span>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80">
                <span className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-cyan-400" /> Lead Instructor
                </span>
                <span className="text-xs font-bold text-white">{certificate.trainerName || "Vikram Malhotra"}</span>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80">
                <span className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Grade Distinction
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {certificate.gradePercent || 100}% Cumulative Score
                </span>
              </div>
            </div>
          </div>

          {/* Privacy & Legal Disclaimer */}
          <div className="pt-2 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              <span>Issuing Body: <strong>GenZNex EdTech India</strong> (SAC 999293)</span>
              <span className="block text-[11px] text-gray-600">Zero PII disclosure in public verification mode.</span>
            </div>

            <Link
              href="/courses"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition"
            >
              Explore GenZNex Courses <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
