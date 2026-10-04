"use client";

import React from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
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

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group relative flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-300 hover:border-violet-500/50 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop"}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Level & Language Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-black/60 backdrop-blur-md text-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border border-white/15 shadow-sm">
            {course.level}
          </span>
          <span className="rounded-md bg-black/60 backdrop-blur-md text-white px-2.5 py-0.5 text-[11px] font-bold border border-white/15 shadow-sm">
            {course.language}
          </span>
        </div>

        {/* Discount Badge */}
        {discountPercent && (
          <div className="absolute top-3 right-3 rounded-md bg-gradient-to-r from-rose-500 to-amber-500 text-white px-2.5 py-0.5 text-xs font-extrabold shadow-sm">
            {discountPercent}% OFF
          </div>
        )}

        {/* Featured Ribbon */}
        {course.isFeatured && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-violet-600 text-white px-2.5 py-0.5 text-xs font-bold shadow-md shadow-violet-600/30">
            <GoogleIcon name="stars" size={14} />
            <span>Featured</span>
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="flex flex-1 flex-col p-5">
        {/* Category */}
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          {course.categoryName || course.category}
        </p>

        {/* Title */}
        <h3 className="mt-1.5 text-base font-bold text-neutral-900 dark:text-white line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {course.title}
        </h3>

        {/* Subtitle */}
        <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 flex-1 leading-relaxed">
          {course.subtitle || course.description}
        </p>

        {/* Meta details */}
        <div className="mt-4 flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5">
            <GoogleIcon name="schedule" size={15} />
            <span>{Math.round((course.totalDurationMinutes || 0) / 60)} hrs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GoogleIcon name="menu_book" size={15} />
            <span>{course.lessonCount || 0} lessons</span>
          </div>
          {course.ratingCount > 0 && (
            <div className="flex items-center gap-1 ml-auto font-bold text-amber-500">
              <GoogleIcon name="star" size={15} filled />
              <span className="text-neutral-900 dark:text-white">{course.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Price & Checkout Link */}
        <div className="mt-4 flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-neutral-900 dark:text-white">
              {formatPrice(currentPrice)}
            </span>
            {originalPrice && (
              <span className="text-xs text-neutral-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Explore</span>
            <GoogleIcon name="arrow_forward" size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
