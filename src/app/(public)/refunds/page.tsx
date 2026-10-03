import React from "react";
import Link from "next/link";
import { RefreshCcw, CheckCircle2, Clock, HelpCircle, ArrowLeft, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Refund & Cancellation Policy | GenZNex EdTech India",
  description: "7-day transparent money-back policy for self-paced courses and cohort batch enrollments.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-200 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GenZNex Home</span>
        </Link>

        {/* Header */}
        <div className="border-b border-gray-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>7-Day Transparent Money-Back Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Last Updated: October 2, 2026 | System Config Ref: 7-Day Refund Window (`/config/system`)
          </p>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>1. Self-Paced Courses: 7-Day Satisfaction Guarantee</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            We want every Indian developer to learn with complete confidence. For all self-paced masterclasses:
          </p>
          <div className="p-4 rounded-xl bg-[#141525] border border-gray-800 text-xs text-gray-300 space-y-2">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong>Eligibility Window:</strong> You are eligible for a 100% full refund within <strong>7 calendar days</strong> from the date of confirmed payment.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong>Fair Usage Threshold:</strong> To prevent exploitation of downloadable course source code, refund requests are approved provided less than <strong>25% of course lessons</strong> have been marked completed and no certificate of completion has been issued.
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Cohort Batches & Live Bootcamps */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span>2. Cohort Bootcamps &amp; Internship Tracks</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Cohort bootcamps have fixed seat limits (30-50 students) and dedicated trainer schedules:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1.5 ml-2">
            <li><strong>Before Batch Kick-off:</strong> Full 100% refund if requested at least 48 hours prior to the batch start date.</li>
            <li><strong>Within Week 1:</strong> 80% refund (20% retained for curriculum reservation fees and mentor allocation costs) if requested after attending no more than 1 live session.</li>
            <li><strong>After Week 1:</strong> No refunds are issued after the conclusion of the first week of live sessions. Students may, however, request a one-time free batch transfer to a future cohort.</li>
          </ul>
        </section>

        {/* Section 3: Refund Processing Timeline */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-cyan-400" />
            <span>3. Razorpay Settlement &amp; Bank Timelines</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Once your refund is approved by our billing desk:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1 ml-2">
            <li>The refund is executed immediately via the Razorpay Refund API (`refund.processed`).</li>
            <li>UPI &amp; NetBanking refunds typically reflect in your account within <strong>24 to 48 hours</strong>.</li>
            <li>Credit / Debit card refunds depend on your issuing bank and take <strong>5 to 7 business days</strong>.</li>
            <li>A credit note adjusting the original GST invoice is emailed to you automatically.</li>
          </ol>
        </section>

        {/* Section 4: How to Initiate a Refund */}
        <section className="space-y-3 p-5 rounded-2xl bg-[#121422] border border-gray-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <span>4. How to Request a Refund</span>
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            To initiate a cancellation or refund:
          </p>
          <div className="text-xs text-gray-300 space-y-1 mt-2">
            <p>1. Email <strong>refunds@genznex.in</strong> from your registered GenZNex account email.</p>
            <p>2. Include your <strong>Razorpay Payment ID</strong> (e.g. `pay_...`) and registered student name.</p>
            <p>3. Briefly mention the reason for refund to help us improve our curriculum.</p>
            <p className="text-emerald-400 mt-2">Our support desk responds to all refund inquiries within <strong>24 business hours</strong>.</p>
          </div>
        </section>

      </div>
    </div>
  );
}
