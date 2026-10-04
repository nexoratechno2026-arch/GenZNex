"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";

interface StudentAttendanceItem {
  id: string;
  name: string;
  email: string;
  status: "present" | "late" | "absent";
}

const DEFAULT_ROSTER: StudentAttendanceItem[] = [
  { id: "std_01", name: "Rohan Sharma", email: "rohan.s@genznex.in", status: "present" },
  { id: "std_02", name: "Priya Patel", email: "priya.p@genznex.in", status: "present" },
  { id: "std_03", name: "Aarav Mehta", email: "aarav.m@genznex.in", status: "late" },
  { id: "std_04", name: "Sneha Reddy", email: "sneha.r@genznex.in", status: "present" },
  { id: "std_05", name: "Ankit Verma", email: "ankit.v@genznex.in", status: "absent" },
  { id: "std_06", name: "Kavita Nair", email: "kavita.n@genznex.in", status: "present" },
];

export default function TrainerDashboardPage() {
  const { userProfile, user } = useAuth();
  const trainerName = userProfile?.displayName || user?.displayName || "Trainer";

  // Attendance State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [roster, setRoster] = useState<StudentAttendanceItem[]>(DEFAULT_ROSTER);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAttendanceSavedToday, setIsAttendanceSavedToday] = useState(false);
  const [attendanceLoggedCount, setAttendanceLoggedCount] = useState(14);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Restore saved attendance if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem("genznex_trainer_attendance_batch_alpha_today");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.roster && Array.isArray(parsed.roster)) {
          setRoster(parsed.roster);
          setIsAttendanceSavedToday(true);
          setAttendanceLoggedCount(15);
          if (parsed.notes) setSessionNotes(parsed.notes);
        }
      }
    } catch {}
  }, []);

  const handleStatusChange = (id: string, newStatus: "present" | "late" | "absent") => {
    setRoster((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const handleMarkAll = (status: "present" | "absent") => {
    setRoster((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    // Simulate brief network latency for realism
    await new Promise((r) => setTimeout(r, 600));

    const payload = {
      batchId: "batch_alpha_2026",
      batchName: "Batch Alpha 2026 (Live)",
      topic: "Event-Driven Cloud Functions",
      date: new Date().toISOString(),
      roster,
      notes: sessionNotes,
      savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    try {
      localStorage.setItem("genznex_trainer_attendance_batch_alpha_today", JSON.stringify(payload));
    } catch {}

    setIsSaving(false);
    setIsAttendanceSavedToday(true);
    setAttendanceLoggedCount(15);
    setIsAttendanceModalOpen(false);

    const presentCount = roster.filter((s) => s.status === "present").length;
    const lateCount = roster.filter((s) => s.status === "late").length;
    setToastMessage(`Attendance logged! ${presentCount} present, ${lateCount} late.`);

    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const presentCount = roster.filter((s) => s.status === "present").length;
  const lateCount = roster.filter((s) => s.status === "late").length;
  const absentCount = roster.filter((s) => s.status === "absent").length;
  const attendancePercent = Math.round(((presentCount + lateCount * 0.5) / roster.length) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xl border border-neutral-700 dark:border-neutral-200 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <GoogleIcon name="check_circle" size={20} className="text-emerald-500" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 text-neutral-400 hover:text-white dark:hover:text-black cursor-pointer"
          >
            <GoogleIcon name="close" size={16} />
          </button>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-900 dark:text-white shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 mb-2">
            <GoogleIcon name="school" size={14} />
            <span>Trainer Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Welcome back, {trainerName}!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
            Manage your courses, track cohort progress, and review student capstone submissions.
          </p>
        </div>

        <Link href="/trainer/courses/new">
          <Button variant="primary" size="sm" leftIcon={<GoogleIcon name="add" size={16} />}>
            New Course Draft
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1 font-bold">
            <span>My Courses</span>
            <GoogleIcon name="menu_book" size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white">3</div>
          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 font-medium">All published</div>
        </Card>

        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1 font-bold">
            <span>Cohort Students</span>
            <GoogleIcon name="groups" size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white">128</div>
          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 font-medium">Across 2 batches</div>
        </Card>

        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1 font-bold">
            <span>Pending Reviews</span>
            <GoogleIcon name="folder_zip" size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white">6</div>
          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 font-medium">Capstone submissions</div>
        </Card>

        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1 font-bold">
            <span>Attendance Logged</span>
            <GoogleIcon name="calendar_today" size={18} className="text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white">{attendanceLoggedCount}</div>
          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
            {isAttendanceSavedToday ? "Today recorded" : "Session 15 pending"}
          </div>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Course Studio Shell */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Course Studio &amp; Curriculum</CardTitle>
                <CardDescription>
                  Structured modules, signed video lessons, and interactive resources.
                </CardDescription>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1 rounded-md text-neutral-800 dark:text-neutral-200">
                Active Curriculum
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-neutral-900 dark:text-white text-sm">Full-Stack AI Engineer Bootcamp</div>
                  <div className="text-neutral-600 dark:text-neutral-400 mt-0.5 font-medium">64 Lessons • 5 Projects • ₹4,999</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                    Published
                  </span>
                  <Link href="/trainer/courses">
                    <Button variant="outline" size="sm">
                      Edit Curriculum
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-neutral-900 dark:text-white text-sm">Next.js 15 &amp; Cloud Functions Mastery</div>
                  <div className="text-neutral-600 dark:text-neutral-400 mt-0.5 font-medium">42 Lessons • 3 Projects • ₹3,499</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                    Published
                  </span>
                  <Link href="/trainer/courses">
                    <Button variant="outline" size="sm">
                      Edit Curriculum
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Reviews Shell */}
          <Card className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Pending Capstone Reviews</CardTitle>
              <CardDescription>Student code submissions awaiting grade and feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-neutral-900 dark:text-white">Rohan K. - AI Agent Workflow Engine</div>
                  <div className="text-neutral-600 dark:text-neutral-400 mt-0.5 font-medium">Submitted 2 hours ago • GitHub Repo attached</div>
                </div>
                <Link href="/trainer/grading">
                  <Button variant="secondary" size="sm" rightIcon={<GoogleIcon name="open_in_new" size={14} />}>
                    Review Code
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Attendance & Batch Actions */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GoogleIcon name="how_to_reg" size={18} className="text-violet-600 dark:text-violet-400" />
                <span>Batch Attendance Manager</span>
              </CardTitle>
              <CardDescription>Record daily cohort presence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-neutral-900 dark:text-white text-sm">Batch Alpha 2026 (Live)</div>
                  {isAttendanceSavedToday ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                      <GoogleIcon name="check" size={12} />
                      Recorded Today
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      Pending Entry
                    </span>
                  )}
                </div>

                <div className="text-neutral-600 dark:text-neutral-400 font-medium">
                  <strong>Topic:</strong> Event-Driven Cloud Functions
                </div>

                {isAttendanceSavedToday ? (
                  <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] space-y-1">
                    <div className="font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                      <span>Today&apos;s Presence:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{attendancePercent}%</span>
                    </div>
                    <div className="text-neutral-500 flex gap-2">
                      <span>✓ {presentCount} Present</span>
                      <span>•</span>
                      <span>⏳ {lateCount} Late</span>
                      <span>•</span>
                      <span>✗ {absentCount} Absent</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-500">
                    6 cohort students scheduled for today&apos;s live sprint.
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <Button
                    id="mark-attendance-trigger-btn"
                    onClick={() => setIsAttendanceModalOpen(true)}
                    variant={isAttendanceSavedToday ? "secondary" : "primary"}
                    size="sm"
                    fullWidth
                    leftIcon={<GoogleIcon name={isAttendanceSavedToday ? "edit" : "check_circle"} size={16} />}
                  >
                    {isAttendanceSavedToday ? "Update Today's Attendance" : "Mark Today's Attendance"}
                  </Button>

                  <Link href="/trainer/batches" className="block w-full">
                    <Button variant="outline" size="sm" fullWidth leftIcon={<GoogleIcon name="groups" size={16} />}>
                      View All Batches &amp; Rosters
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Attendance Modal */}
      {isAttendanceModalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <GoogleIcon name="how_to_reg" size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Daily Cohort Attendance Roster
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Batch Alpha 2026 • Live Session #15 (Event-Driven Cloud Functions)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAttendanceModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close Modal"
              >
                <GoogleIcon name="close" size={20} />
              </button>
            </div>

            {/* Attendance Summary & Fast Actions */}
            <div className="px-5 sm:px-6 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3 font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {presentCount} Present
                </span>
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {lateCount} Late
                </span>
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {absentCount} Absent
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll("present")}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition cursor-pointer"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll("absent")}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Student Roster Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {roster.map((student) => (
                <div
                  key={student.id}
                  className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {student.email}
                      </div>
                    </div>
                  </div>

                  {/* 3-State Toggle */}
                  <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 self-start sm:self-center gap-1 border border-neutral-200 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "present")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        student.status === "present"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <GoogleIcon name="check" size={14} />
                      <span>Present</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "late")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        student.status === "late"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <GoogleIcon name="schedule" size={14} />
                      <span>Late</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, "absent")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        student.status === "absent"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <GoogleIcon name="close" size={14} />
                      <span>Absent</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Optional Session Notes */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  Session Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Covered Pub/Sub triggers; Aarav joined 15m late with prior notice"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:border-violet-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-500 font-medium">
                Rate: <strong className="text-neutral-900 dark:text-white">{attendancePercent}%</strong> presence
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAttendanceModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  id="submit-attendance-btn"
                  variant="primary"
                  size="sm"
                  loading={isSaving}
                  onClick={handleSaveAttendance}
                  leftIcon={<GoogleIcon name="save" size={16} />}
                >
                  Save &amp; Record Attendance
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
