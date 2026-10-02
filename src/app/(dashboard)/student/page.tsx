"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Calendar, 
  Award, 
  Briefcase, 
  Sparkles, 
  ArrowUpRight, 
  Clock, 
  Play, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp
} from "lucide-react";
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
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-card border border-purple-500/30 bg-gradient-to-r from-purple-950/30 to-indigo-950/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 mb-2 border border-purple-500/30">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Student Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sup, {studentName}! 🚀
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Track your bootcamp journey, resume live lessons, and get placement ready.
          </p>
        </div>

        <Link href="/courses">
          <Button variant="primary" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
            Explore Programs
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card glow="cyan" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Enrolled Courses</span>
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{enrollments.length}</div>
          <div className="text-[11px] text-cyan-400 mt-1">
            {enrollments.length > 0 ? "Active learning" : "Ready to enroll"}
          </div>
        </Card>

        <Card glow="purple" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Avg Completion</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {enrollments.length > 0 
              ? `${Math.round(enrollments.reduce((acc, e) => acc + e.progressPercentage, 0) / enrollments.length)}%` 
              : "0%"}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Across all tracks</div>
        </Card>

        <Card glow="emerald" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Certificates</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{certCount}</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            {certCount > 0 ? (
              <Link href="/student/certificates" className="hover:underline flex items-center gap-1">
                View earned <ChevronRight className="w-3 h-3" />
              </Link>
            ) : (
              "Complete tracks to earn"
            )}
          </div>
        </Card>

        <Card glow="none" className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Interviews</span>
            <Briefcase className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">0</div>
          <div className="text-[11px] text-amber-400 mt-1">Placement support</div>
        </Card>
      </div>

      {/* Continue Where You Left Off Hero Card */}
      {activeEnrollment && activeEnrollment.course && (
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-950/40 via-purple-950/20 to-zinc-950/80 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  <Play className="w-3 h-3 fill-current" /> Continue Where You Left Off
                </span>
                <span className="text-xs text-zinc-400">
                  {activeEnrollment.progressPercentage}% Completed
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {activeEnrollment.course.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 mt-1 line-clamp-1">
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
                  className="shadow-xl shadow-violet-600/30 group"
                  leftIcon={<Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />}
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Active Programs</CardTitle>
                <CardDescription>
                  Your enrolled tracks, modular checkpoints, and certificates.
                </CardDescription>
              </div>
              <span className="text-xs bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30">
                {enrollments.length} Active
              </span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 rounded-xl bg-zinc-900 animate-pulse" />
                  ))}
                </div>
              ) : enrollments.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-gray-800 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-gray-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No active enrollments yet</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
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
                        className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:border-violet-500/40 p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <img 
                            src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=120&fit=crop"} 
                            alt={course.title}
                            className="w-20 h-14 object-cover rounded-lg shrink-0 border border-zinc-700/50"
                          />
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white line-clamp-1">{course.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-zinc-400">
                              <span>{course.lessonCount || 0} Lessons</span>
                              <span>•</span>
                              <span className="text-emerald-400 font-medium">
                                {enroll.progressPercentage}% Completed
                              </span>
                            </div>
                            <div className="w-40 pt-1">
                              <ProgressBar 
                                value={enroll.progressPercentage} 
                                color={enroll.progressPercentage === 100 ? "emerald" : "purple"} 
                                size="sm" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {enroll.progressPercentage === 100 ? (
                            <Link href="/student/certificates">
                              <Button variant="outline" size="sm" leftIcon={<Award className="w-3.5 h-3.5 text-amber-400" />}>
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
                            <Button variant="secondary" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
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
          <Card>
            <CardHeader>
              <CardTitle>Gen Z Career Accelerators</CardTitle>
              <CardDescription>
                Exclusive toolkits, resume templates, and mock technical assessments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Link 
                  href="/student/certificates"
                  className="p-3.5 rounded-xl bg-[#0f111d] border border-gray-800/80 hover:border-violet-500/40 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <div>
                      <strong className="text-white block">Official Credentials</strong>
                      <span className="text-zinc-400 text-[11px]">Verifiable certificates & LinkedIn export</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </Link>

                <Link 
                  href="/courses"
                  className="p-3.5 rounded-xl bg-[#0f111d] border border-gray-800/80 hover:border-violet-500/40 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <div>
                      <strong className="text-white block">New Bootcamps</strong>
                      <span className="text-zinc-400 text-[11px]">Explore GenAI and DevOps sprints</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Schedule & Readiness */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Sessions</CardTitle>
              <CardDescription>Live batch classes &amp; office hours.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-xl bg-[#121422] border border-gray-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                    Batch Alpha
                  </span>
                  <span className="text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    7:00 PM IST
                  </span>
                </div>
                <div className="font-bold text-white">Next.js 15 Server Actions Deep Dive</div>
                <div className="text-[11px] text-gray-400">Trainer: Vikram Malhotra</div>
              </div>

              <div className="p-3 rounded-xl bg-[#121422] border border-gray-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                    Office Hours
                  </span>
                  <span className="text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Tomorrow
                  </span>
                </div>
                <div className="font-bold text-white">Firebase Security Rules Q&amp;A</div>
                <div className="text-[11px] text-gray-400">Trainer: Ananya Iyer</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Placement Readiness</CardTitle>
              <CardDescription>Profile completion for hiring partners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProgressBar value={certCount > 0 ? 80 : 40} showLabel color="purple" size="md" />
              <p className="text-[11px] text-gray-400">
                Complete your course milestones, pass quizzes, and earn certificates to unlock 100+ hiring partners in Bangalore, Mumbai &amp; Gurgaon.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
