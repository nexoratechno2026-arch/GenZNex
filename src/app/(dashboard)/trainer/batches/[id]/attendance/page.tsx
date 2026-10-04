"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface SessionAttendanceRecord {
  sessionId: string;
  sessionNumber: number;
  title: string;
  date: string;
  presentCount: number;
  totalStudents: number;
  status: "completed" | "scheduled";
}

const HISTORICAL_SESSIONS: SessionAttendanceRecord[] = [
  { sessionId: "s15", sessionNumber: 15, title: "Event-Driven Cloud Functions", date: "Today", presentCount: 5, totalStudents: 6, status: "completed" },
  { sessionId: "s14", sessionNumber: 14, title: "Firestore Security Rules Hardening", date: "Oct 1, 2026", presentCount: 6, totalStudents: 6, status: "completed" },
  { sessionId: "s13", sessionNumber: 13, title: "Next.js 15 Server Actions & Caching", date: "Sep 28, 2026", presentCount: 5, totalStudents: 6, status: "completed" },
  { sessionId: "s12", sessionNumber: 12, title: "Razorpay Server-Side Payment Verification", date: "Sep 25, 2026", presentCount: 6, totalStudents: 6, status: "completed" },
  { sessionId: "s11", sessionNumber: 11, title: "Zod Schema Validation & Middleware", date: "Sep 22, 2026", presentCount: 4, totalStudents: 6, status: "completed" },
];

export default function BatchAttendanceDetailPage() {
  const params = useParams();
  const batchId = (params?.id as string) || "batch_alpha_2026";
  const [downloading, setDownloading] = useState(false);

  const handleExportCsv = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert("Attendance CSV report generated and downloaded.");
    }, 600);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Back Link */}
      <Link
        href="/trainer/batches"
        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
      >
        <GoogleIcon name="arrow_back" size={16} />
        <span>Back to Cohort Batches</span>
      </Link>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 mb-2">
            <GoogleIcon name="how_to_reg" size={14} />
            <span>Cohort Attendance Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Batch Alpha 2026 Attendance
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
            Batch ID: <span className="font-mono text-neutral-900 dark:text-white">{batchId}</span> • 15 Sessions Recorded • Min. 75% Attendance Required
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            loading={downloading}
            leftIcon={<GoogleIcon name="download" size={16} />}
          >
            Export CSV
          </Button>
          <Link href="/trainer">
            <Button variant="primary" size="sm" leftIcon={<GoogleIcon name="dashboard" size={16} />}>
              Trainer Studio
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-neutral-500 block mb-1">Total Sessions</span>
          <span className="text-2xl font-black text-neutral-900 dark:text-white">15</span>
          <span className="text-[11px] text-neutral-400 block mt-1">Syllabus active</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-neutral-500 block mb-1">Average Attendance</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">89%</span>
          <span className="text-[11px] text-neutral-400 block mt-1">Above 75% threshold</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-neutral-500 block mb-1">Active Students</span>
          <span className="text-2xl font-black text-neutral-900 dark:text-white">6</span>
          <span className="text-[11px] text-neutral-400 block mt-1">Enrolled in cohort</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-neutral-500 block mb-1">Next Session</span>
          <span className="text-lg font-extrabold text-violet-600 dark:text-violet-400 truncate block">Monday 7 PM</span>
          <span className="text-[11px] text-neutral-400 block mt-1">Kafka &amp; PubSub Architecture</span>
        </Card>
      </div>

      {/* Historical Sessions Table */}
      <Card className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Session History Log</CardTitle>
          <CardDescription>All live sprint sessions conducted and attendance tallies.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Session Topic</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Turnout</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {HISTORICAL_SESSIONS.map((sess) => {
                  const rate = Math.round((sess.presentCount / sess.totalStudents) * 100);
                  return (
                    <tr key={sess.sessionId} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-500">#{sess.sessionNumber}</td>
                      <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">{sess.title}</td>
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{sess.date}</td>
                      <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">{sess.presentCount} / {sess.totalStudents} students</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{rate}%</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {sess.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
