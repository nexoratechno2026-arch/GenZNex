"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Tag,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Lock,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Clock,
  BookOpen,
  Star,
  Loader2,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { getCourseBySlug } from "@/lib/services/courseSearch";
import { getFirebaseFunctions, getFirebaseFirestore } from "@/lib/firebase/client";
import { httpsCallable } from "firebase/functions";
import { doc, onSnapshot } from "firebase/firestore";
import { CourseDoc } from "@/types/schema";

interface PriceBreakdown {
  basePriceInPaise: number;
  discountInPaise: number;
  taxableAmountInPaise: number;
  gstInPaise: number;
  totalInPaise: number;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const courseSlug = params?.courseSlug as string;

  const [course, setCourse] = useState<CourseDoc | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Pricing breakdown
  const [breakdown, setBreakdown] = useState<PriceBreakdown>({
    basePriceInPaise: 0,
    discountInPaise: 0,
    taxableAmountInPaise: 0,
    gstInPaise: 0,
    totalInPaise: 0,
  });

  // Payment processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // 1. Fetch course details by slug
  useEffect(() => {
    async function loadCourse() {
      if (!courseSlug) return;
      try {
        setLoadingCourse(true);
        const data = await getCourseBySlug(courseSlug);
        if (!data) {
          setError("Course not found or no longer available.");
          return;
        }
        setCourse(data);

        const base = data.discountPriceInPaise !== undefined ? data.discountPriceInPaise : data.priceInPaise || 0;
        const gst = Math.round(base * 0.18);
        setBreakdown({
          basePriceInPaise: base,
          discountInPaise: 0,
          taxableAmountInPaise: base,
          gstInPaise: gst,
          totalInPaise: base + gst,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load course details");
      } finally {
        setLoadingCourse(false);
      }
    }
    loadCourse();
  }, [courseSlug]);

  // 2. Real-time enrollment listener (auto-redirect when enrolled)
  useEffect(() => {
    if (!user || !course) return;

    const db = getFirebaseFirestore();
    const enrollmentRef = doc(db, "enrollments", `${user.uid}_${course.id}`);

    const unsubscribe = onSnapshot(enrollmentRef, (snap) => {
      if (snap.exists() && snap.data()?.status === "active") {
        setProcessingStatus("Enrollment Confirmed! Redirecting to course...");
        setTimeout(() => {
          router.push(`/checkout/success?courseId=${course.id}&slug=${course.slug}`);
        }, 1200);
      }
    });

    return () => unsubscribe();
  }, [user, course, router]);

  // 3. Handle Coupon Application via Cloud Function
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !course) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const functions = getFirebaseFunctions();
      const validateFn = httpsCallable<
        { code: string; courseId: string },
        {
          valid: boolean;
          code?: string;
          discountInPaise: number;
          taxableAmountInPaise: number;
          gstInPaise: number;
          totalInPaise: number;
          message?: string;
        }
      >(functions, "validateCoupon");

      const response = await validateFn({
        code: couponCode.trim(),
        courseId: course.id,
      });

      const res = response.data;
      if (res.valid) {
        setAppliedCoupon(res.code || couponCode.trim().toUpperCase());
        setCouponSuccess(res.message || "Coupon applied successfully!");
        setBreakdown({
          basePriceInPaise: breakdown.basePriceInPaise,
          discountInPaise: res.discountInPaise,
          taxableAmountInPaise: res.taxableAmountInPaise,
          gstInPaise: res.gstInPaise,
          totalInPaise: res.totalInPaise,
        });
      } else {
        setCouponError(res.message || "Invalid coupon code");
      }
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : "Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponSuccess(null);
    setCouponError(null);

    const base = breakdown.basePriceInPaise;
    const gst = Math.round(base * 0.18);
    setBreakdown({
      basePriceInPaise: base,
      discountInPaise: 0,
      taxableAmountInPaise: base,
      gstInPaise: gst,
      totalInPaise: base + gst,
    });
  };

