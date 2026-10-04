import React from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata = {
  title: "Refund & Cancellation Policy | GenZNex EdTech India",
  description: "7-day transparent money-back policy for self-paced courses and cohort batch enrollments.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 w-full">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <GoogleIcon name="arrow_back" size={16} />
          <span>Back to GenZNex Home</span>
        </Link>

        {/* Header */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-black dark:text-white mb-3">
            <GoogleIcon name="replay" size={16} />
            <span>7-Day Transparent Money-Back Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            Last Updated: October 2, 2026 | System Config Ref: 7-Day Refund Window (`/config/system`)
          </p>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="check_circle" size={20} />
            <span>1. Self-Paced Courses: 7-Day Satisfaction Guarantee</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            We want every Indian developer to learn with complete confidence. For all self-paced masterclasses:
          </p>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
            <div className="flex items-start gap-2">
              <GoogleIcon name="schedule" size={16} className="text-black dark:text-white shrink-0 mt-0.5" />
              <div>
                <strong className="text-black dark:text-white">Eligibility Window:</strong> You are eligible for a 100% full refund within <strong>7 calendar days</strong> from the date of confirmed payment.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <GoogleIcon name="verified_user" size={16} className="text-black dark:text-white shrink-0 mt-0.5" />
              <div>
                <strong className="text-black dark:text-white">Fair Usage Threshold:</strong> To prevent exploitation of downloadable course source code, refund requests are approved provided less than <strong>25% of course lessons</strong> have been marked completed and no certificate of completion has been issued.
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Cohort Batches & Live Bootcamps */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="group" size={20} />
            <span>2. Cohort Bootcamps &amp; Internship Tracks</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Cohort bootcamps have fixed seat limits (30-50 students) and dedicated trainer schedules:
          </p>
          <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1.5 ml-2">
            <li><strong className="text-black dark:text-white">Before Batch Kick-off:</strong> Full 100% refund if requested at least 48 hours prior to the batch start date.</li>
            <li><strong className="text-black dark:text-white">Within Week 1:</strong> 80% refund (20% retained for curriculum reservation fees and mentor allocation costs) if requested after attending no more than 1 live session.</li>
            <li><strong className="text-black dark:text-white">After Week 1:</strong> No refunds are issued after the conclusion of the first week of live sessions. Students may, however, request a one-time free batch transfer to a future cohort.</li>
          </ul>
        </section>

        {/* Section 3: Refund Processing Timeline */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="payments" size={20} />
            <span>3. Razorpay Settlement &amp; Bank Timelines</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Once your refund is approved by our billing desk:
          </p>
          <ol className="list-decimal list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1 ml-2">
            <li>The refund is executed immediately via the Razorpay Refund API (`refund.processed`).</li>
            <li>UPI &amp; NetBanking refunds typically reflect in your account within <strong>24 to 48 hours</strong>.</li>
            <li>Credit / Debit card refunds depend on your issuing bank and take <strong>5 to 7 business days</strong>.</li>
            <li>A credit note adjusting the original GST invoice is emailed to you automatically.</li>
          </ol>
        </section>

        {/* Section 4: How to Initiate a Refund */}
        <section className="space-y-3 p-5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="help" size={20} />
            <span>4. How to Request a Refund</span>
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            To initiate a cancellation or refund:
          </p>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1 mt-2">
            <p>1. Email <strong className="text-black dark:text-white">refunds@genznex.in</strong> from your registered GenZNex account email.</p>
            <p>2. Include your <strong className="text-black dark:text-white">Razorpay Payment ID</strong> (e.g. `pay_...`) and registered student name.</p>
            <p>3. Briefly mention the reason for refund to help us improve our curriculum.</p>
            <p className="font-bold text-black dark:text-white mt-2">Our support desk responds to all refund inquiries within <strong>24 business hours</strong>.</p>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
