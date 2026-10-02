"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  BookOpen, 
  Clock, 
  Send, 
  Edit3, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { CourseDoc, CourseStatus } from "@/types/schema";
import { formatPrice } from "@/components/courses/CourseCard";

export default function TrainerCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTrainerCourses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const coursesCol = collection(db, "courses");
      // Query courses where trainerId == user.uid
      const q = query(coursesCol, where("trainerId", "==", user.uid));
      const snapshot = await getDocs(q);

      const list: CourseDoc[] = [];
      snapshot.forEach((snap) => {
        list.push({ id: snap.id, ...(snap.data() as Omit<CourseDoc, "id">) });
      });
      setCourses(list);
    } catch (err) {
      console.error("Failed to fetch trainer courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainerCourses();
  }, [user]);

  // Handle submit for review
  const handleSubmitForReview = async (courseId: string) => {
    setSubmittingId(courseId);
    setActionMessage(null);
    try {
      const submitFn = httpsCallable(functions, "submitCourseForReview");
      await submitFn({ courseId });
      setActionMessage({
        type: "success",
        text: "Course submitted for admin review successfully!",
      });
      // Refresh list
      await fetchTrainerCourses();
    } catch (err: any) {
      console.error("Failed to submit course for review:", err);
      setActionMessage({
        type: "error",
        text: err.message || "Failed to submit course for review.",
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredCourses = filterStatus === "all"
    ? courses
    : courses.filter((c) => c.status === filterStatus);

  const getStatusBadge = (status: CourseStatus) => {
    switch (status) {
      case "published":
        return <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">Published</span>;
      case "pending_review":
        return <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">Pending Review</span>;
      case "rejected":
        return <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">Rejected</span>;
      case "draft":
      default:
        return <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-400 border border-zinc-700">Draft</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-zinc-800 bg-gradient-to-r from-purple-950/30 via-zinc-950/60 to-transparent backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curriculum Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Courses Studio
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Build, edit modules, and submit courses for admin approval.
          </p>
        </div>

        <Link
          href="/trainer/courses/new"
          id="btn-create-course"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </Link>
      </div>

      {/* Action Messages */}
      {actionMessage && (
        <div
          className={`rounded-xl p-4 text-xs flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: "All Courses" },
            { id: "published", label: "Published" },
            { id: "pending_review", label: "In Review" },
            { id: "draft", label: "Drafts" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchTrainerCourses}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur-md hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Details */}
              <div className="flex items-start sm:items-center gap-4 flex-1">
                <img
                  src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop"}
                  alt={course.title}
                  className="h-20 w-32 rounded-xl object-cover shrink-0 border border-zinc-800"
                />

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(course.status)}
                    <span className="text-xs text-zinc-500">{course.categoryName || course.category}</span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs text-zinc-500 capitalize">{course.level}</span>
                  </div>

                  <h3 className="text-base font-bold text-white truncate">{course.title}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-200">
                      {formatPrice(course.priceInPaise)}
                    </span>
                    <span>{course.lessonCount || 0} lessons</span>
                    {course.totalDurationMinutes ? (
                      <span>{Math.round(course.totalDurationMinutes / 60)} hrs</span>
                    ) : null}
                  </div>

                  {/* Rejection Alert Box */}
                  {course.status === "rejected" && course.rejectionReason && (
                    <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-rose-200">Rejection Feedback: </strong>
                          <span>{course.rejectionReason}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 self-end md:self-center">
                {/* Preview Link */}
                <Link
                  href={`/courses/${course.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Link>

                {/* Edit Button */}
                {(course.status === "draft" || course.status === "rejected") && (
                  <Link
                    href={`/trainer/courses/${course.id}/edit`}
                    id={`btn-edit-${course.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-violet-500 hover:text-violet-400"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{course.status === "rejected" ? "Fix & Edit" : "Edit"}</span>
                  </Link>
                )}

                {/* Submit for Review Button */}
                {(course.status === "draft" || course.status === "rejected") && (
                  <button
                    onClick={() => handleSubmitForReview(course.id)}
                    disabled={submittingId === course.id}
                    id={`btn-submit-${course.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingId === course.id ? "Submitting..." : course.status === "rejected" ? "Resubmit" : "Submit for Review"}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center flex flex-col items-center justify-center">
          <BookOpen className="h-10 w-10 text-zinc-500 mb-3" />
          <h3 className="text-base font-bold text-white">No courses found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1">
            You don't have any courses matching the selected filter.
          </p>
          <Link
            href="/trainer/courses/new"
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500"
          >
            Create Your First Course
          </Link>
        </div>
      )}
    </div>
  );
}
