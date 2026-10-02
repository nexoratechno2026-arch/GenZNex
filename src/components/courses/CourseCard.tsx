"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, BookOpen, Sparkles } from "lucide-react";
import { CourseDoc } from "@/types/schema";

interface CourseCardProps {
  course: CourseDoc;
}

export function formatPrice(priceInPaise?: number): string {
  if (priceInPaise === undefined || priceInPaise === null || priceInPaise === 0) {
    return "FREE";
  }
  const inr = Math.floor(priceInPaise / 100);
  return `₹${inr.toLocaleString("en-IN")}`;
}

export function calculateDiscount(originalInPaise?: number, discountedInPaise?: number): number | null {
  if (!originalInPaise || !discountedInPaise || originalInPaise <= discountedInPaise) return null;
  return Math.round(((originalInPaise - discountedInPaise) / originalInPaise) * 100);
}

export function CourseCard({ course }: CourseCardProps) {
  const isFree = course.priceInPaise === 0;
  const hasDiscount = Boolean(course.discountPriceInPaise && course.discountPriceInPaise < course.priceInPaise);
  const currentPrice = hasDiscount ? course.discountPriceInPaise : course.priceInPaise;
  const originalPrice = hasDiscount ? course.priceInPaise : undefined;
  const discountPercent = calculateDiscount(course.priceInPaise, course.discountPriceInPaise);

  const levelColorMap: Record<string, string> = {
    beginner: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    intermediate: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    advanced: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    all_levels: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  };

  const levelBadgeClass = levelColorMap[course.level] || levelColorMap.all_levels;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group relative flex flex-col rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10 dark:border-zinc-800/80 dark:bg-zinc-900/90 overflow-hidden"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop"}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Level & Language Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border backdrop-blur-md ${levelBadgeClass}`}>
            {course.level}
          </span>
          <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white/90 backdrop-blur-md border border-white/10">
            {course.language}
          </span>
        </div>

        {/* Discount Badge */}
        {discountPercent && (
          <div className="absolute top-3 right-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-md">
            {discountPercent}% OFF
          </div>
        )}

        {/* Featured Ribbon */}
        {course.isFeatured && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-xs font-semibold text-black shadow-md">
            <Sparkles className="h-3 w-3" />
            <span>Featured</span>
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="flex flex-1 flex-col p-5">
        {/* Category */}
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          {course.categoryName || course.category}
        </p>

        {/* Title */}
        <h3 className="mt-1.5 text-base font-bold text-zinc-900 transition-colors group-hover:text-violet-600 dark:text-zinc-100 dark:group-hover:text-violet-400 line-clamp-2">
          {course.title}
        </h3>

        {/* Subtitle */}
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 flex-1">
          {course.subtitle || course.description}
        </p>

        {/* Instructor */}
        <div className="mt-4 flex items-center gap-2.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <img
            src={course.instructor?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
            alt={course.instructor?.name || "Instructor"}
            className="h-6 w-6 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
          />
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
            {course.instructor?.name || "GenZNex Mentor"}
          </span>
        </div>

        {/* Rating and Metadata */}
        <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1 font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{course.rating ? course.rating.toFixed(1) : "New"}</span>
            {course.ratingCount ? (
              <span className="font-normal text-zinc-400">({course.ratingCount})</span>
            ) : null}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course.lessonCount || 0} lessons
            </span>
            {course.totalDurationMinutes ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {Math.round(course.totalDurationMinutes / 60)}h
              </span>
            ) : null}
          </div>
        </div>

        {/* Price Tag */}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-baseline gap-2">
            {isFree ? (
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                FREE
              </span>
            ) : (
              <>
                <span className="text-lg font-extrabold text-zinc-900 dark:text-white">
                  {formatPrice(currentPrice)}
                </span>
                {originalPrice && (
                  <span className="text-xs text-zinc-400 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </>
            )}
          </div>

          <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 transition-colors group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-950/60 dark:text-violet-300 dark:group-hover:bg-violet-600">
            View Course →
          </span>
        </div>
      </div>
    </Link>
  );
}
