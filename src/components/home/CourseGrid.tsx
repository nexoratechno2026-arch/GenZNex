"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  UserCheck,
  ArrowRight,
  Code2,
  Bot,
  BarChart3,
  TrendingUp,
  Briefcase
} from "lucide-react";
import type { UserRole } from "@/types";
import { CourseDoc, CategoryDoc } from "@/types/schema";
import { getFeaturedCourses, getCategories } from "@/lib/services/courseSearch";
import { CourseCard } from "@/components/courses/CourseCard";

interface CourseGridProps {
  currentRole: UserRole;
}

export function CourseGrid({ currentRole }: CourseGridProps) {
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [featCourses, allCats] = await Promise.all([
          getFeaturedCourses(6),
          getCategories(),
        ]);
        setCourses(featCourses);
        setCategories(allCats);
      } catch (err) {
        console.error("Failed to load homepage courses:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Code2": return <Code2 className="w-5 h-5 text-violet-400" />;
      case "Bot": return <Bot className="w-5 h-5 text-pink-400" />;
      case "BarChart3": return <BarChart3 className="w-5 h-5 text-emerald-400" />;
      case "TrendingUp": return <TrendingUp className="w-5 h-5 text-amber-400" />;
      case "Briefcase": return <Briefcase className="w-5 h-5 text-cyan-400" />;
      default: return <Sparkles className="w-5 h-5 text-violet-400" />;
    }
  };

  return (
    <section id="courses" className="py-20 border-t border-gray-800/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category Tiles Header */}
        <div className="mb-16">
          <div className="text-xs uppercase font-extrabold tracking-widest text-violet-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Learning Domains</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-6">
            Explore Programs by Category
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/courses/category/${cat.slug}`}
                className="group flex flex-col p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-violet-500/40 transition-all text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-zinc-800/80 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {getCategoryIcon(cat.icon)}
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-zinc-500 mt-0.5">
                  {cat.courseCount || 1} course{cat.courseCount === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-cyan-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Real-World Engineering</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Featured GenZNex Programs
            </h2>
            <p className="mt-2 text-gray-400 max-w-xl text-sm sm:text-base">
              Crafted by senior engineers from Google and Meta. Zero fluff, real architecture, and verified certificate credentials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-400 flex items-center gap-2 bg-[#12141e] px-3 py-2 rounded-lg border border-gray-800">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span>Role: <strong className="text-white capitalize">{currentRole}</strong></span>
            </div>

            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors bg-violet-500/10 border border-violet-500/20 px-3.5 py-2 rounded-lg"
            >
              <span>View All 12+ Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Real Course Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-zinc-900/40 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* Bottom CTA Banner */}
        <div className="mt-16 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-600/30 hover:bg-violet-500 transition-all hover:scale-105"
          >
            <span>Explore Full Course Catalog (12 Programs)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
