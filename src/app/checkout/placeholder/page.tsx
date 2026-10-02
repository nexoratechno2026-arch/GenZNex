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
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col items-center justify-center text-center">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-violet-600/20 blur-xl animate-pulse" />
          <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-tr from-violet-600 to-pink-500 p-0.5 shadow-2xl">
            <div className="h-full w-full rounded-3xl bg-zinc-950 flex items-center justify-center text-violet-400">
              <CreditCard className="h-10 w-10" />
            </div>
          </div>
        </div>

        <div className="mt-8 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Payment Gateway Sandbox Notice</span>
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Razorpay Payments Arriving in <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Phase 3</span>
        </h1>

        <p className="mt-4 text-base text-zinc-400 max-w-xl">
          You are purchasing <strong className="text-zinc-200">"{courseTitle}"</strong> for <strong className="text-violet-400">{price}</strong>.
          Per project architecture, full live Razorpay payment processing (Order Creation Cloud Function, Razorpay Checkout modal, and Webhook verification) is built in Phase 3.
        </p>

        <div className="mt-8 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-left space-y-3.5 text-xs text-zinc-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Zero-Trust Architecture: Client will never write directly to /payments</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Server-side Firestore price validation via Firebase Cloud Functions</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>HMAC SHA256 Webhook signatures secured with Firebase Secret Manager</span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
            <span>Try enrolling in any <strong>Free Course</strong> right now to test instant live Cloud Function enrollment!</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Browse More Courses</span>
          </Link>
          <Link
            href="/courses?price=free"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-700 hover:text-white transition-colors"
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
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f]" />}>
      <PlaceholderCheckoutContent />
    </Suspense>
  );
}
