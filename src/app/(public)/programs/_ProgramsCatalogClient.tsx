"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { TrainingProgramDoc } from "@/types/schema";
import {
  Search,
  Filter,
  Sparkles,
  Clock,
  Users,
  Zap,
  ArrowRight,
  Star,
  BookOpen,
  Laptop,
  Globe,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const TYPE_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All Programs" },
  { id: "bootcamp", label: "Bootcamps" },
  { id: "internship", label: "Internships" },
  { id: "skill_track", label: "Skill Tracks" },
];

const MODE_ICONS: Record<string, React.ReactNode> = {
  online: <Globe className="w-3 h-3" />,
  offline: <Building2 className="w-3 h-3" />,
  hybrid: <Laptop className="w-3 h-3" />,
};

interface Props {
  programs: TrainingProgramDoc[];
}

export default function ProgramsCatalogClient({ programs }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  const filtered = programs.filter((p) => {
    const matchSearch = search === "" || p.title.toLowerCase().includes(search.toLowerCase()) || p.shortDescription.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchMode = modeFilter === "all" || p.mode === modeFilter;
    return matchSearch && matchType && matchMode;
  });

  const featured = filtered.filter((p) => p.isFeatured);
  const regular = filtered.filter((p) => !p.isFeatured);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-zinc-950 to-zinc-950 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-800/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 mb-4 border border-purple-500/30">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Training Programs
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Launch Your Career<br />
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">With Expert Mentorship</span>
          </h1>
          <p className="text-gray-300 text-base max-w-2xl mx-auto mb-8">
            Cohort-based bootcamps and skill tracks with live sessions, real projects, mock interviews, and placement support.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  typeFilter === f.id ? "bg-purple-600 text-white" : "bg-zinc-900 text-gray-400 hover:text-white border border-zinc-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex gap-1.5">
            {["all", "online", "offline", "hybrid"].map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  modeFilter === m ? "bg-cyan-600/80 text-white" : "bg-zinc-900 text-gray-400 hover:text-white border border-zinc-800"
                }`}
              >
                {m !== "all" && MODE_ICONS[m]}
                {m === "all" ? "All Modes" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gray-500">{filtered.length} programs</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Featured */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Featured Programs</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {featured.map((program) => (
                <FeaturedProgramCard key={program.id} program={program} />
              ))}
            </div>
          </section>
        )}

        {/* All Programs */}
        {regular.length > 0 && (
          <section>
            {featured.length > 0 && <h2 className="text-lg font-black text-white mb-5">All Programs</h2>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {regular.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <h3 className="text-white font-bold">No programs found</h3>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedProgramCard({ program }: { program: TrainingProgramDoc }) {
  const priceDisplay = program.priceInPaise === 0
    ? "Free"
    : `₹${(program.priceInPaise / 100).toLocaleString("en-IN")}`;

  return (
    <Link href={`/programs/${program.slug}`}>
      <div className="group relative rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-zinc-900 to-zinc-900 hover:border-purple-500/60 transition-all overflow-hidden shadow-xl hover:shadow-purple-900/20 cursor-pointer">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-cyan-500" />
        {program.thumbnailUrl && (
          <div className="relative h-40 overflow-hidden">
            <Image src={program.thumbnailUrl} alt={program.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <TypeBadge type={program.type} />
            <ModeBadge mode={program.mode} />
          </div>
          <h3 className="text-lg font-black text-white mb-1 group-hover:text-purple-200 transition-colors">{program.title}</h3>
          <p className="text-xs text-gray-400 mb-4 line-clamp-2">{program.shortDescription}</p>

          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-cyan-400" /> {program.durationWeeks}w</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-purple-400" /> {program.curriculum.linkedCourseIds.length} courses</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-white">{priceDisplay}</span>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProgramCard({ program }: { program: TrainingProgramDoc }) {
  const priceDisplay = program.priceInPaise === 0
    ? "Free"
    : `₹${(program.priceInPaise / 100).toLocaleString("en-IN")}`;

  return (
    <Link href={`/programs/${program.slug}`}>
      <div className="group rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-violet-500/40 hover:bg-zinc-900 transition-all overflow-hidden cursor-pointer h-full flex flex-col">
        {program.thumbnailUrl && (
          <div className="relative h-32 overflow-hidden">
            <Image src={program.thumbnailUrl} alt={program.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          </div>
        )}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-2">
            <TypeBadge type={program.type} />
            <ModeBadge mode={program.mode} />
          </div>
          <h3 className="text-sm font-bold text-white mb-1 group-hover:text-purple-200 transition-colors line-clamp-2 flex-1">{program.title}</h3>
          <p className="text-xs text-gray-400 mb-3 line-clamp-2">{program.shortDescription}</p>

          <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {program.durationWeeks}w</span>
            {program.outcomes.length > 0 && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {program.outcomes.length} outcomes</span>}
          </div>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-base font-black text-white">{priceDisplay}</span>
            <span className="flex items-center gap-1 text-xs text-purple-400 font-semibold group-hover:gap-2 transition-all">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    bootcamp: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    internship: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    skill_track: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };
  const labels: Record<string, string> = { bootcamp: "Bootcamp", internship: "Internship", skill_track: "Skill Track" };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[type] || ""}`}>
      {labels[type] || type}
    </span>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-gray-500">
      {MODE_ICONS[mode]}
      {mode.charAt(0).toUpperCase() + mode.slice(1)}
    </span>
  );
}
