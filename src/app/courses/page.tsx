"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  Search, 
  Filter, 
  X, 
  RotateCcw, 
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  BookOpen
} from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { CourseCard } from "@/components/courses/CourseCard";
import { searchCourses, getCategories } from "@/lib/services/courseSearch";
import { CourseDoc, CategoryDoc, CourseLevel, CourseLanguage } from "@/types/schema";

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900/40 p-4 space-y-4 animate-pulse">
          <div className="aspect-video w-full rounded-xl bg-zinc-800/80" />
          <div className="h-4 w-1/3 rounded bg-zinc-800" />
          <div className="h-6 w-3/4 rounded bg-zinc-800" />
          <div className="h-4 w-full rounded bg-zinc-800" />
          <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
            <div className="h-5 w-20 rounded bg-zinc-800" />
            <div className="h-8 w-24 rounded-lg bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CourseCatalogContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State from URL
  const [queryText, setQueryText] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel | "all">(
    (searchParams.get("level") as CourseLevel) || "all"
  );
  const [selectedPrice, setSelectedPrice] = useState<"all" | "free" | "paid">(
    (searchParams.get("price") as "all" | "free" | "paid") || "all"
  );
  const [selectedLanguage, setSelectedLanguage] = useState<CourseLanguage | "all">(
    (searchParams.get("language") as CourseLanguage) || "all"
  );
  const [selectedSort, setSelectedSort] = useState<"popular" | "newest" | "price_asc" | "price_desc" | "rating">(
    (searchParams.get("sort") as "popular" | "newest" | "price_asc" | "price_desc" | "rating") || "popular"
  );

  // Data state
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync state to URL
  const updateURL = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Apply state values
    params.set("q", queryText);
    params.set("category", selectedCategory);
    params.set("level", selectedLevel);
    params.set("price", selectedPrice);
    params.set("language", selectedLanguage);
    params.set("sort", selectedSort);

    // Apply explicit overrides
    Object.entries(overrides).forEach(([key, val]) => {
      if (val === null || val === "all" || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    // Cleanup defaults
    if (params.get("category") === "all") params.delete("category");
    if (params.get("level") === "all") params.delete("level");
    if (params.get("price") === "all") params.delete("price");
    if (params.get("language") === "all") params.delete("language");
    if (params.get("sort") === "popular") params.delete("sort");
    if (!params.get("q")) params.delete("q");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Load categories once
  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCats();
  }, []);

  // Fetch courses on filter changes
  useEffect(() => {
    let isMounted = true;
    async function fetchCatalog() {
      setLoading(true);
      try {
        const res = await searchCourses({
          query: queryText,
          category: selectedCategory === "all" ? undefined : selectedCategory,
          level: selectedLevel === "all" ? undefined : selectedLevel,
          price: selectedPrice,
          language: selectedLanguage === "all" ? undefined : selectedLanguage,
          sort: selectedSort,
          status: "published",
        });
        if (isMounted) {
          setCourses(res.courses);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      fetchCatalog();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [queryText, selectedCategory, selectedLevel, selectedPrice, selectedLanguage, selectedSort]);

  const handleResetFilters = () => {
    setQueryText("");
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSelectedPrice("all");
    setSelectedLanguage("all");
    setSelectedSort("popular");
    router.replace(pathname, { scroll: false });
  };

  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedLevel !== "all",
    selectedPrice !== "all",
    selectedLanguage !== "all",
    queryText.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 bg-gradient-to-b from-purple-950/20 via-zinc-950/50 to-transparent pt-12 pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Career Programs</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                Course <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-pink-400">Catalog</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl">
                Hands-on engineering tracks designed for Gen Z developers in India. High-impact curriculum, real-world projects, and placement assistance.
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="w-full md:w-80 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                id="catalog-search-input"
                type="text"
                placeholder="Search courses, tags, tools..."
                value={queryText}
                onChange={(e) => {
                  setQueryText(e.target.value);
                  updateURL({ q: e.target.value || null });
                }}
                className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 pl-10 pr-9 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all shadow-inner"
              />
              {queryText && (
                <button
                  onClick={() => {
                    setQueryText("");
                    updateURL({ q: null });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Horizontal Pills */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => {
                setSelectedCategory("all");
                updateURL({ category: null });
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === "all"
                  ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/30"
                  : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  updateURL({ category: cat.slug });
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.slug
                    ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/30"
                    : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Mobile Filters Toggle & Sort Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-700"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <span className="text-xs font-medium text-zinc-400">
              Showing <span className="font-bold text-white">{courses.length}</span> program{courses.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 hidden sm:inline">Sort by:</span>
            <div className="relative">
              <select
                id="catalog-sort-select"
                value={selectedSort}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setSelectedSort(val);
                  updateURL({ sort: val });
                }}
                className="appearance-none rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 pr-8 text-xs font-semibold text-zinc-200 hover:border-zinc-700 focus:border-violet-500 focus:outline-none"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className={`lg:block ${mobileFiltersOpen ? "block" : "hidden"} space-y-6 lg:border-r lg:border-zinc-800/80 lg:pr-6`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-violet-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Filters</h2>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-violet-400 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Pricing Filter */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2.5">Pricing</h3>
              <div className="space-y-1.5">
                {[
                  { id: "all", label: "All Pricing" },
                  { id: "free", label: "Free Courses" },
                  { id: "paid", label: "Paid Programs" },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer py-1">
                    <input
                      type="radio"
                      name="filter-price"
                      checked={selectedPrice === item.id}
                      onChange={() => {
                        setSelectedPrice(item.id as any);
                        updateURL({ price: item.id === "all" ? null : item.id });
                      }}
                      className="rounded-full border-zinc-700 bg-zinc-900 text-violet-600 focus:ring-violet-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div className="border-t border-zinc-800/60 pt-4">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2.5">Experience Level</h3>
              <div className="space-y-1.5">
                {[
                  { id: "all", label: "All Levels" },
                  { id: "beginner", label: "Beginner" },
                  { id: "intermediate", label: "Intermediate" },
                  { id: "advanced", label: "Advanced" },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer py-1">
                    <input
                      type="radio"
                      name="filter-level"
                      checked={selectedLevel === item.id}
                      onChange={() => {
                        setSelectedLevel(item.id as any);
                        updateURL({ level: item.id === "all" ? null : item.id });
                      }}
                      className="rounded-full border-zinc-700 bg-zinc-900 text-violet-600 focus:ring-violet-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="border-t border-zinc-800/60 pt-4">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2.5">Language</h3>
              <div className="space-y-1.5">
                {[
                  { id: "all", label: "All Languages" },
                  { id: "English", label: "English" },
                  { id: "Hinglish", label: "Hinglish" },
                  { id: "Hindi", label: "Hindi" },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer py-1">
                    <input
                      type="radio"
                      name="filter-language"
                      checked={selectedLanguage === item.id}
                      onChange={() => {
                        setSelectedLanguage(item.id as any);
                        updateURL({ language: item.id === "all" ? null : item.id });
                      }}
                      className="rounded-full border-zinc-700 bg-zinc-900 text-violet-600 focus:ring-violet-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Courses Grid Container */}
          <main className="lg:col-span-3">
            {loading ? (
              <CatalogSkeleton />
            ) : courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">No courses found</h3>
                <p className="mt-1 text-sm text-zinc-400 max-w-sm">
                  We couldn't find any courses matching your current filters or query. Try adjusting or clearing your filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CourseCatalogContent />
    </Suspense>
  );
}
