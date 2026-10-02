"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  ArrowLeft,
  RotateCcw
} from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { CourseCard } from "@/components/courses/CourseCard";
import { searchCourses, getCategories } from "@/lib/services/courseSearch";
import { CourseDoc, CategoryDoc, CourseLevel } from "@/types/schema";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryCoursesPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [category, setCategory] = useState<CategoryDoc | null>(null);
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<CourseLevel | "all">("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");

  useEffect(() => {
    async function loadCategoryData() {
      setLoading(true);
      try {
        const allCats = await getCategories();
        const currentCat = allCats.find((c) => c.slug === slug || c.id === slug) || null;
        setCategory(currentCat);

        const res = await searchCourses({
          category: currentCat ? currentCat.id : slug,
          level: levelFilter === "all" ? undefined : levelFilter,
          price: priceFilter,
          status: "published",
        });
        setCourses(res.courses);
      } catch (err) {
        console.error("Failed to load category courses:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryData();
  }, [slug, levelFilter, priceFilter]);

  const categoryName = category?.name || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 bg-gradient-to-b from-purple-950/20 via-zinc-950/50 to-transparent pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-200 font-semibold">{categoryName}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Specialized Domain Track</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                {categoryName}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-2xl">
                {category?.description || `Explore our high-impact curriculum in ${categoryName}, built for fast-tracked career growth.`}
              </p>
            </div>

            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Courses</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">
              Showing <span className="font-bold text-white">{courses.length}</span> course{courses.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Level Quick Filter */}
            <div className="flex items-center gap-1 bg-zinc-900/90 rounded-xl p-1 border border-zinc-800 text-xs">
              {(["all", "beginner", "intermediate", "advanced"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`rounded-lg px-2.5 py-1 font-medium capitalize transition-all ${
                    levelFilter === lvl
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Price Quick Filter */}
            <div className="flex items-center gap-1 bg-zinc-900/90 rounded-xl p-1 border border-zinc-800 text-xs">
              {(["all", "free", "paid"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriceFilter(p)}
                  className={`rounded-lg px-2.5 py-1 font-medium capitalize transition-all ${
                    priceFilter === p
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4 animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-zinc-800/80" />
                <div className="h-4 w-1/3 rounded bg-zinc-800" />
                <div className="h-6 w-3/4 rounded bg-zinc-800" />
                <div className="h-4 w-full rounded bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No courses in this category</h3>
            <p className="mt-1 text-sm text-zinc-400 max-w-sm">
              We couldn't find any courses matching your filters in {categoryName}.
            </p>
            <button
              onClick={() => {
                setLevelFilter("all");
                setPriceFilter("all");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
