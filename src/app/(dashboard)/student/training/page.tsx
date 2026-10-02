"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { BatchEnrollmentDoc, ProgramBatchDoc, SessionDoc, ProjectSubmissionDoc } from "@/types/schema";
import {
  Users,
  Calendar,
  Clock,
  PlayCircle,
  BookOpen,
  Award,
  TrendingUp,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Mic,
  Code2,
  FileText,
} from "lucide-react";

interface BatchWithProgram extends BatchEnrollmentDoc {
  batch?: ProgramBatchDoc;
  nextSession?: SessionDoc;
}

export default function StudentTrainingHub() {
  const { user, userProfile } = useAuth();
  const [batchEnrollments, setBatchEnrollments] = useState<BatchWithProgram[]>([]);
  const [mySubmissions, setMySubmissions] = useState<ProjectSubmissionDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // 1. Fetch batch enrollments
        const enrollQ = query(
          collection(db, "batch_enrollments"),
          where("userId", "==", user!.uid),
          where("status", "==", "active")
        );
        const enrollSnap = await getDocs(enrollQ);

        const enriched: BatchWithProgram[] = [];
        for (const e of enrollSnap.docs) {
          const data = e.data() as BatchEnrollmentDoc;
          let batch: ProgramBatchDoc | undefined;
          let nextSession: SessionDoc | undefined;

          try {
            const batchSnap = await getDoc(doc(db, "program_batches", data.batchId));
            if (batchSnap.exists()) {
              batch = { id: batchSnap.id, ...batchSnap.data() } as ProgramBatchDoc;
            }

            // Next session
            const today = new Date().toISOString().split("T")[0];
            const sessQ = query(
              collection(db, "sessions"),
              where("batchId", "==", data.batchId),
              where("status", "==", "scheduled"),
              where("date", ">=", today),
              orderBy("date"),
              orderBy("startTimeIST"),
              limit(1)
            );
            const sessSnap = await getDocs(sessQ);
            if (!sessSnap.empty) {
              nextSession = { id: sessSnap.docs[0].id, ...sessSnap.docs[0].data() } as SessionDoc;
            }
          } catch {}

          enriched.push({ ...data, batch, nextSession });
        }

        // 2. Fetch recent project submissions
        const subQ = query(
          collection(db, "project_submissions"),
          where("userId", "==", user!.uid),
          orderBy("submittedAt", "desc"),
          limit(3)
        );
        const subSnap = await getDocs(subQ);
        const submissions = subSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectSubmissionDoc));

        if (mounted) {
          setBatchEnrollments(enriched);
          setMySubmissions(submissions);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading training hub:", err);
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [user]);

  const activeBatch = batchEnrollments[0];
  const totalBatches = batchEnrollments.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/50 via-indigo-950/30 to-zinc-950/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 mb-3 border border-purple-500/30">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              My Training Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Your Bootcamp Journey 🚀
            </h1>
            <p className="text-sm text-gray-300 mt-1 max-w-lg">
              Live classes, projects, mock interviews, and placement support — all in one place.
            </p>
          </div>
          <Link href="/programs">
            <Button variant="primary" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
              Browse Programs
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-4 h-4 text-cyan-400" />} label="Active Batches" value={totalBatches} color="cyan" />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
          label="Avg Attendance"
          value={`${batchEnrollments.length > 0 ? Math.round(batchEnrollments.reduce((acc, e) => acc + e.attendancePercent, 0) / batchEnrollments.length) : 0}%`}
          color="purple"
        />
        <StatCard icon={<Code2 className="w-4 h-4 text-emerald-400" />} label="Projects" value={mySubmissions.length} color="emerald" />
        <StatCard icon={<Mic className="w-4 h-4 text-amber-400" />} label="Interviews" value={0} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Batches */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Active Batches</CardTitle>
                <CardDescription>Your enrolled bootcamps and tracks</CardDescription>
              </div>
              <Link href="/dashboard/student/batches">
                <span className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-zinc-900 animate-pulse" />)}
                </div>
              ) : batchEnrollments.length === 0 ? (
                <EmptyState
                  icon={<Users className="w-10 h-10 text-gray-600" />}
                  title="No active batch enrollments"
                  description="Join a bootcamp or training program to get started with live classes, projects, and placement support."
                  action={<Link href="/programs"><Button variant="secondary" size="sm">Browse Programs</Button></Link>}
                />
              ) : (
                <div className="space-y-4">
                  {batchEnrollments.map((enroll) => (
                    <BatchCard key={enroll.id} enrollment={enroll} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Submissions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Project Activity</CardTitle>
                <CardDescription>Latest milestone submissions and reviews</CardDescription>
              </div>
              <Link href="/dashboard/student/projects">
                <span className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </CardHeader>
            <CardContent>
              {mySubmissions.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <Code2 className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  No project submissions yet. Your batch trainer will assign projects.
                </div>
              ) : (
                <div className="space-y-3">
                  {mySubmissions.map((sub) => (
                    <SubmissionRow key={sub.id} submission={sub} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Upcoming Session + Placement */}
        <div className="space-y-6">
          {/* Next Session */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next Live Session</CardTitle>
              <CardDescription>Upcoming class for your batch</CardDescription>
            </CardHeader>
            <CardContent>
              {activeBatch?.nextSession ? (
                <NextSessionCard session={activeBatch.nextSession} batchName={activeBatch.batch?.name || ""} />
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  No upcoming sessions scheduled.
                </div>
              )}
              <Link href="/dashboard/student/schedule" className="block mt-3">
                <Button variant="outline" size="sm" fullWidth rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                  Full Schedule
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: <Mic className="w-4 h-4 text-purple-400" />, label: "Book Mock Interview", href: "/dashboard/student/interviews" },
                { icon: <FileText className="w-4 h-4 text-cyan-400" />, label: "Build Resume", href: "/dashboard/student/placement/resume" },
                { icon: <Briefcase className="w-4 h-4 text-emerald-400" />, label: "View Job Board", href: "/jobs" },
                { icon: <Award className="w-4 h-4 text-amber-400" />, label: "My Certificates", href: "/dashboard/student/certificates" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/40 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    {action.icon}
                    <span className="text-xs font-semibold text-white">{action.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const borderMap: Record<string, string> = {
    cyan: "border-cyan-500/20 hover:border-cyan-500/40",
    purple: "border-purple-500/20 hover:border-purple-500/40",
    emerald: "border-emerald-500/20 hover:border-emerald-500/40",
    amber: "border-amber-500/20 hover:border-amber-500/40",
  };
  return (
    <div className={`p-4 rounded-2xl bg-zinc-900/50 border ${borderMap[color]} transition-colors`}>
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function BatchCard({ enrollment }: { enrollment: BatchWithProgram }) {
  const { batch, attendancePercent } = enrollment;
  const isLowAttendance = attendancePercent < (batch?.minAttendancePercent || 75) && attendancePercent > 0;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:border-violet-500/40 p-4 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-bold text-white">{batch?.name || "Loading..."}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{batch?.programTitle}</p>
        </div>
        <BatchStatusPill status={batch?.status || "upcoming"} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <InfoChip label="Enrolled" value={`${batch?.enrolledCount || 0}/${batch?.capacity || 0}`} />
        <InfoChip label="Ends" value={batch?.endDate || "—"} />
        <InfoChip
          label="Attendance"
          value={`${attendancePercent}%`}
          warn={isLowAttendance}
        />
      </div>

      {isLowAttendance && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Attendance below minimum ({batch?.minAttendancePercent}%). Attend more sessions.</span>
        </div>
      )}

      <div className="mb-3">
        <ProgressBar value={attendancePercent} color={isLowAttendance ? "amber" : "emerald"} size="sm" showLabel />
      </div>

      <Link href={`/dashboard/student/batches/${enrollment.batchId}`}>
        <Button variant="secondary" size="sm" fullWidth rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
          View Batch Details
        </Button>
      </Link>
    </div>
  );
}

function NextSessionCard({ session, batchName }: { session: SessionDoc; batchName: string }) {
  const now = new Date();
  const sessionDate = new Date(`${session.date}T${session.startTimeIST}:00+05:30`);
  const isToday = session.date === now.toISOString().split("T")[0];
  const diffMs = sessionDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);

  let countdown = "";
  if (diffMs < 0) countdown = "Session in progress or ended";
  else if (diffHours < 1) countdown = `In ${diffMins}m`;
  else if (diffHours < 24) countdown = `In ${diffHours}h ${diffMins}m`;
  else countdown = `${Math.ceil(diffHours / 24)} days away`;

  return (
    <div className="p-4 rounded-xl bg-[#0d1025] border border-indigo-500/30 space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${isToday ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"}`}>
          {batchName}
        </span>
        <span className="text-[10px] text-cyan-400 font-bold">{countdown}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-white">{session.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{session.topic}</p>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-gray-400">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {session.date}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.startTimeIST} IST</span>
        <span>{session.durationMinutes}min</span>
      </div>
    </div>
  );
}

function SubmissionRow({ submission }: { submission: ProjectSubmissionDoc }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    submitted: { label: "Submitted", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    under_review: { label: "Under Review", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    changes_requested: { label: "Changes Needed", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
    approved: { label: "Approved ✓", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    rejected: { label: "Rejected", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  };
  const cfg = statusConfig[submission.status] || statusConfig["submitted"];

  return (
    <Link href={`/dashboard/student/projects/${submission.id}`}>
      <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 hover:border-purple-500/30 bg-zinc-900/40 transition-all cursor-pointer">
        <div className="flex items-center gap-3">
          <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-white">Milestone: {submission.milestoneId}</p>
            <p className="text-[11px] text-gray-400">v{submission.version} · Score: {submission.totalScore}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
      </div>
    </Link>
  );
}

function BatchStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    upcoming: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    open: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    full: "bg-red-500/10 text-red-300 border-red-500/30",
    ongoing: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    completed: "bg-gray-500/10 text-gray-400 border-gray-500/30",
    cancelled: "bg-red-900/20 text-red-400 border-red-500/20",
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[status] || map["upcoming"]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function InfoChip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-1.5 text-center">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={`text-xs font-bold ${warn ? "text-amber-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="p-8 rounded-xl border border-dashed border-gray-800 text-center space-y-3">
      <div className="flex justify-center">{icon}</div>
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <p className="text-xs text-gray-400 max-w-sm mx-auto">{description}</p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
