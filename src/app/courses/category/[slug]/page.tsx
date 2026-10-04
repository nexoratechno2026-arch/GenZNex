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
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-6">
            <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/courses" className="hover:text-black dark:hover:text-white transition-colors">Courses</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{categoryName}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Specialized Domain Track</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                {categoryName}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl">
                {category?.description || `Explore our high-impact curriculum in ${categoryName}, built for fast-tracked career growth.`}
              </p>
            </div>

            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:border-violet-500 hover:text-black dark:hover:text-white transition-colors shadow-sm"
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Showing <span className="font-bold text-neutral-900 dark:text-white">{courses.length}</span> course{courses.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Level Quick Filter */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl p-1 border border-neutral-200 dark:border-neutral-800 text-xs">
              {(["all", "beginner", "intermediate", "advanced"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`rounded-lg px-2.5 py-1 font-medium capitalize transition-all cursor-pointer ${
                    levelFilter === lvl
                      ? "btn-primary shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Price Quick Filter */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl p-1 border border-neutral-200 dark:border-neutral-800 text-xs">
              {(["all", "free", "paid"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriceFilter(p)}
                  className={`rounded-lg px-2.5 py-1 font-medium capitalize transition-all cursor-pointer ${
                    priceFilter === p
                      ? "btn-primary shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
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
              <div key={i} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-4 space-y-4 animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
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
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-12 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-500 mb-4">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">No courses in this category</h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
              We couldn&apos;t find any courses matching your filters in {categoryName}.
            </p>
            <button
              onClick={() => {
                setLevelFilter("all");
                setPriceFilter("all");
              }}
              className="mt-5 btn-primary px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1 inline" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
