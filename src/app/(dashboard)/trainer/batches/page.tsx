"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ProgramBatchDoc, SessionDoc, BatchEnrollmentDoc } from "@/types/schema";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  Loader2,
  RefreshCcw,
  ChevronRight,
  Plus,
  Video,
} from "lucide-react";

interface BatchWithStats extends ProgramBatchDoc {
  upcomingSession?: SessionDoc;
  sessionCount: number;
}

export default function TrainerBatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const functions = getFunctions(undefined, "us-central1");

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // All batches where this trainer is assigned
        const q = query(
          collection(db, "program_batches"),
          where("trainerIds", "array-contains", user!.uid),
          orderBy("startDate", "desc")
        );
        const snap = await getDocs(q);

        const enriched: BatchWithStats[] = [];
        const today = new Date().toISOString().split("T")[0];

        for (const d of snap.docs) {
          const batch = { id: d.id, ...d.data() } as ProgramBatchDoc;

          let upcomingSession: SessionDoc | undefined;
          let sessionCount = 0;

          try {
            const sessQ = query(
              collection(db, "sessions"),
              where("batchId", "==", batch.id),
              where("status", "==", "scheduled"),
              where("date", ">=", today),
              orderBy("date"),
              orderBy("startTimeIST")
            );
            const sessSnap = await getDocs(sessQ);
            sessionCount = sessSnap.size;
            if (!sessSnap.empty) {
              upcomingSession = { id: sessSnap.docs[0].id, ...sessSnap.docs[0].data() } as SessionDoc;
            }
          } catch {}

          enriched.push({ ...batch, upcomingSession, sessionCount });
        }

        if (mounted) {
          setBatches(enriched);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading batches:", err);
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [user]);

  const activeCount = batches.filter((b) => ["open", "ongoing"].includes(b.status)).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">My Batches</h1>
          <p className="text-sm text-gray-400 mt-1">{activeCount} active batch{activeCount !== 1 ? "es" : ""} assigned to you</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <h3 className="text-white font-bold">No batches assigned</h3>
            <p className="text-gray-400 text-sm mt-1">Contact an admin to be assigned to a batch.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {batches.map((batch) => (
            <BatchManagementCard key={batch.id} batch={batch} />
          ))}
        </div>
      )}
    </div>
  );
}

function BatchManagementCard({ batch }: { batch: BatchWithStats }) {
  const capacityPercent = batch.capacity > 0 ? Math.round((batch.enrolledCount / batch.capacity) * 100) : 0;

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    open: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    full: "bg-red-500/10 text-red-300 border-red-500/20",
    ongoing: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    completed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    cancelled: "bg-red-900/20 text-red-400 border-red-800/30",
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white">{batch.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{batch.programTitle}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColors[batch.status] || ""}`}>
          {batch.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Enrolled</p>
          <p className="text-xl font-black text-white">{batch.enrolledCount}<span className="text-sm text-gray-500">/{batch.capacity}</span></p>
          <ProgressBar value={capacityPercent} color="purple" size="sm" className="mt-2" />
        </div>
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Schedule</p>
          <p className="text-xs font-bold text-white">{batch.weeklySchedule.days.join(", ")}</p>
          <p className="text-xs text-purple-300">{batch.weeklySchedule.timeIST} IST</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-cyan-400" /> {batch.startDate}</span>
        <span className="text-gray-600">→</span>
        <span>{batch.endDate}</span>
        <span className="ml-auto flex items-center gap-1 text-amber-300">
          <AlertTriangle className="w-3 h-3" /> Min. {batch.minAttendancePercent}% attendance
        </span>
      </div>

      {batch.upcomingSession && (
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Next Session</p>
          <p className="text-xs font-bold text-white">{batch.upcomingSession.title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
            <span><Calendar className="w-3 h-3 inline mr-0.5 text-cyan-400" />{batch.upcomingSession.date}</span>
            <span><Clock className="w-3 h-3 inline mr-0.5 text-purple-400" />{batch.upcomingSession.startTimeIST} IST</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link href={`/dashboard/trainer/batches/${batch.id}/attendance`}>
          <Button variant="outline" size="sm" fullWidth leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}>
            Attendance
          </Button>
        </Link>
        <Link href={`/dashboard/trainer/batches/${batch.id}/sessions`}>
          <Button variant="secondary" size="sm" fullWidth leftIcon={<Video className="w-3.5 h-3.5 text-cyan-400" />}>
            Sessions
          </Button>
        </Link>
      </div>

      <Link href={`/dashboard/trainer/batches/${batch.id}`}>
        <Button variant="outline" size="sm" fullWidth rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
          Manage Batch
        </Button>
      </Link>
    </div>
  );
}
