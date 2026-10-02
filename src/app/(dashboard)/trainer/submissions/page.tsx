"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import type { SubmissionDoc } from "@/types/schema";
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  FileCheck,
  Send,
  X,
  FileText,
  User,
} from "lucide-react";

export default function TrainerSubmissionsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Grading Modal State
  const [activeSub, setActiveSub] = useState<SubmissionDoc | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(85);
  const [feedbackInput, setFeedbackInput] = useState<string>("");
  const [gradingLoading, setGradingLoading] = useState(false);

  useEffect(() => {
    async function loadTrainerSubmissions() {
      if (authLoading || !user) return;
      try {
        setLoading(true);
        // 1. Fetch trainer's courses
        const coursesRef = collection(db, "courses");
        let courseIds: string[] = [];

        if (userProfile?.role === "admin") {
          const allCourses = await getDocs(coursesRef);
          courseIds = allCourses.docs.map((d) => d.id);
        } else {
          const qCourses = query(coursesRef, where("instructor.uid", "==", user.uid));
          const cSnap = await getDocs(qCourses);
          courseIds = cSnap.docs.map((d) => d.id);

          if (courseIds.length === 0) {
            const qLegacy = query(coursesRef, where("trainerId", "==", user.uid));
            const cLegacy = await getDocs(qLegacy);
            courseIds = cLegacy.docs.map((d) => d.id);
          }
        }

        if (courseIds.length === 0) {
          setSubmissions([]);
          setLoading(false);
          return;
        }

        // 2. Fetch submissions for these courses (batch by up to 10)
        const subSnap = await getDocs(
          query(collection(db, "submissions"), where("courseId", "in", courseIds.slice(0, 10)))
        );

        const loaded: SubmissionDoc[] = [];
        subSnap.forEach((d) => loaded.push({ id: d.id, ...d.data() } as SubmissionDoc));
        setSubmissions(loaded);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load submissions:", err);
        setLoading(false);
      }
    }

    loadTrainerSubmissions();
  }, [user, userProfile, authLoading]);

  const handleOpenGradeModal = (sub: SubmissionDoc) => {
    setActiveSub(sub);
    setGradeInput(sub.grade !== undefined ? sub.grade : 85);
    setFeedbackInput(sub.feedback || "");
  };

  const handleGradeSubmit = async (requestResubmit: boolean = false) => {
    if (!activeSub) return;
    try {
      setGradingLoading(true);
      const gradeFn = httpsCallable(functions, "gradeAssignmentSubmission");
      const res: any = await gradeFn({
        submissionId: activeSub.id,
        grade: Number(gradeInput),
        feedback: feedbackInput.trim(),
        requestResubmission: requestResubmit,
      });

      if (res.data?.success) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === activeSub.id
              ? {
                  ...s,
                  status: res.data.status,
                  grade: Number(gradeInput),
                  feedback: feedbackInput.trim(),
                }
              : s
          )
        );
        setActiveSub(null);
      }
      setGradingLoading(false);
    } catch (err: any) {
      console.error("Grading failed:", err);
      alert(err.message || "Failed to grade submission.");
      setGradingLoading(false);
    }
  };

  const filtered = submissions.filter((s) => {
    if (filterStatus === "all") return true;
    return s.status === filterStatus;
  });

  if (loading || authLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
        <p className="text-gray-400 text-xs font-mono">Loading student submission queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <FolderGit2 className="w-7 h-7 text-cyan-400" /> Student Submissions & Project Grading
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review code repositories, deliver constructive feedback, and award assignment credits.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs font-semibold">
          {[
            { id: "all", label: "All" },
            { id: "submitted", label: "Pending Review" },
            { id: "graded", label: "Graded" },
            { id: "resubmit_requested", label: "Resubmit Requested" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === tab.id
                  ? "bg-purple-600 text-white font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-gray-800 space-y-3">
          <FileCheck className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Submissions Found</h3>
          <p className="text-xs text-gray-400">
            {filterStatus === "submitted"
              ? "All caught up! There are no pending submissions awaiting review."
              : "No student submissions matching the selected filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((sub) => {
            const dateStr = sub.submittedAt
              ? new Date((sub.submittedAt as any).toMillis?.() || Date.now()).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent";

            return (
              <div
                key={sub.id}
                className="p-5 rounded-2xl glass-panel border border-gray-800 hover:border-gray-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        sub.status === "graded"
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          : sub.status === "resubmit_requested"
                          ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                          : "bg-purple-500/10 border border-purple-500/30 text-purple-400"
                      }`}
                    >
                      {sub.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {dateStr}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" /> {sub.studentName}
                  </h3>

                  {sub.textSubmission && (
                    <p className="text-xs text-gray-300 truncate max-w-xl">
                      {sub.textSubmission}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {sub.grade !== undefined && (
                    <span className="text-sm font-bold font-mono text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      {sub.grade} pts
                    </span>
                  )}

                  {sub.fileDownloadUrl && (
                    <a
                      href={sub.fileDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                      title="Download attached student files"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => handleOpenGradeModal(sub)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                  >
                    {sub.status === "graded" ? "Edit Grade" : "Evaluate & Grade"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grading Drawer / Modal */}
      {activeSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full glass-panel p-6 rounded-2xl border border-gray-800 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider block">
                  SUBMISSION EVALUATION
                </span>
                <h3 className="text-base font-bold text-white">{activeSub.studentName}</h3>
              </div>
              <button
                onClick={() => setActiveSub(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submission preview */}
            <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2 text-xs">
              <span className="font-bold text-gray-400 block uppercase tracking-wider text-[10px]">
                Student Writeup
              </span>
              <p className="text-gray-200 whitespace-pre-wrap max-h-36 overflow-y-auto">
                {activeSub.textSubmission || "No written notes provided."}
              </p>

              {activeSub.fileDownloadUrl && (
                <div className="pt-2 border-t border-gray-800/80">
                  <a
                    href={activeSub.fileDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1.5 font-mono"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Deliverable File ({activeSub.fileName || "Download"})
                  </a>
                </div>
              )}
            </div>

            {/* Grading Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Awarded Score (Points)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradeInput}
                  onChange={(e) => setGradeInput(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Feedback & Recommendations
                </label>
                <textarea
                  rows={4}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Commend good practices, point out edge cases, and share architecture tips..."
                  className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => handleGradeSubmit(true)}
                disabled={gradingLoading}
                className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition"
              >
                Request Resubmission
              </button>
              <button
                type="button"
                onClick={() => handleGradeSubmit(false)}
                disabled={gradingLoading}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-purple-600/20"
              >
                {gradingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Confirm Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
