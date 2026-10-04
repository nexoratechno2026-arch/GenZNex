"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import {
  FolderGit2,
  Calendar,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  Loader2,
  File,
} from "lucide-react";

export default function StudentAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  const courseSlug = params.courseSlug as string;
  const assignmentId = params.assignmentId as string;

  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [assignment, setAssignment] = useState<any | null>(null);
  const [submission, setSubmission] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [textSubmission, setTextSubmission] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadAssignmentData() {
      if (authLoading) return;
      if (!user) {
        router.push(`/login?redirect=/learn/${courseSlug}/assignment/${assignmentId}`);
        return;
      }

      try {
        setLoading(true);
        // 1. Fetch course
        const coursesRef = collection(db, "courses");
        const q = query(coursesRef, where("slug", "==", courseSlug));
        const snap = await getDocs(q);

        if (snap.empty) {
          alert("Course not found");
          router.push("/courses");
          return;
        }

        const cDoc = snap.docs[0];
        const cId = cDoc.id;
        setCourseId(cId);
        setCourseTitle(cDoc.data()?.title || "Course");

        // 2. Fetch assignment
        const aDoc = await getDoc(doc(db, "courses", cId, "assignments", assignmentId));
        if (aDoc.exists()) {
          setAssignment({ id: aDoc.id, ...aDoc.data() });
        } else {
          // Fallback root collection
          const rootADoc = await getDoc(doc(db, "assignments", assignmentId));
          if (rootADoc.exists()) {
            setAssignment({ id: rootADoc.id, ...rootADoc.data() });
          }
        }

        // 3. Fetch existing submission for this student
        const subSnap = await getDocs(
          query(
            collection(db, "submissions"),
            where("assignmentId", "==", assignmentId),
            where("studentId", "==", user.uid)
          )
        );

        if (!subSnap.empty) {
          const subData = { id: subSnap.docs[0].id, ...subSnap.docs[0].data() } as any;
          setSubmission(subData);
          if (subData.textSubmission) setTextSubmission(subData.textSubmission);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Load assignment failed:", err);
        setLoading(false);
      }
    }

    loadAssignmentData();
  }, [courseSlug, assignmentId, user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId || !assignment) return;
    if (!textSubmission.trim() && !selectedFile) {
      alert("Please provide a text writeup or upload a project file.");
      return;
    }

    try {
      setSubmitting(true);
      let fileDownloadUrl = submission?.fileDownloadUrl || "";
      let fileStoragePath = submission?.fileStoragePath || "";

      // 1. Upload file to Cloud Storage if provided
      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop() || "dat";
        const storagePath = `submissions/${courseId}/${user.uid}/${assignmentId}_${Date.now()}.${ext}`;
        const fileRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(fileRef, selectedFile);
        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (error) => reject(error),
            async () => {
              fileDownloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              fileStoragePath = storagePath;
              resolve(fileDownloadUrl);
            }
          );
        });
      }

      // 2. Save submission doc in /submissions
      const subId = submission?.id || `sub_${Date.now()}_${user.uid.slice(0, 6)}`;
      const subPayload = {
        id: subId,
        assignmentId,
        courseId,
        studentId: user.uid,
        studentName: userProfile?.displayName || user.displayName || "Student",
        studentEmail: user.email || "",
        textSubmission: textSubmission.trim(),
        fileStoragePath,
        fileDownloadUrl,
        fileName: selectedFile?.name || submission?.fileName || "",
        isLate: false,
        status: "submitted",
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "submissions", subId), subPayload, { merge: true });
      setSubmission(subPayload);
      setSubmitting(false);
      setSelectedFile(null);
      setUploadProgress(null);
    } catch (err: any) {
      console.error("Submission failed:", err);
      alert(err.message || "Failed to submit assignment.");
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
        <p className="text-neutral-500 dark:text-neutral-400 font-mono text-sm">Loading project brief...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white flex flex-col">
      <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/learn/${courseSlug}`}
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider block">
              HANDS-ON ASSIGNMENT
            </span>
            <h1 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate max-w-sm sm:max-w-md">
              {assignment?.title || "Assignment"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold">
            {assignment?.maxPoints || 100} Points Max
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Project Brief Card */}
        <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-cyan-500" /> Instructions & Guidelines
            </h2>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Calendar className="w-4 h-4 text-violet-500" />
              <span>Due: Flexible / Course Pace</span>
            </div>
          </div>

          <div className="prose max-w-none text-sm text-neutral-700 dark:text-neutral-300 dark:prose-invert leading-relaxed whitespace-pre-wrap">
            {assignment?.instructionsMarkdown ||
              "Implement the project specification according to the course architecture guidelines. Document your solution and attach your source code or PDF deliverables below."}
          </div>
        </div>

        {/* Existing Submission Status Card */}
        {submission && (
          <div
            className={`p-6 rounded-2xl border ${
              submission.status === "graded"
                ? "bg-emerald-500/10 border-emerald-500/30"
                : submission.status === "resubmit_requested"
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-neutral-100 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {submission.status === "graded" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : submission.status === "resubmit_requested" ? (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                ) : (
                  <Clock className="w-5 h-5 text-violet-500" />
                )}
                <span className="font-bold text-sm text-neutral-900 dark:text-white capitalize">
                  Submission Status: {submission.status.replace("_", " ")}
                </span>
              </div>
              {submission.grade !== undefined && (
                <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  Grade: {submission.grade} / {assignment?.maxPoints || 100}
                </div>
              )}
            </div>

            {submission.feedback && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 mt-2">
                <span className="font-bold text-violet-600 dark:text-violet-400 block mb-1">Trainer Feedback:</span>
                {submission.feedback}
              </div>
            )}
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-5 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-cyan-500" />
            {submission ? "Update Your Submission" : "Submit Your Solution"}
          </h3>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Solution Writeup / Architecture Notes / Live Links
            </label>
            <textarea
              rows={5}
              value={textSubmission}
              onChange={(e) => setTextSubmission(e.target.value)}
              placeholder="Describe your implementation, GitHub repository URL, live deployment link, and instructions to test..."
              className="w-full p-4 bg-white dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Attach Deliverable (PDF, ZIP, or screenshot, max 25MB)
            </label>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold cursor-pointer border border-neutral-200 dark:border-neutral-700 flex items-center gap-2 transition">
                <UploadCloud className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /> Choose File
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {selectedFile ? (
                <span className="text-xs text-cyan-600 dark:text-cyan-300 font-mono flex items-center gap-1.5">
                  <File className="w-4 h-4" /> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              ) : submission?.fileName ? (
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                  Previously attached: {submission.fileName}
                </span>
              ) : null}
            </div>

            {uploadProgress !== null && (
              <div className="mt-2 space-y-1">
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-[10px] text-right font-mono text-neutral-500 dark:text-neutral-400">
                  Uploading: {uploadProgress}%
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              {submitting ? "Submitting Work..." : "Submit Project"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
