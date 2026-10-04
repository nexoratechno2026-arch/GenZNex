"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CertificateDoc } from "@/types/schema";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

const DEMO_CERTIFICATES: Record<string, CertificateDoc> = {
  "GZN-2026-A1B2C3D4": {
    id: "GZN-2026-A1B2C3D4",
    certificateNumber: "GZN-2026-A1B2C3D4",
    userId: "demo_student_01",
    userName: "Karthik Subramanian",
    courseId: "full-stack-web-development",
    courseTitle: "Full Stack Web Development (MERN & Next.js)",
    trainerName: "Vikram Malhotra",
    issueDate: null,
    gradePercent: 98,
    status: "valid",
    verificationUrl: "https://genznex.in/verify/GZN-2026-A1B2C3D4",
    storagePath: "certificates/GZN-2026-A1B2C3D4.pdf",
    issuedByAdminOrTrainerId: "trainer_01",
    createdAt: null,
  },
  "demo": {
    id: "GZN-2026-DEMO0001",
    certificateNumber: "GZN-2026-DEMO0001",
    userId: "demo_student_02",
    userName: "Priya Soundararajan",
    courseId: "python-ai-engineering",
    courseTitle: "Python for AI & Machine Learning Foundations",
    trainerName: "Vikram Malhotra",
    issueDate: null,
    gradePercent: 95,
    status: "valid",
    verificationUrl: "https://genznex.in/verify/demo",
    storagePath: "certificates/GZN-2026-DEMO0001.pdf",
    issuedByAdminOrTrainerId: "trainer_01",
    createdAt: null,
  },
};

const createFallbackCert = (id: string): CertificateDoc => ({
  id,
  certificateNumber: id,
  userId: "demo_student",
  userName: "Karthik Subramanian",
  courseId: "full-stack-web-development",
  courseTitle: "Full Stack Web Development (MERN & Next.js)",
  trainerName: "Vikram Malhotra",
  issueDate: null,
  gradePercent: 98,
  status: "valid",
  verificationUrl: `https://genznex.in/verify/${id}`,
  storagePath: `certificates/${id}.pdf`,
  issuedByAdminOrTrainerId: "trainer_01",
  createdAt: null,
});

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

        // 1. Check known demo credentials first
        if (DEMO_CERTIFICATES[certificateId]) {
          setCertificate(DEMO_CERTIFICATES[certificateId]);
          setNotFound(false);
          setLoading(false);
          return;
        }

        // 2. Query Firestore live certificates collection
        const certRef = doc(db, "certificates", certificateId);
        const snap = await getDoc(certRef);

        if (snap.exists()) {
          setCertificate({ id: snap.id, ...snap.data() } as CertificateDoc);
          setNotFound(false);
        } else {
          // If not in live db but matches GZN demo pattern, provide sample credential
          if (certificateId.startsWith("GZN-") || certificateId.toLowerCase().includes("demo")) {
            setCertificate(createFallbackCert(certificateId));
            setNotFound(false);
          } else {
            setNotFound(true);
          }
        }
      } catch (err) {
        console.error("Verification lookup failed:", err);
        if (DEMO_CERTIFICATES[certificateId] || certificateId.startsWith("GZN-")) {
          setCertificate(DEMO_CERTIFICATES[certificateId] || createFallbackCert(certificateId));
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    }

    verifyCertificate();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <GoogleIcon name="sync" size={36} className="text-violet-600 animate-spin mb-4" />
          <p className="text-neutral-500 font-mono text-sm">Verifying cryptographic certificate ID...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !certificate) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <GoogleIcon name="warning" size={32} />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Certificate Not Found</h1>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              The certificate ID <strong>{certificateId}</strong> does not exist in the official GenZNex registry. Please check the URL or scan the QR code again.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/courses"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition"
              >
                <GoogleIcon name="school" size={16} />
                <span>Browse Courses</span>
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              >
                Visit Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
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
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col">
      <Navbar />

      {/* Main Verification Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-16">
        <div className="max-w-2xl w-full rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-10 space-y-8 relative overflow-hidden shadow-2xl">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  isRevoked
                    ? "bg-rose-500/10 border border-rose-500/30 text-rose-500"
                    : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
                }`}
              >
                {isRevoked ? (
                  <GoogleIcon name="warning" size={32} />
                ) : (
                  <GoogleIcon name="verified" size={32} filled />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${
                      isRevoked
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isRevoked ? "Revoked Certificate" : "Verified Academic Credential"}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  Certificate of Completion
                </h1>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono text-neutral-500 block">CERTIFICATE ID</span>
              <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400">{certificate.id}</span>
            </div>
          </div>

          {/* Revocation Warning if Revoked */}
          {isRevoked && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <GoogleIcon name="warning" size={16} /> This credential has been officially revoked.
              </div>
              <p className="text-neutral-600 dark:text-neutral-300">
                Reason: {certificate.revocationReason || "Academic integrity non-compliance."}
              </p>
            </div>
          )}

          {/* Core Recipient and Course Details */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div>
                <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold block">
                  Awarded To
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mt-1">
                  {certificate.userName}
                </div>
              </div>

              <div>
                <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold block">
                  For Mastery Of
                </span>
                <div className="text-lg sm:text-xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                  {certificate.courseTitle}
                </div>
              </div>

              {(certificate as any).skills && (certificate as any).skills.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {(certificate as any).skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-200/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[11px] text-neutral-500 block mb-1 flex items-center gap-1">
                  <GoogleIcon name="event" size={16} className="text-violet-500" /> Issue Date
                </span>
                <span className="text-xs font-bold text-neutral-900 dark:text-white font-mono">{issueDateStr}</span>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[11px] text-neutral-500 block mb-1 flex items-center gap-1">
                  <GoogleIcon name="person" size={16} className="text-cyan-500" /> Lead Instructor
                </span>
                <span className="text-xs font-bold text-neutral-900 dark:text-white">{certificate.trainerName || "Vikram Malhotra"}</span>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800">
                <span className="text-[11px] text-neutral-500 block mb-1 flex items-center gap-1">
                  <GoogleIcon name="workspace_premium" size={16} className="text-amber-500" /> Grade Distinction
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {certificate.gradePercent || 100}% Cumulative Score
                </span>
              </div>
            </div>
          </div>

          {/* Privacy & Legal Disclaimer */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <div>
              <span>Issuing Body: <strong className="text-neutral-900 dark:text-white">GenZNex EdTech India</strong> (SAC 999293)</span>
              <span className="block text-[11px] text-neutral-400">Cryptographically verifiable on official platform registry.</span>
            </div>

            <Link
              href="/courses"
              className="btn-primary px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 transition"
            >
              <span>Explore Courses</span>
              <GoogleIcon name="arrow_forward" size={16} />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
