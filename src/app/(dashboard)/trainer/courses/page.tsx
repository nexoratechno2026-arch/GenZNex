"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { collection, query, where, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { CourseDoc, CourseStatus } from "@/types/schema";
import { Button } from "@/components/ui/Button";
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
        return <span className="rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black">Published</span>;
      case "pending_review":
        return <span className="rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border border-neutral-400 dark:border-neutral-600 text-black dark:text-white">In Review</span>;
      case "rejected":
        return <span className="rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white border border-neutral-300 dark:border-neutral-700">Rejected</span>;
      case "draft":
      default:
        return <span className="rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">Draft</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Course Management</h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
            Draft, edit, and publish your industry-ready courses and curriculum.
          </p>
        </div>

        <Link href="/trainer/courses/new">
          <Button variant="primary" size="sm" leftIcon={<GoogleIcon name="add" size={16} />}>
            Create New Course
          </Button>
        </Link>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="rounded-lg p-3.5 text-xs font-bold border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GoogleIcon name={actionMessage.type === "success" ? "check_circle" : "error"} size={16} />
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
          >
            <GoogleIcon name="close" size={14} />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
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
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                  : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchTrainerCourses}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
        >
          <GoogleIcon name="refresh" size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse border border-neutral-200 dark:border-neutral-800" />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-5 shadow-sm hover:border-black dark:hover:border-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Details */}
              <div className="flex items-start sm:items-center gap-4 flex-1">
                <div className="relative h-20 w-32 rounded-lg overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                  <Image
                    src={course.thumbnailUrl || "/images/placeholder.jpg"}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(course.status)}
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">{course.categoryName || course.category}</span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 capitalize font-medium">{course.level}</span>
                  </div>

                  <h3 className="text-base font-bold text-black dark:text-white truncate">{course.title}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    <span className="font-bold text-black dark:text-white">
                      {formatPrice(course.priceInPaise)}
                    </span>
                    <span>{course.lessonCount || 0} lessons</span>
                    {course.totalDurationMinutes ? (
                      <span>{Math.round(course.totalDurationMinutes / 60)} hrs</span>
                    ) : null}
                  </div>

                  {/* Rejection Alert Box */}
                  {course.status === "rejected" && course.rejectionReason && (
                    <div className="mt-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-3 text-xs text-black dark:text-white font-medium">
                      <div className="flex items-start gap-2">
                        <GoogleIcon name="error" size={16} />
                        <div>
                          <strong>Rejection Feedback: </strong>
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
                <Link href={`/courses/${course.slug}`} target="_blank">
                  <Button variant="outline" size="sm" leftIcon={<GoogleIcon name="visibility" size={14} />}>
                    Preview
                  </Button>
                </Link>

                {/* Edit Button */}
                {(course.status === "draft" || course.status === "rejected") && (
                  <Link href={`/trainer/courses/${course.id}/edit`}>
                    <Button variant="secondary" size="sm" leftIcon={<GoogleIcon name="edit" size={14} />}>
                      {course.status === "rejected" ? "Fix & Edit" : "Edit"}
                    </Button>
                  </Link>
                )}

                {/* Submit for Review Button */}
                {(course.status === "draft" || course.status === "rejected") && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={submittingId === course.id}
                    onClick={() => handleSubmitForReview(course.id)}
                    leftIcon={submittingId !== course.id ? <GoogleIcon name="send" size={14} /> : undefined}
                  >
                    {submittingId === course.id ? "Submitting..." : course.status === "rejected" ? "Resubmit" : "Submit for Review"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-12 text-center flex flex-col items-center justify-center">
          <GoogleIcon name="menu_book" size={36} className="text-neutral-400 mb-3" />
          <h3 className="text-base font-bold text-black dark:text-white">No courses found</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mt-1 font-medium">
            You don&apos;t have any courses matching the selected filter.
          </p>
          <Link href="/trainer/courses/new" className="mt-4">
            <Button variant="primary" size="sm">
              Create Your First Course
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
