"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import type { SubmissionDoc } from "@/types/schema";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

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
        <div className="w-8 h-8 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin mb-3" />
        <p className="text-neutral-600 dark:text-neutral-400 text-xs font-bold">Loading student submission queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black mb-2">
            <GoogleIcon name="folder_zip" size={14} />
            <span>Grading Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
            Student Submissions &amp; Project Grading
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
            Review code repositories, deliver constructive feedback, and award assignment credits.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-black text-xs font-bold">
          {[
            { id: "all", label: "All" },
            { id: "submitted", label: "Pending Review" },
            { id: "graded", label: "Graded" },
            { id: "resubmit_requested", label: "Resubmit Requested" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 space-y-3">
          <div className="w-12 h-12 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center mx-auto text-neutral-500 dark:text-neutral-400">
            <GoogleIcon name="task" size={24} />
          </div>
          <h3 className="text-base font-bold text-black dark:text-white">No Submissions Found</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {filterStatus === "submitted"
              ? "All caught up! There are no pending submissions awaiting review."
              : "No student submissions matching the selected filter."}
          </p>
        </Card>
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
              <Card
                key={sub.id}
                className="p-5 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 hover:border-black dark:hover:border-white transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black">
                      {sub.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1 font-medium">
                      <GoogleIcon name="schedule" size={14} /> {dateStr}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                    <GoogleIcon name="person" size={16} /> {sub.studentName}
                  </h3>

                  {sub.textSubmission && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-xl font-medium">
                      {sub.textSubmission}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {sub.grade !== undefined && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-black dark:text-white">
                      {sub.grade} pts
                    </span>
                  )}

                  {sub.fileDownloadUrl && (
                    <a
                      href={sub.fileDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-black dark:text-white transition"
                      title="Download attached student files"
                    >
                      <GoogleIcon name="download" size={16} />
                    </a>
                  )}

                  <Button
                    onClick={() => handleOpenGradeModal(sub)}
                    variant={sub.status === "graded" ? "outline" : "primary"}
                    size="sm"
                  >
                    {sub.status === "graded" ? "Edit Grade" : "Evaluate & Grade"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Grading Drawer / Modal */}
      {activeSub && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider block">
                  SUBMISSION EVALUATION
                </span>
                <h3 className="text-base font-bold text-black dark:text-white">{activeSub.studentName}</h3>
              </div>
              <button
                onClick={() => setActiveSub(null)}
                className="text-neutral-500 hover:text-black dark:hover:text-white p-1 cursor-pointer"
              >
                <GoogleIcon name="close" size={20} />
              </button>
            </div>

            {/* Submission preview */}
            <div className="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 space-y-2 text-xs">
              <span className="font-bold text-neutral-500 dark:text-neutral-400 block uppercase tracking-wider text-[10px]">
                Student Writeup
              </span>
              <p className="text-black dark:text-white whitespace-pre-wrap max-h-36 overflow-y-auto font-medium">
                {activeSub.textSubmission || "No written notes provided."}
              </p>

              {activeSub.fileDownloadUrl && (
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <a
                    href={activeSub.fileDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1.5 font-bold text-black dark:text-white"
                  >
                    <GoogleIcon name="description" size={16} /> View Deliverable File ({activeSub.fileName || "Download"})
                  </a>
                </div>
              )}
            </div>

            {/* Grading Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Awarded Score (Points)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradeInput}
                  onChange={(e) => setGradeInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-black dark:text-white text-sm font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-white mb-1">
                  Feedback &amp; Recommendations
                </label>
                <textarea
                  rows={4}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Commend good practices, point out edge cases, and share architecture tips..."
                  className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-black dark:text-white placeholder-neutral-500 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleGradeSubmit(true)}
                disabled={gradingLoading}
              >
                Request Resubmission
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleGradeSubmit(false)}
                disabled={gradingLoading}
                leftIcon={gradingLoading ? undefined : <GoogleIcon name="send" size={14} />}
              >
                {gradingLoading ? "Submitting..." : "Confirm Grade"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
