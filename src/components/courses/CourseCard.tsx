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
      className="group relative flex flex-col rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-black dark:bg-black light:bg-white transition-all duration-200 hover:border-white dark:hover:border-white light:hover:border-black overflow-hidden"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-100">
        <img
          src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop"}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Level & Language Badges in Monochrome */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-black/80 dark:bg-black/80 light:bg-white/90 text-white dark:text-white light:text-black px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border border-neutral-700 dark:border-neutral-700 light:border-neutral-300">
            {course.level}
          </span>
          <span className="rounded bg-black/80 dark:bg-black/80 light:bg-white/90 text-white dark:text-white light:text-black px-2 py-0.5 text-[11px] font-bold border border-neutral-700 dark:border-neutral-700 light:border-neutral-300">
            {course.language}
          </span>
        </div>

        {/* Discount Badge */}
        {discountPercent && (
          <div className="absolute top-3 right-3 rounded bg-white text-black dark:bg-white dark:text-black light:bg-black light:text-white px-2 py-0.5 text-xs font-bold border border-neutral-400">
            {discountPercent}% OFF
          </div>
        )}

        {/* Featured Ribbon */}
        {course.isFeatured && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded bg-black/90 text-white dark:bg-black/90 dark:text-white light:bg-white/95 light:text-black px-2 py-0.5 text-xs font-bold border border-neutral-700 dark:border-neutral-700 light:border-neutral-300">
            <GoogleIcon name="stars" size={14} />
            <span>Featured</span>
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="flex flex-1 flex-col p-5">
        {/* Category */}
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 light:text-neutral-600">
          {course.categoryName || course.category}
        </p>

        {/* Title */}
        <h3 className="mt-1.5 text-base font-bold text-white dark:text-white light:text-black line-clamp-2">
          {course.title}
        </h3>

        {/* Subtitle */}
        <p className="mt-1 text-xs text-neutral-300 dark:text-neutral-300 light:text-neutral-700 line-clamp-2 flex-1">
          {course.subtitle || course.description}
        </p>

        {/* Meta details */}
        <div className="mt-4 flex items-center gap-4 text-xs text-neutral-300 dark:text-neutral-300 light:text-neutral-700 pt-3 border-t border-neutral-800 dark:border-neutral-800 light:border-neutral-200">
          <div className="flex items-center gap-1">
            <GoogleIcon name="schedule" size={15} />
            <span>{Math.round((course.totalDurationMinutes || 0) / 60)} hrs</span>
          </div>
          <div className="flex items-center gap-1">
            <GoogleIcon name="menu_book" size={15} />
            <span>{course.lessonCount || 0} lessons</span>
          </div>
          {course.ratingCount > 0 && (
            <div className="flex items-center gap-1 ml-auto font-bold text-white dark:text-white light:text-black">
              <GoogleIcon name="star" size={15} filled />
              <span>{course.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Price & Checkout Link */}
        <div className="mt-4 flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white dark:text-white light:text-black">
              {formatPrice(currentPrice)}
            </span>
            {originalPrice && (
              <span className="text-xs text-neutral-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-white dark:text-white light:text-black flex items-center gap-1 underline underline-offset-2">
            <span>Details</span>
            <GoogleIcon name="arrow_forward" size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
