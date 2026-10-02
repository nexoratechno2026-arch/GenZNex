"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import type { CertificateDoc } from "@/types/schema";
import {
  Award,
  ExternalLink,
  Download,
  Calendar,
  Sparkles,
  Share2,
  CheckCircle2,
  Loader2,
  BookOpen,
} from "lucide-react";

export default function StudentCertificatesPage() {
  const { user, loading: authLoading } = useAuth();
  const [certificates, setCertificates] = useState<CertificateDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCertificates() {
      if (authLoading || !user) return;
      try {
        setLoading(true);
        const certsRef = collection(db, "certificates");
        const q = query(certsRef, where("userId", "==", user.uid));
        const snap = await getDocs(q);

        const loaded: CertificateDoc[] = [];
        snap.forEach((d) => loaded.push({ id: d.id, ...d.data() } as CertificateDoc));
        setCertificates(loaded);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load certificates:", err);
        setLoading(false);
      }
    }

    loadCertificates();
  }, [user, authLoading]);

  const getLinkedInCertUrl = (cert: CertificateDoc) => {
    const orgName = "GenZNex EdTech India";
    const certName = cert.courseTitle;
    const certId = cert.certificateNumber || cert.id;
    const certUrl = cert.verificationUrl || `https://genznex.in/verify/${cert.id}`;

    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
      certName
    )}&organizationName=${encodeURIComponent(orgName)}&issueYear=2026&certId=${encodeURIComponent(
      certId
    )}&certUrl=${encodeURIComponent(certUrl)}`;
  };

  if (loading || authLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
        <p className="text-gray-400 text-xs font-mono">Loading your verified certificates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-400" /> My Verified Certificates
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Industry-recognized credentials with cryptographic tamper-proof verification and LinkedIn integration.
          </p>
        </div>

        <Link
          href="/student/courses"
          className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 text-xs font-bold flex items-center gap-2 self-start sm:self-auto transition"
        >
          <BookOpen className="w-4 h-4" /> Continue Courses
        </Link>
      </div>

      {certificates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-gray-800 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Certificates Earned Yet</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Complete 100% of a course&apos;s curriculum, pass all quizzes, and submit your hands-on assignments to receive your verified certificate of completion.
          </p>
          <Link
            href="/student/courses"
            className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition"
          >
            Go to My Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => {
            const dateStr = cert.issueDate
              ? new Date((cert.issueDate as any).toMillis?.() || Date.now()).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "2026";

            return (
              <div
                key={cert.id}
                className="p-6 rounded-2xl glass-panel border border-gray-800 hover:border-purple-500/40 transition flex flex-col justify-between space-y-6 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED CREDENTIAL
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      ID: {cert.id}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">
                    {cert.courseTitle}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" /> Issued: {dateStr}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">
                      {cert.gradePercent || 100}% Score
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800/80 flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/verify/${cert.id}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Verify Link
                  </Link>

                  <a
                    href={getLinkedInCertUrl(cert)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#0a66c2]/15 border border-[#0a66c2]/40 text-[#70b5f9] hover:bg-[#0a66c2]/30 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Add to LinkedIn
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
