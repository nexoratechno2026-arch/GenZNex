"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, Sparkles, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

function PlaceholderCheckoutContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const courseTitle = searchParams.get("title") || "Selected Course";
  const price = searchParams.get("price") || "₹1,999";

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col items-center justify-center text-center">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-violet-600/20 blur-xl animate-pulse" />
          <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-tr from-violet-600 to-pink-500 p-0.5 shadow-2xl">
            <div className="h-full w-full rounded-3xl bg-white dark:bg-neutral-950 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <CreditCard className="h-10 w-10" />
            </div>
          </div>
        </div>

        <div className="mt-8 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Payment Gateway Sandbox Notice</span>
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Razorpay Payments Arriving in <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500">Phase 3</span>
        </h1>

        <p className="mt-4 text-base text-neutral-600 dark:text-neutral-400 max-w-xl">
          You are purchasing <strong className="text-neutral-900 dark:text-neutral-200">&ldquo;{courseTitle}&rdquo;</strong> for <strong className="text-violet-600 dark:text-violet-400">{price}</strong>.
          Per project architecture, full live Razorpay payment processing (Order Creation Cloud Function, Razorpay Checkout modal, and Webhook verification) is built in Phase 3.
        </p>

        <div className="mt-8 w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-6 text-left space-y-3.5 text-xs text-neutral-700 dark:text-neutral-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Zero-Trust Architecture: Client will never write directly to /payments</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Server-side Firestore price validation via Firebase Cloud Functions</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>HMAC SHA256 Webhook signatures secured with Firebase Secret Manager</span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
            <span>Try enrolling in any <strong>Free Course</strong> right now to test instant live Cloud Function enrollment!</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/courses"
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Browse More Courses</span>
          </Link>
          <Link
            href="/courses?price=free"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors"
          >
            <span>Explore Free Courses</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PlaceholderCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-black" />}>
      <PlaceholderCheckoutContent />
    </Suspense>
  );
}
