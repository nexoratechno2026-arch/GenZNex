"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Button } from "@/components/ui/Button";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { useAuth } from "@/lib/context/AuthContext";
import { db, functions } from "@/lib/firebase/client";
import { getCourseBySlug, getCourseCurriculum, CourseCurriculum } from "@/lib/services/courseSearch";
import { CourseDoc, ModuleDoc, LessonDoc, CourseReviewDoc } from "@/types/schema";
import { formatPrice, calculateDiscount } from "@/components/courses/CourseCard";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDoc | null>(null);
  const [curriculum, setCurriculum] = useState<CourseCurriculum | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userProgress, setUserProgress] = useState<number>(0);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "instructor" | "reviews" | "faq">("overview");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Reviews state
  const [reviews, setReviews] = useState<CourseReviewDoc[]>([]);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCourse() {
      setLoading(true);
      try {
        const found = await getCourseBySlug(slug);
        if (isMounted) {
          setCourse(found);
        }

        if (found) {
          const curr = await getCourseCurriculum(found.id);
          if (isMounted) {
            setCurriculum(curr);
            if (curr.modules.length > 0) {
              setExpandedModules({ [curr.modules[0].id]: true });
            }
          }

          // Fetch reviews
          try {
            const revQuery = query(
              collection(db, "courses", found.id, "reviews"),
              orderBy("createdAt", "desc")
            );
            const revSnap = await getDocs(revQuery);
            const revItems = revSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseReviewDoc));
            if (isMounted) {
              setReviews(revItems);
            }
          } catch (rErr) {
            console.error("Failed to load reviews:", rErr);
          }

          // Check enrollment if user is logged in
          if (user) {
            const enrollmentRef = doc(db, "enrollments", `${user.uid}_${found.id}`);
            const enrollSnap = await getDoc(enrollmentRef);
            if (isMounted && enrollSnap.exists()) {
              setIsEnrolled(true);
              setUserProgress(enrollSnap.data()?.progressPercentage || 0);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load course details:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCourse();
    return () => {
      isMounted = false;
    };
  }, [slug, user]);

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Handle Free Enrollment via Callable Cloud Function
  const handleFreeEnroll = async () => {
    if (!user) {
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }
    if (!course) return;

    setEnrolling(true);
    setEnrollError(null);

    try {
      const enrollFreeFn = httpsCallable(functions, "enrollFreeCourse");
      await enrollFreeFn({ courseId: course.id });
      setEnrollSuccess(true);
      setIsEnrolled(true);
    } catch (err: any) {
      console.error("Enrollment failed:", err);
      setEnrollError(err.message || "Failed to complete enrollment. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  // Handle Review Submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !user) return;

    setSubmittingReview(true);
    setReviewError(null);

    try {
      const submitFn = httpsCallable(functions, "submitCourseReview");
      await submitFn({
        courseId: course.id,
        rating: reviewRating,
        reviewText,
      });

      setReviewSuccess(true);
      setReviewText("");

      // Refresh reviews list
      const revQuery = query(
        collection(db, "courses", course.id, "reviews"),
        orderBy("createdAt", "desc")
      );
      const revSnap = await getDocs(revQuery);
      setReviews(revSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseReviewDoc)));
    } catch (err: any) {
      console.error("Review submission failed:", err);
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 w-full animate-pulse space-y-6">
          <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
          <div className="h-10 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="h-6 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            <div className="lg:col-span-2 h-96 bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
            <div className="h-96 bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Course Not Found</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">The program you are looking for does not exist or has been archived.</p>
          <Link href="/courses" className="mt-6 btn-primary px-6 py-2.5 text-xs font-semibold rounded-xl">
            Browse All Courses
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isFree = course.priceInPaise === 0;
  const hasDiscount = Boolean(course.discountPriceInPaise && course.discountPriceInPaise < course.priceInPaise);
  const currentPrice = hasDiscount ? course.discountPriceInPaise : course.priceInPaise;
  const originalPrice = hasDiscount ? course.priceInPaise : undefined;
  const discountPercent = calculateDiscount(course.priceInPaise, course.discountPriceInPaise);

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "GenZNex",
      "sameAs": "https://genznex.in"
    },
    "instructor": {
      "@type": "Person",
      "name": course.instructor?.name
    },
    "offers": {
      "@type": "Offer",
      "price": isFree ? "0" : Math.floor((currentPrice || 0) / 100),
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex flex-col">
      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      {/* Hero Section */}
      <header className="relative border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Course Main Details */}
            <div className="lg:col-span-2 space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/courses/category/${course.category}`}
                  className="rounded-md bg-neutral-100 dark:bg-neutral-900 px-3 py-1 text-xs font-semibold text-black dark:text-white border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  {course.categoryName || course.category}
                </Link>
                <span className="rounded-md bg-neutral-100 dark:bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-black dark:text-white capitalize border border-neutral-300 dark:border-neutral-700">
                  {course.level} Level
                </span>
                <span className="rounded-md bg-neutral-100 dark:bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-black dark:text-white border border-neutral-300 dark:border-neutral-700">
                  {course.language}
                </span>
                {course.isFeatured && (
                  <span className="flex items-center gap-1 rounded-md bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 text-xs font-bold border border-neutral-700 dark:border-neutral-300">
                    <GoogleIcon name="stars" size={14} />
                    <span>Featured</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-black dark:text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
                {course.subtitle || course.description}
              </p>

              {/* Stats & Instructor */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-600 dark:text-neutral-400 pt-2">
                {/* Rating */}
                <div className="flex items-center gap-1.5 font-bold text-black dark:text-white">
                  <GoogleIcon name="star" size={16} filled />
                  <span className="text-sm">{course.rating ? course.rating.toFixed(1) : "New"}</span>
                  {course.ratingCount ? (
                    <span className="font-normal text-neutral-500">({course.ratingCount} ratings)</span>
                  ) : null}
                </div>

                {/* Enrollment Count */}
                <div className="flex items-center gap-1.5">
                  <GoogleIcon name="group" size={16} />
                  <span>{(course.enrollmentCount || 0).toLocaleString("en-IN")} learners enrolled</span>
                </div>

                {/* Lessons & Duration */}
                <div className="flex items-center gap-1.5">
                  <GoogleIcon name="menu_book" size={16} />
                  <span>{course.lessonCount || 0} lessons</span>
                </div>

                {course.totalDurationMinutes ? (
                  <div className="flex items-center gap-1.5">
                    <GoogleIcon name="schedule" size={16} />
                    <span>{Math.round(course.totalDurationMinutes / 60)} hours total length</span>
                  </div>
                ) : null}
              </div>

              {/* Instructor Bio Snippet */}
              <div className="flex items-center gap-3 pt-3">
                <img
                  src={course.instructor?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                  alt={course.instructor?.name || "Instructor"}
                  className="h-10 w-10 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
                />
                <div>
                  <p className="text-xs text-neutral-500">Created by</p>
                  <p className="text-sm font-semibold text-black dark:text-white">{course.instructor?.name}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Pricing & CTA Card */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-6 shadow-xl lg:sticky lg:top-24 space-y-6">
                {/* Thumbnail Preview */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <img
                    src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop"}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                  {course.promoVideoUrl && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-white text-black dark:bg-black dark:text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer">
                        <GoogleIcon name="play_arrow" size={24} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Display */}
                <div>
                  <div className="flex items-baseline gap-3">
                    {isFree ? (
                      <span className="text-3xl font-extrabold text-black dark:text-white">
                        FREE
                      </span>
                    ) : (
                      <>
                        <span className="text-3xl font-extrabold text-black dark:text-white">
                          {formatPrice(currentPrice)}
                        </span>
                        {originalPrice && (
                          <span className="text-sm text-neutral-500 line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                        {discountPercent && (
                          <span className="rounded bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 text-xs font-bold border border-neutral-400">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {!isFree && (
                    <p className="mt-1 text-xs text-neutral-500">Includes all taxes and lifetime course access</p>
                  )}
                </div>

                {/* Success Banner */}
                {enrollSuccess && (
                  <div className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-3.5 text-xs text-black dark:text-white flex items-center gap-2">
                    <GoogleIcon name="check_circle" size={16} />
                    <span>You're enrolled! Start learning immediately below.</span>
                  </div>
                )}

                {/* Error Banner */}
                {enrollError && (
                  <div className="rounded-md border border-neutral-400 bg-neutral-100 dark:bg-neutral-900 p-3 text-xs text-black dark:text-white flex items-center gap-2">
                    <GoogleIcon name="error" size={16} />
                    <span>{enrollError}</span>
                  </div>
                )}

                {/* Dynamic CTA Button */}
                <div>
                  {isEnrolled ? (
                    <Link href={`/learn/${course.slug}`}>
                      <Button variant="primary" fullWidth size="lg" leftIcon={<GoogleIcon name="play_arrow" size={18} />}>
                        Continue Learning
                      </Button>
                    </Link>
                  ) : !user ? (
                    <Link href={`/login?redirect=/courses/${slug}`}>
                      <Button variant="primary" fullWidth size="lg" rightIcon={<GoogleIcon name="arrow_forward" size={18} />}>
                        Login to Enroll
                      </Button>
                    </Link>
                  ) : isFree ? (
                    <Button
                      variant="primary"
                      fullWidth
                      size="lg"
                      onClick={handleFreeEnroll}
                      loading={enrolling}
                      leftIcon={<GoogleIcon name="auto_awesome" size={18} />}
                    >
                      Enroll Free Today
                    </Button>
                  ) : (
                    <Link href={`/checkout/${course.slug}`}>
                      <Button variant="primary" fullWidth size="lg" rightIcon={<GoogleIcon name="arrow_forward" size={18} />}>
                        Enroll Now
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Features List */}
                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <p className="font-semibold text-black dark:text-white">This course includes:</p>
                  <div className="flex items-center gap-2.5">
                    <GoogleIcon name="videocam" size={16} />
                    <span>{course.lessonCount || 0} on-demand video &amp; reading lessons</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <GoogleIcon name="description" size={16} />
                    <span>Downloadable cheatsheets, notes &amp; code repositories</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <GoogleIcon name="workspace_premium" size={16} />
                    <span>Official GenZNex verified Certificate of Completion</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <GoogleIcon name="verified_user" size={16} />
                    <span>100% Lifetime access &amp; free future curriculum updates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tabs & Details Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-8 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Overview" },
            { id: "curriculum", label: "Curriculum" },
            { id: "instructor", label: "Instructor" },
            { id: "reviews", label: "Reviews" },
            { id: "faq", label: "FAQ" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "btn-primary shadow-md shadow-violet-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="max-w-3xl space-y-10">
            {/* What you'll learn */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                  <GoogleIcon name="auto_awesome" size={20} />
                  <span>What you&apos;ll learn</span>
                </h2>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {course.learningOutcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                      <GoogleIcon name="check_circle" size={16} className="text-black dark:text-white shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="text-lg font-bold text-black dark:text-white">Course Description</h2>
              <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line space-y-3">
                <p>{course.description}</p>
              </div>
            </div>

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-black dark:text-white">Prerequisites &amp; Requirements</h2>
                <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  {course.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Curriculum Accordion */}
        {activeTab === "curriculum" && (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-black dark:text-white">Course Curriculum</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  {curriculum?.modules.length || 0} modules • {course.lessonCount || 0} lessons • {Math.round((course.totalDurationMinutes || 0) / 60)} hours
                </p>
              </div>
              <button
                onClick={() => {
                  const allExpanded = Object.keys(expandedModules).length === (curriculum?.modules.length || 0);
                  if (allExpanded) {
                    setExpandedModules({});
                  } else {
                    const expandAll: Record<string, boolean> = {};
                    curriculum?.modules.forEach((m) => (expandAll[m.id] = true));
                    setExpandedModules(expandAll);
                  }
                }}
                className="text-xs font-bold text-black dark:text-white underline cursor-pointer"
              >
                Toggle All Modules
              </button>
            </div>

            {/* Module List */}
            <div className="space-y-4">
              {curriculum?.modules.map((mod, modIdx) => {
                const isExpanded = Boolean(expandedModules[mod.id]);
                const lessons = curriculum.lessonsByModule[mod.id] || [];

                return (
                  <div key={mod.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black overflow-hidden">
                    {/* Module Accordion Header */}
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                            Module {mod.order || modIdx + 1}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-black dark:text-white">{mod.title}</h3>
                        {mod.description && (
                          <p className="text-xs text-neutral-500 line-clamp-1">{mod.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-500 hidden sm:inline">
                          {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
                        </span>
                        {isExpanded ? (
                          <GoogleIcon name="expand_less" size={20} />
                        ) : (
                          <GoogleIcon name="expand_more" size={20} />
                        )}
                      </div>
                    </button>

                    {/* Lesson Items */}
                    {isExpanded && (
                      <div className="border-t border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                        {lessons.map((lesson) => {
                          const canAccess = isEnrolled || lesson.isPreview;
                          const LessonWrapper = canAccess ? Link : "div";
                          const wrapperProps = canAccess
                            ? { href: `/learn/${course.slug}/${lesson.id}` }
                            : {};

                          return (
                            <LessonWrapper
                              key={lesson.id}
                              {...(wrapperProps as any)}
                              className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                                canAccess
                                  ? "hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer group"
                                  : "opacity-75"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {lesson.type === "video" ? (
                                  <GoogleIcon name="play_circle" size={18} />
                                ) : lesson.type === "pdf" ? (
                                  <GoogleIcon name="description" size={18} />
                                ) : (
                                  <GoogleIcon name="link" size={18} />
                                )}
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-black dark:text-white">
                                    {lesson.title}
                                  </p>
                                  <span className="text-[10px] text-neutral-500 capitalize">{lesson.type}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-xs">
                                {lesson.durationMinutes ? (
                                  <span className="text-neutral-500">{lesson.durationMinutes} min</span>
                                ) : null}

                                {lesson.isPreview ? (
                                  <span className="rounded bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-black dark:text-white border border-neutral-300 dark:border-neutral-700">
                                    Preview
                                  </span>
                                ) : !isEnrolled ? (
                                  <GoogleIcon name="lock" size={16} className="text-neutral-400" />
                                ) : (
                                  <span className="font-bold text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[11px]">
                                    Play <GoogleIcon name="arrow_forward" size={12} />
                                  </span>
                                )}
                              </div>
                            </LessonWrapper>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Instructor */}
        {activeTab === "instructor" && (
          <div className="max-w-2xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <img
                src={course.instructor?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop"}
                alt={course.instructor?.name || "Instructor"}
                className="h-16 w-16 rounded-xl object-cover border border-neutral-300 dark:border-neutral-700"
              />
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white">{course.instructor?.name}</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">{course.instructor?.headline || "Senior Platform Educator"}</p>
                <p className="text-xs text-neutral-500 mt-1">Verified GenZNex Mentor</p>
              </div>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              With extensive industry experience building scalable systems and training thousands of engineering students across India, our trainers bring real production patterns directly into your hands.
            </p>
          </div>
        )}

        {/* Tab 4: Reviews Display */}
        {activeTab === "reviews" && (
          <div className="max-w-3xl space-y-8">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-6 flex flex-col sm:flex-row items-center gap-8">
              <div className="text-center sm:text-left">
                <span className="text-5xl font-black text-black dark:text-white">{course.rating ? course.rating.toFixed(1) : "5.0"}</span>
                <div className="flex items-center gap-1 text-black dark:text-white justify-center sm:justify-start mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <GoogleIcon key={s} name="star" size={16} filled />
                  ))}
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {course.ratingCount ? `${course.ratingCount} Ratings` : "Course Rating"}
                </p>
              </div>

              {/* Rating Bars */}
              <div className="flex-1 w-full space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                {[
                  { star: "5 star", pct: "88%" },
                  { star: "4 star", pct: "9%" },
                  { star: "3 star", pct: "2%" },
                  { star: "2 star", pct: "1%" },
                  { star: "1 star", pct: "0%" },
                ].map((b) => (
                  <div key={b.star} className="flex items-center gap-3">
                    <span className="w-12 text-right">{b.star}</span>
                    <div className="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: b.pct }} />
                    </div>
                    <span className="w-8">{b.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave a Review Section */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GoogleIcon name="chat" size={20} />
                <h3 className="text-base font-bold text-black dark:text-white">Student Review &amp; Feedback</h3>
              </div>

              {!user ? (
                <div className="text-xs text-neutral-600 dark:text-neutral-400 p-4 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span>Sign in to leave a verified review for this course.</span>
                  <Link href={`/login?redirect=/courses/${slug}`} className="text-black dark:text-white font-bold underline">
                    Login
                  </Link>
                </div>
              ) : !isEnrolled ? (
                <div className="text-xs text-neutral-600 dark:text-neutral-400 p-4 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  You must be enrolled in this course to leave a review.
                </div>
              ) : userProgress < 25 ? (
                <div className="text-xs text-neutral-600 dark:text-neutral-400 p-4 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
                  <GoogleIcon name="error" size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-black dark:text-white block mb-0.5">Verified Reviews Requirement</strong>
                    To ensure high review authenticity for our learners, at least <span className="font-bold text-black dark:text-white">25% course completion</span> is required to write a review. Your current progress: <span className="font-bold text-black dark:text-white">{userProgress}%</span>.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {reviewSuccess && (
                    <div className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-3 text-xs text-black dark:text-white flex items-center gap-2">
                      <GoogleIcon name="check_circle" size={16} />
                      <span>Thank you! Your verified student review has been published.</span>
                    </div>
                  )}

                  {reviewError && (
                    <div className="rounded-md border border-neutral-400 bg-neutral-100 dark:bg-neutral-900 p-3 text-xs text-black dark:text-white flex items-center gap-2">
                      <GoogleIcon name="error" size={16} />
                      <span>{reviewError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-black dark:text-white mb-1.5">Rating</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <GoogleIcon
                            name="star"
                            size={20}
                            filled={star <= reviewRating}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-neutral-500 ml-2 font-semibold">
                        {reviewRating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black dark:text-white mb-1.5">
                      Your Detailed Experience
                    </label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="What did you think of the explanations, projects, and codebase architecture? Help other students make the right choice..."
                      rows={3}
                      required
                      minLength={3}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-xs text-black dark:text-white placeholder-neutral-500 focus:outline-none focus:border-black dark:focus:border-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={submittingReview || !reviewText.trim()}
                      loading={submittingReview}
                      rightIcon={<GoogleIcon name="send" size={14} />}
                    >
                      Post Verified Review
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Testimonials List */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-black dark:text-white">Learner Feedback</h3>
              {reviews.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-6 text-center text-xs text-neutral-500">
                  No learner reviews posted yet. Be the first enrolled student to share your review!
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-black dark:text-white">{rev.userName}</span>
                      <span className="text-neutral-500">
                        {(rev.createdAt as any)?.toDate ? (rev.createdAt as any).toDate().toLocaleDateString("en-IN") : "Recent"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-black dark:text-white">
                      {[...Array(rev.rating || 5)].map((_, idx) => (
                        <GoogleIcon key={idx} name="star" size={14} filled />
                      ))}
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{rev.reviewText}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 5: FAQ */}
        {activeTab === "faq" && (
          <div className="max-w-3xl space-y-4">
            <h2 className="text-lg font-bold text-black dark:text-white mb-4">Frequently Asked Questions</h2>
            {[
              {
                q: "How do I access course modules after enrolling?",
                a: "Once enrolled, all course modules, videos, and reading materials become accessible directly in your student learning portal under My Courses.",
              },
              {
                q: "Will I receive an official certificate?",
                a: "Yes! Upon completing all lessons and passing required milestones, an authentic GenZNex completion certificate with a verifiable QR code will be issued to your profile.",
              },
              {
                q: "Can I ask questions if I get stuck?",
                a: "Absolutely. Every course has an active community discussion forum where peers and instructors answer doubts within 24 hours.",
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-5 space-y-1.5">
                <h3 className="text-sm font-semibold text-black dark:text-white">{faq.q}</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
