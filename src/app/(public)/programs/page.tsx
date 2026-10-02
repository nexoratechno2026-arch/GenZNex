"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { TrainingProgramDoc } from "@/types/schema";
import ProgramsCatalogClient from "./_ProgramsCatalogClient";
import { Loader2 } from "lucide-react";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<TrainingProgramDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "training_programs"),
          where("status", "==", "published"),
          orderBy("isFeatured", "desc"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const data: TrainingProgramDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<TrainingProgramDoc, "id">),
        }));
        setPrograms(data);
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
      </div>
    );
  }

  return <ProgramsCatalogClient programs={programs} />;
}
