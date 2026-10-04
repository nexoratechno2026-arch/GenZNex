"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
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
  enrolledAt?: any;
}

export default function StudentDashboardPage() {
  const { userProfile, user } = useAuth();
  const studentName = userProfile?.displayName || user?.displayName || "Scholar";

  const [enrollments, setEnrollments] = useState<EnrolledCourseItem[]>([]);
  const [certCount, setCertCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    let isMounted = true;
    async function loadStudentData() {
      setLoading(true);
      try {
        // 1. Fetch active enrollments
        const enrollQuery = query(
          collection(db, "enrollments"),
          where("userId", "==", uid)
        );
        const enrollSnap = await getDocs(enrollQuery);
        
        const items: EnrolledCourseItem[] = [];
        for (const eDoc of enrollSnap.docs) {
          const data = eDoc.data();
          if (data.status === "refunded") continue;
          
          let courseData: CourseDoc | undefined;
          try {
            const courseDoc = await getDoc(doc(db, "courses", data.courseId));
            if (courseDoc.exists()) {
              courseData = { id: courseDoc.id, ...courseDoc.data() } as CourseDoc;
            }
          } catch (cErr) {
            console.error("Failed to load course doc for enrollment:", cErr);
          }

          items.push({
            id: eDoc.id,
            courseId: data.courseId,
            course: courseData,
            progressPercentage: data.progressPercentage || 0,
            completedLessons: data.completedLessons || [],
            lastAccessedLessonId: data.lastAccessedLessonId,
            status: data.status,
            enrolledAt: data.enrolledAt,
          });
        }

        // 2. Fetch certificates count
        const certQuery = query(
          collection(db, "certificates"),
          where("userId", "==", uid)
        );
        const certSnap = await getDocs(certQuery);

        if (isMounted) {
          setEnrollments(items);
          setCertCount(certSnap.size);
        }
      } catch (err) {
        console.error("Failed to load student dashboard:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStudentData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Determine the most relevant course to "Continue"
  const activeEnrollment = enrollments.find((e) => e.progressPercentage < 100) || enrollments[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-900 dark:text-white shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 mb-2">
            <GoogleIcon name="school" size={14} />
            <span>Student Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Welcome back, {studentName}!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
            Track your course progress, resume interactive lessons, and build hands-on software projects.
          </p>
        </div>

        <Link href="/courses">
          <Button variant="primary" size="sm" rightIcon={<GoogleIcon name="arrow_forward" size={16} />}>
            Browse Courses
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1 font-bold">
            <span>Enrolled Courses</span>
            <GoogleIcon name="menu_book" size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white">{enrollments.length}</div>
          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
            {enrollments.length > 0 ? "Active learning" : "Ready to enroll"}
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1 font-bold">
            <span>Avg Completion</span>
            <GoogleIcon name="trending_up" size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white">
            {enrollments.length > 0 
              ? `${Math.round(enrollments.reduce((acc, e) => acc + e.progressPercentage, 0) / enrollments.length)}%` 
              : "0%"}
          </div>
          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 font-medium">Across all courses</div>
        </Card>

        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1 font-bold">
            <span>Certificates</span>
            <GoogleIcon name="workspace_premium" size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white">{certCount}</div>
          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
            {certCount > 0 ? (
              <Link href="/student/certificates" className="hover:underline flex items-center gap-1 font-bold text-violet-600 dark:text-violet-400">
                View earned <GoogleIcon name="chevron_right" size={14} />
              </Link>
            ) : (
              "Complete tracks to earn"
            )}
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1 font-bold">
            <span>Practice Labs</span>
            <GoogleIcon name="code" size={18} className="text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white">5+</div>
          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 font-medium">Hands-on projects</div>
        </Card>
      </div>

      {/* Continue Where You Left Off Hero Card */}
      {activeEnrollment && activeEnrollment.course && (
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black">
                  <GoogleIcon name="play_arrow" size={12} /> Continue Learning
                </span>
                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                  {activeEnrollment.progressPercentage}% Completed
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
                  {activeEnrollment.course.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-1 font-medium">
                  {activeEnrollment.course.subtitle || activeEnrollment.course.description}
                </p>
              </div>

              <div className="w-full max-w-md pt-1">
                <ProgressBar 
                  value={activeEnrollment.progressPercentage} 
                  color="purple" 
                  size="md" 
                  showLabel 
                />
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <Link 
                href={
                  activeEnrollment.lastAccessedLessonId
                    ? `/learn/${activeEnrollment.course.slug}/${activeEnrollment.lastAccessedLessonId}`
                    : `/learn/${activeEnrollment.course.slug}`
                }
              >
                <Button 
                  variant="primary" 
                  size="lg" 
                  leftIcon={<GoogleIcon name="play_arrow" size={18} />}
                >
                  Resume Learning
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active Learning Courses */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Active Programs</CardTitle>
                <CardDescription>
                  Your enrolled tracks, modular checkpoints, and certificates.
                </CardDescription>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 px-2.5 py-1 rounded text-black dark:text-white">
                {enrollments.length} Active
              </span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
                  ))}
                </div>
              ) : enrollments.length === 0 ? (
                <div className="p-8 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-800 text-center space-y-3">
                  <GoogleIcon name="menu_book" size={36} className="text-neutral-400 mx-auto" />
                  <h4 className="text-sm font-bold text-black dark:text-white">No active enrollments yet</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto font-medium">
                    Browse our high-energy curriculum in GenAI, Full-Stack, and DevOps. Enrollments will unlock interactive video player and lesson checkpoints.
                  </p>
                  <Link href="/courses" className="inline-block mt-2">
                    <Button variant="secondary" size="sm">
                      Browse Course Catalog
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enroll) => {
                    const course = enroll.course;
                    if (!course) return null;
                    return (
                      <div 
                        key={enroll.id}
                        className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-14 overflow-hidden rounded-md shrink-0 border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800">
                            <Image 
                              src={course.thumbnailUrl || "/images/placeholder.jpg"} 
                              alt={course.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-black dark:text-white line-clamp-1">{course.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                              <span>{course.lessonCount || 0} Lessons</span>
                              <span>•</span>
                              <span className="font-bold text-black dark:text-white">
                                {enroll.progressPercentage}% Completed
                              </span>
                            </div>
                            <div className="w-40 pt-1">
                              <ProgressBar 
                                value={enroll.progressPercentage} 
                                color="purple" 
                                size="sm" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {enroll.progressPercentage === 100 ? (
                            <Link href="/student/certificates">
                              <Button variant="outline" size="sm" leftIcon={<GoogleIcon name="workspace_premium" size={16} />}>
                                Certificate
                              </Button>
                            </Link>
                          ) : null}
                          <Link 
                            href={
                              enroll.lastAccessedLessonId
                                ? `/learn/${course.slug}/${enroll.lastAccessedLessonId}`
                                : `/learn/${course.slug}`
                            }
                          >
                            <Button variant="secondary" size="sm" rightIcon={<GoogleIcon name="chevron_right" size={16} />}>
                              {enroll.progressPercentage === 0 ? "Start" : "Continue"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Shortcuts & Resources */}
          <Card className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Developer Toolkits &amp; Resources</CardTitle>
              <CardDescription>
                Engineering documentation, project starter repositories, and verifiable credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Link 
                  href="/student/certificates"
                  className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <GoogleIcon name="workspace_premium" size={20} className="text-amber-500" />
                    <div>
                      <strong className="text-neutral-900 dark:text-white block group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Official Credentials</strong>
                      <span className="text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">Verifiable certificates &amp; LinkedIn export</span>
                    </div>
                  </div>
                  <GoogleIcon name="chevron_right" size={16} />
                </Link>

                <Link 
                  href="/courses"
                  className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <GoogleIcon name="school" size={20} className="text-violet-600 dark:text-violet-400" />
                    <div>
                      <strong className="text-neutral-900 dark:text-white block group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Explore Curriculum</strong>
                      <span className="text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">Full-Stack, GenAI &amp; Cloud DevOps</span>
                    </div>
                  </div>
                  <GoogleIcon name="chevron_right" size={16} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Schedule & Readiness */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Upcoming Sessions</CardTitle>
              <CardDescription>Live batch classes &amp; office hours.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span className="text-[10px] font-bold uppercase bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-0.5 rounded-md">
                    Batch Alpha
                  </span>
                  <span className="text-[11px] flex items-center gap-1 font-bold text-neutral-900 dark:text-white">
                    <GoogleIcon name="schedule" size={14} />
                    7:00 PM IST
                  </span>
                </div>
                <div className="font-bold text-neutral-900 dark:text-white">Next.js 15 Server Actions Deep Dive</div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">Trainer: Vikram Malhotra</div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span className="text-[10px] font-bold uppercase bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2 py-0.5 rounded-md">
                    Office Hours
                  </span>
                  <span className="text-[11px] flex items-center gap-1 font-bold text-neutral-900 dark:text-white">
                    <GoogleIcon name="schedule" size={14} />
                    Tomorrow
                  </span>
                </div>
                <div className="font-bold text-neutral-900 dark:text-white">Firebase Security Rules Q&amp;A</div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">Trainer: Ananya Iyer</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Curriculum Completion</CardTitle>
              <CardDescription>Milestones achieved across enrolled courses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProgressBar value={certCount > 0 ? 80 : 40} showLabel color="purple" size="md" />
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                Complete your lesson checkpoints, finish project capstones, and earn verifiable certificates to build your verified engineering portfolio.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}

