"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import type { ProgramBatchDoc, SessionDoc } from "@/types/schema";

interface BatchWithStats extends ProgramBatchDoc {
  upcomingSession?: SessionDoc;
  sessionCount: number;
}

export default function TrainerBatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
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
    <div className="space-y-8 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">My Batches</h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 font-medium">{activeCount} active batch{activeCount !== 1 ? "es" : ""} assigned to you</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <GoogleIcon name="progress_activity" size={32} className="animate-spin text-black dark:text-white" />
        </div>
      ) : batches.length === 0 ? (
        <Card className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800">
          <CardContent className="py-20 text-center">
            <GoogleIcon name="groups" size={48} className="text-neutral-400 mx-auto mb-3" />
            <h3 className="text-black dark:text-white font-bold">No batches assigned</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs mt-1 font-medium">Contact an admin to be assigned to a cohort batch.</p>
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

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black hover:border-black dark:hover:border-white transition-all p-5 space-y-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-black dark:text-white">{batch.name}</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-medium">{batch.programTitle}</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
          {batch.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 text-center">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-0.5 font-medium">Enrolled</p>
          <p className="text-xl font-black text-black dark:text-white">{batch.enrolledCount}<span className="text-sm text-neutral-500">/{batch.capacity}</span></p>
          <ProgressBar value={capacityPercent} color="purple" size="sm" className="mt-2" />
        </div>
        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 text-center">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-0.5 font-medium">Schedule</p>
          <p className="text-xs font-bold text-black dark:text-white">{batch.weeklySchedule.days.join(", ")}</p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">{batch.weeklySchedule.timeIST} IST</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
        <span className="flex items-center gap-1"><GoogleIcon name="calendar_today" size={14} /> {batch.startDate}</span>
        <span>→</span>
        <span>{batch.endDate}</span>
        <span className="ml-auto font-bold text-black dark:text-white">
          Min. {batch.minAttendancePercent}% attendance
        </span>
      </div>

      {batch.upcomingSession && (
        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3">
          <p className="text-[10px] text-neutral-500 mb-1 uppercase tracking-wider font-bold">Next Session</p>
          <p className="text-xs font-bold text-black dark:text-white">{batch.upcomingSession.title}</p>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 flex items-center gap-2 font-medium">
            <span><GoogleIcon name="calendar_today" size={12} className="inline mr-0.5" />{batch.upcomingSession.date}</span>
            <span><GoogleIcon name="schedule" size={12} className="inline mr-0.5" />{batch.upcomingSession.startTimeIST} IST</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link href={`/trainer/batches/${batch.id}/attendance`}>
          <Button variant="outline" size="sm" fullWidth leftIcon={<GoogleIcon name="check_circle" size={14} />}>
            Attendance
          </Button>
        </Link>
        <Link href={`/trainer/batches/${batch.id}/sessions`}>
          <Button variant="secondary" size="sm" fullWidth leftIcon={<GoogleIcon name="videocam" size={14} />}>
            Sessions
          </Button>
        </Link>
      </div>
    </div>
  );
}
