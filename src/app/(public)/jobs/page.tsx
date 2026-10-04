"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { httpsCallable } from "firebase/functions";
import type { JobDocV2, JobApplicationDoc } from "@/types/schema";
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Search,
  Loader2,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export default function JobBoardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobDocV2[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string>("");
  const [applySuccess, setApplySuccess] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const q = query(
          collection(db, "jobs"),
          where("status", "==", "active"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const jobList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobDocV2));

        let appList: JobApplicationDoc[] = [];
        if (user) {
          const appQ = query(
            collection(db, "job_applications"),
            where("studentId", "==", user.uid)
          );
          const appSnap = await getDocs(appQ);
          appList = appSnap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplicationDoc));
        }

        if (mounted) {
          setJobs(jobList);
          setMyApplications(appList);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  async function applyToJob(job: JobDocV2) {
    if (!user) return;
    setApplyingJobId(job.id);
    setApplyError("");
    setApplySuccess("");

    try {
      const fn = httpsCallable(functions, "applyToJob");
      await fn({ jobId: job.id });
      setApplySuccess(`Successfully applied to ${job.title}!`);
      setMyApplications((prev) => [
        ...prev,
        {
          jobId: job.id,
          status: "applied",
          studentId: user.uid,
          id: job.id,
          appliedAt: new Date(),
          updatedAt: new Date(),
          studentName: "",
          statusHistory: [],
        },
      ]);
    } catch (err: any) {
      setApplyError(err.message || "Application failed. Please try again.");
    } finally {
      setApplyingJobId(null);
    }
  }

  function hasApplied(jobId: string) {
    return myApplications.some((app) => app.jobId === jobId);
  }

  const filtered = jobs.filter((j) => {
    const matchSearch =
      search === "" ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.companyName.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || j.type === typeFilter;
    return matchSearch && matchType;
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
            <h1 className="text-3xl sm:text-5xl font-black text-black dark:text-white mb-3 tracking-tight">
              Tech Opportunities &amp; Roles
            </h1>
            <p className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Curated openings and internship opportunities for learners and developers across Tamil Nadu.
            </p>

            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search jobs, tech stacks, or companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sticky top-16 z-10 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 py-3 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            {["all", "Full-time", "Internship"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  typeFilter === t
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {t === "all" ? "All Jobs" : t}
              </button>
            ))}
            <span className="ml-auto text-xs text-neutral-500">{filtered.length} listings</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {(applyError || applySuccess) && (
            <div
              className={`mb-4 flex items-center gap-2 p-3 rounded-xl border text-sm ${
                applyError
                  ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {applyError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {applyError || applySuccess}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-black dark:text-white font-bold">No jobs found</h3>
              <p className="text-neutral-500 text-sm mt-1">Check back soon for new opportunities.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((job) => {
                const applied = hasApplied(job.id);
                const isDeadlinePassed = job.deadline && job.deadline < today;

                return (
                  <div
                    key={job.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      applied
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              job.type === "Internship"
                                ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                            }`}
                          >
                            {job.type}
                          </span>
                          {applied && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Applied
                            </span>
                          )}
                          {isDeadlinePassed && (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">Deadline Passed</span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-black text-black dark:text-white">{job.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {job.companyName}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" /> {job.stipendOrSalary}
                            </span>
                            {job.deadline && <span className="text-neutral-500">Apply by: {job.deadline}</span>}
                          </div>
                        </div>

                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{job.description}</p>

                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {job.skills.slice(0, 6).map((s) => (
                              <span
                                key={s}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 min-w-[120px]">
                        {job.applyMethod === "external" && job.externalApplyUrl ? (
                          <a href={job.externalApplyUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" fullWidth rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                              Apply Externally
                            </Button>
                          </a>
                        ) : (
                          <Button
                            variant={applied ? "outline" : "primary"}
                            size="sm"
                            fullWidth
                            disabled={applied || isDeadlinePassed || applyingJobId === job.id || !user}
                            onClick={() => applyToJob(job)}
                            leftIcon={applyingJobId === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
                          >
                            {applied ? "Applied ✓" : isDeadlinePassed ? "Closed" : "Apply Now"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
