"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
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

  // Pricing breakdown (GST-inclusive)
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

  // Sandbox / Test simulation state
  const [sandboxOrder, setSandboxOrder] = useState<{
    orderId: string;
    amount: number;
    courseTitle: string;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

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

        // Course prices are GST-inclusive (18% GST: 9% CGST + 9% SGST)
        const total = data.discountPriceInPaise !== undefined ? data.discountPriceInPaise : data.priceInPaise || 0;
        const taxable = total === 0 ? 0 : Math.round((total * 100) / 118);
        const gst = total - taxable;
        setBreakdown({
          basePriceInPaise: total,
          discountInPaise: 0,
          taxableAmountInPaise: taxable,
          gstInPaise: gst,
          totalInPaise: total,
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

    const unsubscribe = onSnapshot(
      enrollmentRef,
      (snap) => {
        if (snap.exists() && snap.data()?.status === "active") {
          setProcessingStatus("Enrollment Confirmed! Redirecting to course...");
          setTimeout(() => {
            router.push(`/checkout/success?courseId=${course.id}&slug=${course.slug}`);
          }, 1200);
        }
      },
      (error) => {
        console.warn("Enrollment listener update:", error.message);
      }
    );

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

    const total = breakdown.basePriceInPaise;
    const taxable = total === 0 ? 0 : Math.round((total * 100) / 118);
    const gst = total - taxable;
    setBreakdown({
      basePriceInPaise: total,
      discountInPaise: 0,
      taxableAmountInPaise: taxable,
      gstInPaise: gst,
      totalInPaise: total,
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
    setSimError(null);

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

      // Check if Razorpay keys are not yet configured or in mock/emulator mode
      const isMockOrTest =
        !orderData.keyId ||
        orderData.keyId.includes("emulator") ||
        orderData.orderId?.startsWith("order_mock_");

      if (isMockOrTest) {
        // Immediately show the test simulation modal instead of hanging
        setIsProcessing(false);
        setProcessingStatus(null);
        setSandboxOrder({
          orderId: orderData.orderId,
          amount: orderData.amount,
          courseTitle: orderData.courseTitle || course.title,
        });
        return;
      }

      // Load Razorpay Checkout modal for real/live test keys
      setProcessingStatus("Loading secure payment gateway...");
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        // Fallback to sandbox modal if Razorpay script cannot load
        setIsProcessing(false);
        setProcessingStatus(null);
        setSandboxOrder({
          orderId: orderData.orderId,
          amount: orderData.amount,
          courseTitle: orderData.courseTitle || course.title,
        });
        return;
      }

      let modalOpened = false;
      const watchdog = setTimeout(() => {
        if (!modalOpened) {
          setIsProcessing(false);
          setProcessingStatus(null);
          setSandboxOrder({
            orderId: orderData.orderId,
            amount: orderData.amount,
            courseTitle: orderData.courseTitle || course.title,
          });
        }
      }, 3500);

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
          color: "#000000",
        },
        modal: {
          ondismiss: function () {
            clearTimeout(watchdog);
            setIsProcessing(false);
            setProcessingStatus(null);
          },
        },
        handler: async function (response: any) {
          clearTimeout(watchdog);
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

      try {
        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.on("payment.failed", function (response: any) {
          clearTimeout(watchdog);
          setIsProcessing(false);
          setProcessingStatus(null);
          router.push(
            `/checkout/failure?orderId=${orderData.orderId}&error=${encodeURIComponent(
              response.error?.description || "Payment was declined by your bank."
            )}`
          );
        });

        razorpayInstance.open();
        modalOpened = true;
      } catch (sdkErr) {
        clearTimeout(watchdog);
        console.warn("Razorpay instance initialization failed, opening test modal:", sdkErr);
        setIsProcessing(false);
        setProcessingStatus(null);
        setSandboxOrder({
          orderId: orderData.orderId,
          amount: orderData.amount,
          courseTitle: orderData.courseTitle || course.title,
        });
      }
    } catch (err: unknown) {
      console.error("Order creation failed:", err);
      setIsProcessing(false);
      setProcessingStatus(null);
      setError(err instanceof Error ? err.message : "Could not initialize checkout. Please try again.");
    }
  };

  // 6. Test Sandbox Simulator Handler
  const handleSimulatePayment = async (outcome: "success" | "failure") => {
    if (!sandboxOrder || !course) return;
    setIsSimulating(true);
    setSimError(null);

    if (outcome === "failure") {
      setTimeout(() => {
        setIsSimulating(false);
        const failOrderId = sandboxOrder.orderId;
        setSandboxOrder(null);
        router.push(
          `/checkout/failure?orderId=${failOrderId}&error=${encodeURIComponent(
            "Transaction declined in test simulator."
          )}`
        );
      }, 400);
      return;
    }

    try {
      const functions = getFirebaseFunctions();
      const verifyFn = httpsCallable<
        { orderId: string; paymentId: string; signature: string },
        { success: boolean; status: string; orderId: string }
      >(functions, "verifyPayment");

      const simPaymentId = `pay_sim_${Date.now()}`;
      await verifyFn({
        orderId: sandboxOrder.orderId,
        paymentId: simPaymentId,
        signature: "sandbox_valid_sig",
      });

      const successOrderId = sandboxOrder.orderId;
      setSandboxOrder(null);
      setIsSimulating(false);
      router.push(
        `/checkout/success?orderId=${successOrderId}&paymentId=${simPaymentId}&courseId=${course.id}`
      );
    } catch (err: unknown) {
      console.error("Simulation verify error:", err);
      setIsSimulating(false);
      setSimError(err instanceof Error ? err.message : "Test verification failed. Please try again.");
    }
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  if (loadingCourse || authLoading) {
    return (
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <GoogleIcon name="progress_activity" size={36} className="animate-spin mb-4 text-violet-600" />
          <p className="text-sm font-bold">Securing checkout session...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl">
            <GoogleIcon name="error" size={48} className="text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Checkout Error</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">{error || "Course not found"}</p>
            <Link href="/courses">
              <Button variant="primary">Browse All Courses</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex flex-col transition-colors">
      <Navbar />
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 mb-8 font-medium">
          <Link href="/courses" className="hover:text-black dark:hover:text-white transition-colors">
            Courses
          </Link>
          <span>/</span>
          <Link href={`/courses/${course.slug}`} className="hover:text-black dark:hover:text-white transition-colors truncate max-w-xs">
            {course.title}
          </Link>
          <span>/</span>
          <span className="text-black dark:text-white font-bold">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Course Summary & Coupon Code */}
          <div className="lg:col-span-7 space-y-6">
            {/* Course Card Summary */}
            <div className="p-6 rounded-xl bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-black text-white dark:bg-white dark:text-black">
                  {course.categoryName || course.category}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-medium capitalize border border-neutral-300 dark:border-neutral-700">
                  {course.level}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="relative w-full sm:w-44 h-28 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 shrink-0 border border-neutral-200 dark:border-neutral-800">
                  <Image
                    src={course.thumbnailUrl || "/images/placeholder.jpg"}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <h1 className="text-lg sm:text-xl font-bold leading-snug mb-2">{course.title}</h1>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">{course.subtitle}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    <span className="flex items-center gap-1">
                      <GoogleIcon name="star" size={16} />
                      <strong className="text-black dark:text-white">{course.rating || 4.9}</strong> ({course.ratingCount || 0})
                    </span>
                    <span className="flex items-center gap-1">
                      <GoogleIcon name="menu_book" size={16} />
                      {course.lessonCount || 0} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <GoogleIcon name="schedule" size={16} />
                      {Math.round((course.totalDurationMinutes || 120) / 60)}h total
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span>
                  Trainer: <strong className="text-black dark:text-white">{course.instructor?.name || "Senior Mentor"}</strong>
                </span>
                <span className="font-bold text-black dark:text-white">Instant Lifetime Access</span>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="p-6 rounded-xl bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <GoogleIcon name="local_offer" size={18} />
                <h3 className="text-sm font-bold">Have a Discount Coupon?</h3>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
                Use codes like <code className="bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 font-bold">GENZ20</code> for 20% off or <code className="bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 font-bold">FLAT500</code> for ₹500 discount.
              </p>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-black dark:border-white text-xs">
                  <div className="flex items-center gap-2">
                    <GoogleIcon name="check_circle" size={18} />
                    <span>
                      Coupon <strong className="tracking-wider">{appliedCoupon}</strong> applied! (Saved{" "}
                      {formatPrice(breakdown.discountInPaise)})
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                    title="Remove coupon"
                  >
                    <GoogleIcon name="close" size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code (e.g. GENZ20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2.5 text-xs text-black dark:text-white uppercase tracking-wider placeholder:normal-case placeholder:text-neutral-500 focus:outline-none focus:border-black dark:focus:border-white"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={couponLoading}
                    disabled={!couponCode.trim()}
                  >
                    Apply
                  </Button>
                </form>
              )}

              {couponError && (
                <p className="mt-2.5 text-xs text-black dark:text-white flex items-center gap-1.5 font-bold">
                  <GoogleIcon name="error" size={16} />
                  {couponError}
                </p>
              )}
              {couponSuccess && !appliedCoupon && (
                <p className="mt-2.5 text-xs text-black dark:text-white flex items-center gap-1.5 font-bold">
                  <GoogleIcon name="check_circle" size={16} />
                  {couponSuccess}
                </p>
              )}
            </div>

            {/* Trust Badges & Guarantee */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 flex items-center gap-2.5">
                <GoogleIcon name="verified_user" size={20} />
                <div className="text-[11px]">
                  <p className="font-bold">Razorpay Secure</p>
                  <p className="text-neutral-600 dark:text-neutral-400">256-bit SSL encryption</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 flex items-center gap-2.5">
                <GoogleIcon name="replay" size={20} />
                <div className="text-[11px]">
                  <p className="font-bold">7-Day Refund</p>
                  <p className="text-neutral-600 dark:text-neutral-400">No questions asked</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 flex items-center gap-2.5">
                <GoogleIcon name="workspace_premium" size={20} />
                <div className="text-[11px]">
                  <p className="font-bold">Verified Certificate</p>
                  <p className="text-neutral-600 dark:text-neutral-400">Included on completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Razorpay CTA */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="p-6 rounded-xl bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 shadow-xl space-y-6">
              <h2 className="text-base font-bold flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <span>Payment Summary</span>
                <span className="text-[11px] font-normal text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                  <GoogleIcon name="lock" size={14} />
                  Encrypted Checkout
                </span>
              </h2>

              {/* Price Breakdown (GST-Inclusive) */}
              <div className="space-y-3 text-xs text-neutral-700 dark:text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Course Price (Incl. 18% GST)</span>
                  <span className="font-bold text-black dark:text-white">{formatPrice(breakdown.basePriceInPaise)}</span>
                </div>

                {breakdown.discountInPaise > 0 && (
                  <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <GoogleIcon name="local_offer" size={14} />
                      Coupon Savings {appliedCoupon && `(${appliedCoupon})`}
                    </span>
                    <span>-{formatPrice(breakdown.discountInPaise)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 text-[11px]">Taxable Tuition Fee</span>
                  <span className="text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">{formatPrice(breakdown.taxableAmountInPaise)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500 text-[11px] flex items-center gap-1">
                    18% GST (CGST 9% + SGST 9%)
                    <span className="cursor-pointer" title="Government GST SAC Code 999293 - Included in course fee">
                      <GoogleIcon name="help" size={13} />
                    </span>
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">
                    {breakdown.gstInPaise === 0 ? "₹0.00" : formatPrice(breakdown.gstInPaise)}{" "}
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">(Included)</span>
                  </span>
                </div>

                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold">Total Payable</span>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <GoogleIcon name="check_circle" size={12} />
                      18% GST Included • No Extra Fees
                    </p>
                  </div>
                  <span className="text-2xl font-black text-black dark:text-white">
                    {breakdown.totalInPaise === 0 ? "FREE" : formatPrice(breakdown.totalInPaise)}
                  </span>
                </div>
              </div>

              {/* Student Details Pill */}
              <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-xs">
                <p className="text-neutral-600 dark:text-neutral-400 mb-1">Purchasing as:</p>
                <p className="font-bold truncate text-black dark:text-white">{userProfile?.displayName || user?.displayName || "Student"}</p>
                <p className="text-neutral-600 dark:text-neutral-400 truncate">{user?.email || "student@genznex.in"}</p>
              </div>

              {/* Action Button */}
              <div>
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={isProcessing}
                  rightIcon={!isProcessing ? <GoogleIcon name="arrow_forward" size={18} /> : undefined}
                >
                  {isProcessing
                    ? (processingStatus || "Processing...")
                    : breakdown.totalInPaise === 0
                    ? "Claim 100% Free Enrollment"
                    : `Pay ${formatPrice(breakdown.totalInPaise)} & Enroll`}
                </Button>
              </div>

              <div className="space-y-1 text-[10px] text-neutral-500 text-center">
                <p>By proceeding, you agree to the Terms of Service & Privacy Policy.</p>
                <p>Tax invoice with SAC Code 999293 will be issued immediately upon payment.</p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Razorpay Test / Developer Simulator Modal */}
        {sandboxOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-sm">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-white">Razorpay Test Gateway</h3>
                    <p className="text-[10px] text-neutral-500 font-mono">Sandbox Mode (Emulator / Developer)</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSandboxOrder(null);
                    setIsProcessing(false);
                  }}
                  disabled={isSimulating}
                  className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <GoogleIcon name="close" size={20} />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Course</span>
                  <span className="font-semibold text-black dark:text-white text-right max-w-[200px] truncate">
                    {sandboxOrder.courseTitle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Order ID</span>
                  <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                    {sandboxOrder.orderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Amount Payable</span>
                  <span className="font-bold text-black dark:text-white text-sm">
                    {formatPrice(sandboxOrder.amount)}
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>18% GST (CGST + SGST)</span>
                  <span>
                    Included (₹{((sandboxOrder.amount - Math.round((sandboxOrder.amount * 100) / 118)) / 100).toLocaleString("en-IN")})
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300">
                <p className="font-semibold mb-0.5">⚡ Razorpay Credentials Not Yet Connected</p>
                <p className="text-neutral-600 dark:text-neutral-400 text-[10px]">
                  Real merchant keys are not configured. You can test and complete your course enrollment immediately using this sandbox simulator.
                </p>
              </div>

              {simError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {simError}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <Button
                  onClick={() => handleSimulatePayment("success")}
                  loading={isSimulating}
                  disabled={isSimulating}
                  variant="primary"
                  fullWidth
                  size="md"
                  leftIcon={<GoogleIcon name="check_circle" size={18} />}
                >
                  {isSimulating ? "Verifying & Enrolling..." : "⚡ Complete Test Payment & Enroll"}
                </Button>

                <button
                  type="button"
                  onClick={() => handleSimulatePayment("failure")}
                  disabled={isSimulating}
                  className="w-full py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  Simulate Payment Failure
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSandboxOrder(null);
                    setIsProcessing(false);
                  }}
                  disabled={isSimulating}
                  className="w-full py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

