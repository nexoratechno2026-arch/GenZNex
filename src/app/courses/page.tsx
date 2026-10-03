"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { CourseCard } from "@/components/courses/CourseCard";
import { searchCourses, getCategories } from "@/lib/services/courseSearch";
import { CourseDoc, CategoryDoc, CourseLevel, CourseLanguage } from "@/types/schema";

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 space-y-4 animate-pulse">
          <div className="aspect-video w-full rounded bg-neutral-900" />
          <div className="h-4 w-1/3 rounded bg-neutral-900" />
          <div className="h-6 w-3/4 rounded bg-neutral-900" />
          <div className="h-4 w-full rounded bg-neutral-900" />
          <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
            <div className="h-5 w-20 rounded bg-neutral-900" />
            <div className="h-8 w-24 rounded bg-neutral-900" />
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
    async function loadCategories() {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Fetch courses with debounce
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchCatalog() {
      try {
        const results = await searchCourses({
          queryText: queryText.trim() || undefined,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          level: selectedLevel !== "all" ? selectedLevel : undefined,
          price: selectedPrice !== "all" ? selectedPrice : undefined,
          language: selectedLanguage !== "all" ? selectedLanguage : undefined,
          sortBy: selectedSort,
        });

        if (isMounted) {
          setCourses(results);
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
    <div className="min-h-screen bg-black dark:bg-black light:bg-white text-white dark:text-white light:text-black flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-black dark:bg-black light:bg-white pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 text-xs font-bold mb-3 text-neutral-300 dark:text-neutral-300 light:text-neutral-700">
                <GoogleIcon name="school" size={16} />
                <span>Next-Gen Career Programs</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white dark:text-white light:text-black">
                Course Catalog
              </h1>
              <p className="mt-2 text-sm sm:text-base text-neutral-400 dark:text-neutral-400 light:text-neutral-600 max-w-2xl">
                Hands-on engineering tracks designed for developers in India. High-impact curriculum, real-world projects, and placement assistance.
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="w-full md:w-80 relative">
              <GoogleIcon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="catalog-search-input"
                type="text"
                placeholder="Search courses, tags, tools..."
                value={queryText}
                onChange={(e) => {
                  setQueryText(e.target.value);
                  updateURL({ q: e.target.value || null });
                }}
                className="w-full rounded-md border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-100 pl-10 pr-9 py-2.5 text-sm text-white dark:text-white light:text-black placeholder-neutral-500 focus:outline-none focus:border-white dark:focus:border-white light:focus:border-black transition-all"
              />
              {queryText && (
                <button
                  onClick={() => {
                    setQueryText("");
                    updateURL({ q: null });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white dark:hover:text-white light:hover:text-black"
                >
                  <GoogleIcon name="close" size={18} />
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
              className={`rounded px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === "all"
                  ? "bg-white text-black border-white dark:bg-white dark:text-black dark:border-white light:bg-black light:text-white light:border-black"
                  : "bg-black text-neutral-300 border-neutral-800 hover:border-neutral-600 dark:bg-black dark:text-neutral-300 dark:border-neutral-800 light:bg-white light:text-neutral-700 light:border-neutral-300"
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
                className={`rounded px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.slug
                    ? "bg-white text-black border-white dark:bg-white dark:text-black dark:border-white light:bg-black light:text-white light:border-black"
                    : "bg-black text-neutral-300 border-neutral-800 hover:border-neutral-600 dark:bg-black dark:text-neutral-300 dark:border-neutral-800 light:bg-white light:text-neutral-700 light:border-neutral-300"
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
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800 dark:border-neutral-800 light:border-neutral-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="lg:hidden inline-flex items-center gap-2 rounded border border-neutral-800 dark:border-neutral-800 light:border-neutral-300 bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-100 px-3.5 py-2 text-xs font-bold text-white dark:text-white light:text-black"
            >
              <GoogleIcon name="tune" size={16} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="h-5 w-5 rounded bg-white text-black dark:bg-white dark:text-black light:bg-black light:text-white flex items-center justify-center text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <span className="text-xs font-medium text-neutral-400 dark:text-neutral-400 light:text-neutral-600">
              Showing <span className="font-bold text-white dark:text-white light:text-black">{courses.length}</span> program{courses.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 dark:text-neutral-400 light:text-neutral-600 hidden sm:inline">Sort by:</span>
            <div className="relative">
              <select
                id="catalog-sort-select"
                value={selectedSort}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setSelectedSort(val);
                  updateURL({ sort: val });
                }}
                className="appearance-none rounded border border-neutral-800 dark:border-neutral-800 light:border-neutral-300 bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-100 px-3.5 py-2 pr-8 text-xs font-bold text-white dark:text-white light:text-black focus:outline-none"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <GoogleIcon name="arrow_drop_down" size={18} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className={`lg:block ${mobileFiltersOpen ? "block" : "hidden"} space-y-6 lg:border-r lg:border-neutral-800 dark:lg:border-neutral-800 light:lg:border-neutral-200 lg:pr-6`}>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 dark:border-neutral-800 light:border-neutral-200">
              <div className="flex items-center gap-2">
                <GoogleIcon name="filter_alt" size={18} />
                <h2 className="text-sm font-bold text-white dark:text-white light:text-black uppercase tracking-wider">Filters</h2>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white dark:hover:text-white light:hover:text-black transition-colors"
                >
                  <GoogleIcon name="restart_alt" size={14} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Pricing Filter */}
            <div>
              <h3 className="text-xs font-bold text-neutral-300 dark:text-neutral-300 light:text-neutral-700 uppercase tracking-wider mb-2.5">Pricing</h3>
              <div className="space-y-1.5">
                {[
                  { id: "all", label: "All Pricing" },
                  { id: "free", label: "Free Courses" },
                  { id: "paid", label: "Paid Programs" },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black cursor-pointer py-1">
                    <input
                      type="radio"
                      name="filter-price"
                      checked={selectedPrice === item.id}
                      onChange={() => {
                        setSelectedPrice(item.id as any);
                        updateURL({ price: item.id === "all" ? null : item.id });
                      }}
                      className="accent-white"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="pt-4 border-t border-neutral-800 dark:border-neutral-800 light:border-neutral-200">
              <h3 className="text-xs font-bold text-neutral-300 dark:text-neutral-300 light:text-neutral-700 uppercase tracking-wider mb-2.5">Language</h3>
              <div className="space-y-1.5">
                {[
                  { id: "all", label: "All Languages" },
                  { id: "English", label: "English" },
                  { id: "Tamil", label: "Tamil" },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black cursor-pointer py-1">
                    <input
                      type="radio"
                      name="filter-language"
                      checked={selectedLanguage === item.id}
                      onChange={() => {
                        setSelectedLanguage(item.id as any);
                        updateURL({ language: item.id === "all" ? null : item.id });
                      }}
                      className="accent-white"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div className="pt-4 border-t border-neutral-800 dark:border-neutral-800 light:border-neutral-200">
              <h3 className="text-xs font-bold text-neutral-300 dark:text-neutral-300 light:text-neutral-700 uppercase tracking-wider mb-2.5">Level</h3>
              <div className="space-y-1.5">
                {[
                  { id: "all", label: "All Levels" },
                  { id: "beginner", label: "Beginner" },
                  { id: "intermediate", label: "Intermediate" },
                  { id: "advanced", label: "Advanced" },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black cursor-pointer py-1">
                    <input
                      type="radio"
                      name="filter-level"
                      checked={selectedLevel === item.id}
                      onChange={() => {
                        setSelectedLevel(item.id as any);
                        updateURL({ level: item.id === "all" ? null : item.id });
                      }}
                      className="accent-white"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Catalog Course Grid */}
          <main className="lg:col-span-3">
            {loading ? (
              <CatalogSkeleton />
            ) : courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-black dark:bg-black light:bg-white p-12 text-center">
                <GoogleIcon name="search_off" size={48} className="text-neutral-500 mb-3" />
                <h3 className="text-base font-bold text-white dark:text-white light:text-black">No Courses Found</h3>
                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-400 light:text-neutral-600 max-w-sm mx-auto">
                  We couldn&apos;t find any programs matching your selected criteria. Try adjusting your filters or search terms.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-5 rounded border border-white dark:border-white light:border-black bg-white text-black dark:bg-white dark:text-black light:bg-black light:text-white px-4 py-2 text-xs font-bold"
                >
                  Clear All Filters
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
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-8">Loading courses catalog...</div>}>
      <CourseCatalogContent />
    </Suspense>
  );
}
