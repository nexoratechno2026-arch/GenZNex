"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { useAuth } from "@/lib/context/AuthContext";
import { CourseDoc } from "@/types/schema";

interface EnrolledCourseItem {
  id: string;
  courseId: string;
  course?: CourseDoc;
  progressPercentage: number;
  completedLessons: string[];
  lastAccessedLessonId?: string;
  status: string;
}

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<EnrolledCourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadEnrolledCourses() {
      setLoading(true);
      try {
        const enrollQuery = query(
          collection(db, "enrollments"),
          where("userId", "==", user!.uid)
        );
        const enrollSnap = await getDocs(enrollQuery);
        const items: EnrolledCourseItem[] = [];

        for (const d of enrollSnap.docs) {
          const data = d.data();
          let courseData: CourseDoc | undefined;

          if (data.courseId) {
            try {
              const cSnap = await getDoc(doc(db, "courses", data.courseId));
              if (cSnap.exists()) {
                courseData = { id: cSnap.id, ...cSnap.data() } as CourseDoc;
              }
            } catch {
              // Ignore single course fetch error
            }
          }

          items.push({
            id: d.id,
            courseId: data.courseId,
            course: courseData,
            progressPercentage: data.progressPercentage || 0,
            completedLessons: data.completedLessons || [],
            lastAccessedLessonId: data.lastAccessedLessonId,
            status: data.status || "active",
          });
        }

        setCourses(items);
      } catch (err) {
        console.error("Failed to load enrolled courses:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEnrolledCourses();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white">
            My Enrolled Courses
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Access your interactive lesson videos, quizzes, hands-on tasks, and certificates.
          </p>
        </div>
        <Link href="/courses">
          <Button variant="secondary" size="sm" rightIcon={<GoogleIcon name="arrow_forward" size={16} />}>
            Browse More Courses
          </Button>
        </Link>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 animate-pulse"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mx-auto text-black dark:text-white">
            <GoogleIcon name="school" size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-black dark:text-white">No active enrollments yet</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto mt-1">
              Explore our industry-standard courses and bootcamps to begin your learning journey.
            </p>
          </div>
          <Link href="/courses">
            <Button variant="primary" size="md" rightIcon={<GoogleIcon name="arrow_forward" size={16} />}>
              Explore Course Catalog
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((item) => {
            const course = item.course;
            const targetLesson = item.lastAccessedLessonId || "lesson-1";
            const learnUrl = course?.slug ? `/learn/${course.slug}/${targetLesson}` : "/courses";

            return (
              <div
                key={item.id}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                    <img
                      src={
                        course?.thumbnailUrl ||
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop"
                      }
                      alt={course?.title || "Course thumbnail"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 rounded bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 text-[10px] font-bold border border-neutral-700 dark:border-neutral-300">
                      {item.progressPercentage}% Complete
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                      {course?.category || "Technology"}
                    </span>
                    <h3 className="text-base font-bold text-black dark:text-white line-clamp-2">
                      {course?.title || `Course #${item.courseId.slice(0, 8)}`}
                    </h3>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-black dark:bg-white h-full transition-all duration-300"
                          style={{ width: `${item.progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>Progress</span>
                        <span>{item.progressPercentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Link href={learnUrl} className="block w-full">
                    <Button
                      variant="primary"
                      fullWidth
                      size="sm"
                      rightIcon={<GoogleIcon name="play_arrow" size={16} />}
                    >
                      {item.progressPercentage > 0 ? "Continue Lesson" : "Start Learning"}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
