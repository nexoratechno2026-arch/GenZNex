"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { SessionDoc, BatchEnrollmentDoc } from "@/types/schema";
import {
  Calendar,
  Clock,
  Video,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface SessionWithBatch extends SessionDoc {
  batchName?: string;
}

export default function StudentSchedulePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string>("");
  const functions = getFunctions(undefined, "us-central1");

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    async function loadSessions() {
      setLoading(true);
      try {
        // Get enrolled batch IDs
        const enrollQ = query(
          collection(db, "batch_enrollments"),
          where("userId", "==", user!.uid),
          where("status", "==", "active")
        );
        const enrollSnap = await getDocs(enrollQ);
        const enrollments = enrollSnap.docs.map((d) => d.data() as BatchEnrollmentDoc);

        if (enrollments.length === 0) {
          if (mounted) { setSessions([]); setLoading(false); }
          return;
        }

        // Fetch sessions for all enrolled batches
        const allSessions: SessionWithBatch[] = [];
        for (const enrollment of enrollments) {
          const sessQ = query(
            collection(db, "sessions"),
            where("batchId", "==", enrollment.batchId),
            orderBy("date"),
            orderBy("startTimeIST")
          );
          const sessSnap = await getDocs(sessQ);
          for (const d of sessSnap.docs) {
            allSessions.push({
              id: d.id,
              ...d.data(),
              batchName: enrollment.batchId, // We'll enrich this later
            } as SessionWithBatch);
          }
        }

        // Sort by date
        allSessions.sort((a, b) => {
          const da = `${a.date}T${a.startTimeIST}`;
          const db2 = `${b.date}T${b.startTimeIST}`;
          return da.localeCompare(db2);
        });

        if (mounted) { setSessions(allSessions); setLoading(false); }
      } catch (err) {
        console.error("Error loading sessions:", err);
        if (mounted) setLoading(false);
      }
    }

    loadSessions();
    return () => { mounted = false; };
  }, [user]);

  async function handleJoin(sessionId: string) {
    setJoiningSessionId(sessionId);
    setJoinError("");
    try {
      const fn = httpsCallable(functions, "getSessionJoinLink");
      const result = await fn({ sessionId }) as { data: { joinLink: string } };
      window.open(result.data.joinLink, "_blank");
    } catch (err: any) {
      setJoinError(err.message || "Failed to get join link.");
    } finally {
      setJoiningSessionId(null);
    }
  }

  function exportICS(session: SessionDoc) {
    const startDT = `${session.date.replace(/-/g, "")}T${session.startTimeIST.replace(":", "")}00`;
    const endMin = parseInt(session.startTimeIST.split(":")[1]) + session.durationMinutes;
    const endHour = parseInt(session.startTimeIST.split(":")[0]) + Math.floor(endMin / 60);
    const endDT = `${session.date.replace(/-/g, "")}T${String(endHour).padStart(2, "0")}${String(endMin % 60).padStart(2, "0")}00`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GenZNex//Training//EN",
      "BEGIN:VEVENT",
      `DTSTART:${startDT}`,
      `DTEND:${endDT}`,
      `SUMMARY:${session.title}`,
      `DESCRIPTION:${session.topic}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${session.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = sessions.filter((s) => s.date >= today && s.status !== "cancelled" && s.status !== "completed");
  const past = sessions.filter((s) => s.date < today || s.status === "completed");

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">My Schedule</h1>
          <p className="text-sm text-gray-400 mt-1">Live class schedule across all your enrolled batches</p>
        </div>
        <Link href="/dashboard/student/training">
          <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}>
            Training Hub
          </Button>
        </Link>
      </div>

      {joinError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {joinError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <h3 className="text-white font-bold">No sessions yet</h3>
            <p className="text-gray-400 text-sm mt-1">Your trainer will schedule sessions once the batch begins.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Sessions */}
          {upcoming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Upcoming Sessions ({upcoming.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcoming.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isUpcoming
                    onJoin={() => handleJoin(session.id)}
                    onExportICS={() => exportICS(session)}
                    isJoining={joiningSessionId === session.id}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Past Sessions */}
          {past.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Past Sessions ({past.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {past.slice(0, 10).map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isUpcoming={false}
                    onJoin={() => handleJoin(session.id)}
                    onExportICS={() => exportICS(session)}
                    isJoining={joiningSessionId === session.id}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  isUpcoming,
  onJoin,
  onExportICS,
  isJoining,
}: {
  session: SessionWithBatch;
  isUpcoming: boolean;
  onJoin: () => void;
  onExportICS: () => void;
  isJoining: boolean;
}) {
  const now = new Date();
  const sessionDateTime = new Date(`${session.date}T${session.startTimeIST}:00+05:30`);
  const sessionEndTime = new Date(sessionDateTime.getTime() + session.durationMinutes * 60 * 1000);
  const windowOpenTime = new Date(sessionDateTime.getTime() - 15 * 60 * 1000);

  const isLive = now >= windowOpenTime && now <= sessionEndTime;
  const isEnded = now > sessionEndTime;
  const hasRecording = !!(session.recordingLink || session.recordingVideoId);

  const statusConfig = {
    scheduled: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    live: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    completed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    rescheduled: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  };
  const statusLabel = session.status === "completed" ? (hasRecording ? "Recording Available" : "Completed") : session.status;

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isLive
        ? "border-emerald-500/40 bg-emerald-950/20"
        : session.status === "cancelled"
        ? "border-red-900/30 bg-red-950/10 opacity-60"
        : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> LIVE NOW
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusConfig[session.status as keyof typeof statusConfig] || statusConfig["scheduled"]}`}>
              {statusLabel}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">{session.meetingProvider.replace("_", " ")}</span>
          </div>
          <h4 className="text-sm font-bold text-white">{session.title}</h4>
          <p className="text-xs text-gray-400">{session.topic}</p>
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {session.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.startTimeIST} IST</span>
            <span>{session.durationMinutes}min</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {session.status !== "cancelled" && (
            <button
              onClick={onExportICS}
              title="Add to Calendar"
              className="p-2 rounded-lg border border-zinc-700 hover:border-purple-500/40 text-gray-400 hover:text-purple-400 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {hasRecording && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Video className="w-3.5 h-3.5 text-cyan-400" />}
              onClick={() => session.recordingLink && window.open(session.recordingLink, "_blank")}
            >
              Recording
            </Button>
          )}

          {(isLive || (isUpcoming && !isEnded && session.status === "scheduled")) && (
            <Button
              variant={isLive ? "primary" : "outline"}
              size="sm"
              leftIcon={isJoining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
              onClick={onJoin}
              disabled={isJoining}
            >
              {isLive ? "Join Now" : "Get Link"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
