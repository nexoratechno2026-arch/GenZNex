import React from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata = {
  title: "Accessibility Statement | GenZNex EdTech India",
  description: "Commitment to WCAG 2.1 AA accessibility standards, keyboard navigation, and inclusive learning.",
};

export default function AccessibilityStatementPage() {
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
            <GoogleIcon name="accessibility" size={16} />
            <span>WCAG 2.1 Level AA Conformance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">
            Accessibility Statement
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            Inclusive learning engineering for every student across India.
          </p>
        </div>

        {/* Section 1: Commitment */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="auto_awesome" size={20} />
            <span>1. Our Inclusive Design Philosophy</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            GenZNex is engineered to ensure that digital education is accessible to all learners, regardless of ability or technological constraints. We target compliance with the World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
          </p>
        </section>

        {/* Section 2: Conformance Features */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-black dark:text-white">2. Conformance Measures Implemented</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h4 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                <GoogleIcon name="check_circle" size={16} />
                <span>Keyboard Navigation</span>
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Full logical Tab traversal across all interactive forms, quiz selectors, code sandboxes, and video player play/pause/seek controls.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h4 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                <GoogleIcon name="check_circle" size={16} />
                <span>Screen Reader Support</span>
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Semantic HTML5 markup with descriptive `aria-label`, `role`, and live-region announcements for quiz scores, timers, and alerts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h4 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                <GoogleIcon name="check_circle" size={16} />
                <span>Contrast &amp; Legibility</span>
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                High-contrast ratios meeting minimum 4.5:1 for normal text across both our Gen Z dark theme and daytime high-visibility mode.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h4 className="font-bold text-black dark:text-white text-sm flex items-center gap-2">
                <GoogleIcon name="check_circle" size={16} />
                <span>Captions &amp; Transcripts</span>
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Video player streams integrate synchronized English subtitles and downloadable lesson summary PDF transcripts.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Feedback & Contact */}
        <section className="space-y-3 p-5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-black dark:text-white">3. Accessibility Feedback &amp; Assistance</h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            If you encounter an accessibility barrier on any course page or player, please contact our team:
          </p>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1 mt-2">
            <p><strong className="text-black dark:text-white">Email:</strong> accessibility@genznex.in</p>
            <p><strong className="text-black dark:text-white">Phone:</strong> +91 427 241 7000 (Mon - Sat, 09:30 AM - 06:30 PM IST)</p>
            <p><strong className="text-black dark:text-white">Turnaround SLA:</strong> Immediate response within 2 business days.</p>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
