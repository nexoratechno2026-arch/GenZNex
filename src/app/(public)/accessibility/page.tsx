import React from "react";
import Link from "next/link";
import { CheckCircle2, HeartHandshake, Eye, Sparkles, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Accessibility Statement | GenZNex EdTech India",
  description: "Commitment to WCAG 2.1 AA accessibility standards, keyboard navigation, and inclusive learning.",
};

export default function AccessibilityStatementPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>WCAG 2.1 Level AA Conformance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Accessibility Statement
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Inclusive learning engineering for every student across India.
          </p>
        </div>

        {/* Section 1: Commitment */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>1. Our Inclusive Design Philosophy</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            GenZNex is engineered to ensure that digital education is accessible to all learners, regardless of ability or technological constraints. We target compliance with the World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
          </p>
        </section>

        {/* Section 2: Conformance Features */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">2. Conformance Measures Implemented</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#141525] border border-gray-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Keyboard Navigation</span>
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Full logical Tab traversal across all interactive forms, quiz selectors, code sandboxes, and video player play/pause/seek controls.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#141525] border border-gray-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Screen Reader Support</span>
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Semantic HTML5 markup with descriptive `aria-label`, `role`, and live-region announcements for quiz scores, timers, and alerts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#141525] border border-gray-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Contrast &amp; Legibility</span>
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                High-contrast ratios meeting minimum 4.5:1 for normal text across both our Gen Z dark theme and daytime high-visibility mode.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#141525] border border-gray-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Captions &amp; Transcripts</span>
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Video player streams integrate synchronized English subtitles and downloadable lesson summary PDF transcripts.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Feedback & Contact */}
        <section className="space-y-3 p-5 rounded-2xl bg-[#121422] border border-gray-800">
          <h2 className="text-lg font-bold text-white">3. Accessibility Feedback &amp; Assistance</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            If you encounter an accessibility barrier on any course page or player, please contact our team:
          </p>
          <div className="text-xs text-gray-300 space-y-1 mt-2">
            <p><strong>Email:</strong> accessibility@genznex.in</p>
            <p><strong>Phone:</strong> +91 124 456 7890 (Mon - Fri, 10:00 AM - 6:00 PM IST)</p>
            <p><strong>Turnaround SLA:</strong> Immediate response within 2 business days.</p>
          </div>
        </section>

      </div>
    </div>
  );
}
