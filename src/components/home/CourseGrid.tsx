"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import type { UserRole } from "@/types";
import { CourseDoc, CategoryDoc } from "@/types/schema";
import { getFeaturedCourses, getCategories } from "@/lib/services/courseSearch";
import { CourseCard } from "@/components/courses/CourseCard";

interface CourseGridProps {
  currentRole?: UserRole;
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

  const getCategoryGoogleIcon = (slug: string) => {
    switch (slug) {
      case "full-stack-web":
        return "terminal";
      case "generative-ai":
        return "smart_toy";
      case "devops-cloud":
        return "cloud";
      case "data-science-sql":
        return "analytics";
      case "mobile-development":
        return "phone_iphone";
      case "faang-placement":
        return "work";
      default:
        return "school";
    }
  };

  return (
    <section id="courses" className="py-20 border-t border-neutral-200 dark:border-neutral-800 relative transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category Tiles Header */}
        <div className="mb-14">
          <div className="text-xs uppercase font-bold tracking-widest text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
            <GoogleIcon name="school" size={16} />
            <span>Learning Domains</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white mb-6">
            Explore Programs by Category
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/courses/category/${cat.slug}`}
                className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black hover:border-black dark:hover:border-white transition-all flex flex-col items-center text-center group"
              >
                <div className="w-10 h-10 rounded-md bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-black dark:text-white mb-2.5">
                  <GoogleIcon name={getCategoryGoogleIcon(cat.slug)} size={22} />
                </div>
                <span className="font-bold text-xs text-black dark:text-white leading-tight">
                  {cat.name}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  {cat.courseCount || 0} Courses
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Courses Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1.5">
              <GoogleIcon name="stars" size={16} />
              <span>Curated Learning Paths</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white">
              Featured Tech Bootcamps
            </h2>
          </div>
          <Link
            href="/courses"
            className="text-sm font-bold text-black dark:text-white flex items-center gap-1 underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            <span>View All Courses</span>
            <GoogleIcon name="arrow_forward" size={16} />
          </Link>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-lg bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 animate-pulse"
              />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-black text-neutral-600 dark:text-neutral-400">
            <GoogleIcon name="school" size={40} className="mb-2" />
            <p className="font-bold">No courses found matching this criteria.</p>
          </div>
        )}

      </div>
    </section>
  );
}