  // 4. Load Razorpay script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 5. Checkout & Payment Handler
  const handlePayment = async () => {
    if (!user) {
      router.push(`/login?redirect=/checkout/${courseSlug}`);
      return;
    }

    if (!course) return;

    setIsProcessing(true);
    setProcessingStatus("Creating payment order...");

    try {
      const functions = getFirebaseFunctions();
      const createOrderFn = httpsCallable<
        { courseId: string; couponCode?: string },
        {
          orderId: string;
          amount: number;
          currency: string;
          keyId?: string;
          courseTitle: string;
          isFree: boolean;
        }
      >(functions, "createOrder");

      const orderRes = await createOrderFn({
        courseId: course.id,
        couponCode: appliedCoupon || undefined,
      });

      const orderData = orderRes.data;

      // Handle 100% Free Coupon bypass
      if (orderData.isFree) {
        setProcessingStatus("Enrollment complete! Redirecting...");
        setTimeout(() => {
          router.push(`/checkout/success?orderId=${orderData.orderId}&courseId=${course.id}`);
        }, 1000);
        return;
      }

      // Load Razorpay Checkout modal
      setProcessingStatus("Loading secure payment gateway...");
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Unable to connect to Razorpay payment gateway. Please check your network connection.");
      }

      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_emulator_key",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "GenZNex EdTech",
        description: `Enrollment: ${orderData.courseTitle}`,
        order_id: orderData.orderId,
        prefill: {
          name: userProfile?.displayName || user.displayName || "GenZNex Student",
          email: user.email || "",
          contact: userProfile?.phoneNumber || "9999999999",
        },
        theme: {
          color: "#7c3aed", // Gen Z violet
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setProcessingStatus(null);
          },
        },
        handler: async function (response: any) {
          setProcessingStatus("Verifying payment security signature...");
          try {
            const verifyFn = httpsCallable<
              { orderId: string; paymentId: string; signature: string },
              { success: boolean; status: string; orderId: string }
            >(functions, "verifyPayment");

            await verifyFn({
              orderId: response.razorpay_order_id || orderData.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            setProcessingStatus("Payment verified! Unlocking curriculum...");
            setTimeout(() => {
              router.push(
                `/checkout/success?orderId=${orderData.orderId}&paymentId=${response.razorpay_payment_id}&courseId=${course.id}`
              );
            }, 1000);
          } catch (verifyErr: unknown) {
            console.error("Verification error:", verifyErr);
            router.push(
              `/checkout/failure?orderId=${orderData.orderId}&error=${encodeURIComponent(
                verifyErr instanceof Error ? verifyErr.message : "Payment verification failed"
              )}`
            );
          }
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", function (response: any) {
        setIsProcessing(false);
        setProcessingStatus(null);
        router.push(
          `/checkout/failure?orderId=${orderData.orderId}&error=${encodeURIComponent(
            response.error?.description || "Payment was declined by your bank."
          )}`
        );
      });

      razorpayInstance.open();
    } catch (err: unknown) {
      console.error("Order creation failed:", err);
      setIsProcessing(false);
      setProcessingStatus(null);
      setError(err instanceof Error ? err.message : "Could not initialize checkout. Please try again.");
    }
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  if (loadingCourse || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-4" />
        <p className="text-sm font-medium">Securing checkout session...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Checkout Error</h2>
          <p className="text-sm text-zinc-400 mb-6">{error || "Course not found"}</p>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all"
          >
            Browse All Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-8">
          <Link href="/courses" className="hover:text-white transition-colors">
            Courses
          </Link>
          <span>/</span>
          <Link href={`/courses/${course.slug}`} className="hover:text-white transition-colors truncate max-w-xs">
            {course.title}
          </Link>
          <span>/</span>
          <span className="text-violet-400 font-semibold">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Course Summary & Coupon Code */}
          <div className="lg:col-span-7 space-y-6">
            {/* Course Card Summary */}
            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {course.categoryName || course.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize bg-zinc-800 text-zinc-300">
                  {course.level}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="relative w-full sm:w-44 h-28 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-800">
                  <Image
                    src={course.thumbnailUrl || "/images/placeholder.jpg"}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-white leading-snug mb-2">{course.title}</h1>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{course.subtitle}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <strong className="text-white">{course.rating || 4.9}</strong> ({course.ratingCount || 0})
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-zinc-500" />
                      {course.lessonCount || 0} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-500" />
                      {Math.round((course.totalDurationMinutes || 120) / 60)}h total
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Trainer: <strong className="text-white">{course.instructor?.name || "Senior Mentor"}</strong>
                </span>
                <span className="text-emerald-400 font-medium">Instant Lifetime Access</span>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white">Have a Discount Coupon?</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Use codes like <code className="text-violet-300 bg-violet-950/60 px-1.5 py-0.5 rounded border border-violet-800/40">GENZ20</code> for 20% off or <code className="text-violet-300 bg-violet-950/60 px-1.5 py-0.5 rounded border border-violet-800/40">FLAT500</code> for ₹500 discount.
              </p>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Coupon <strong className="tracking-wider">{appliedCoupon}</strong> applied! (Saved{" "}
                      {formatPrice(breakdown.discountInPaise)})
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-300 transition-colors"
                    title="Remove coupon"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code (e.g. GENZ20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white uppercase tracking-wider placeholder:normal-case placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                  >
                    {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                  </button>
                </form>
              )}

              {couponError && (
                <p className="mt-2.5 text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {couponError}
                </p>
              )}
              {couponSuccess && !appliedCoupon && (
                <p className="mt-2.5 text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  {couponSuccess}
                </p>
              )}
            </div>

            {/* Trust Badges & Guarantee */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <div className="text-[11px]">
                  <p className="font-bold text-white">Razorpay Secure</p>
                  <p className="text-zinc-400">256-bit SSL encryption</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2.5">
                <RotateCcw className="h-5 w-5 text-violet-400 shrink-0" />
                <div className="text-[11px]">
                  <p className="font-bold text-white">7-Day Refund</p>
                  <p className="text-zinc-400">No questions asked</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
                <div className="text-[11px]">
                  <p className="font-bold text-white">Verified Certificate</p>
                  <p className="text-zinc-400">Included on completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Razorpay CTA */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-6">
              <h2 className="text-base font-bold text-white flex items-center justify-between border-b border-zinc-800 pb-3">
                <span>Payment Summary</span>
                <span className="text-[11px] font-normal text-zinc-400 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-400" />
                  Encrypted Checkout
                </span>
              </h2>

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Course Price</span>
                  <span className="font-medium text-white">{formatPrice(breakdown.basePriceInPaise)}</span>
                </div>

                {breakdown.discountInPaise > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      Coupon Savings {appliedCoupon && `(${appliedCoupon})`}
                    </span>
                    <span className="font-bold">-{formatPrice(breakdown.discountInPaise)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-zinc-400">Taxable Subtotal</span>
                  <span className="font-medium text-white">{formatPrice(breakdown.taxableAmountInPaise)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400 flex items-center gap-1">
                    GST (18%)
                    <span className="group relative cursor-pointer" title="Government GST: 9% CGST + 9% SGST">
                      <HelpCircle className="h-3 w-3 text-zinc-500" />
                    </span>
                  </span>
                  <span className="font-medium text-white">
                    {breakdown.gstInPaise === 0 ? "₹0.00" : formatPrice(breakdown.gstInPaise)}
                  </span>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-white">Total Payable</span>
                    <p className="text-[10px] text-zinc-500">Includes all applicable taxes</p>
                  </div>
                  <span className="text-2xl font-black bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                    {breakdown.totalInPaise === 0 ? "FREE" : formatPrice(breakdown.totalInPaise)}
                  </span>
                </div>
              </div>

              {/* Student Details Pill */}
              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs">
                <p className="text-zinc-400 mb-1">Purchasing as:</p>
                <p className="font-bold text-white truncate">{userProfile?.displayName || user?.displayName || "Student"}</p>
                <p className="text-zinc-400 truncate">{user?.email || "student@genznex.in"}</p>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 p-[1px] font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:shadow-violet-600/50 disabled:opacity-50"
                >
                  <div className="relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 py-3.5 px-4 text-sm font-bold text-white group-hover:from-violet-500 group-hover:to-pink-500 transition-all">
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{processingStatus || "Processing..."}</span>
                      </>
                    ) : breakdown.totalInPaise === 0 ? (
                      <>
                        <span>Claim 100% Free Enrollment</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span>Pay {formatPrice(breakdown.totalInPaise)} & Enroll</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </div>
                </button>
              </div>

              <div className="space-y-1.5 text-[10px] text-zinc-500 text-center">
                <p>By proceeding, you agree to the Terms of Service & Privacy Policy.</p>
                <p>Tax invoice with SAC Code 999293 will be issued immediately upon payment.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
