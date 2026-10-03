import React from "react";
import Link from "next/link";
import { FileText, Scale, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | GenZNex EdTech India",
  description: "Terms and conditions governing course enrollments, cohort training, code of conduct, and platform access.",
};

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-3">
            <Scale className="w-3.5 h-3.5" />
            <span>Platform Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Last Revised: October 2, 2026 | Effective for all registered students, trainers, and applicants.
          </p>
          <div className="mt-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700 text-gray-300 text-xs">
            <strong>Legal Notice:</strong> This document represents a binding electronic contract between you and GenZNex EdTech Private Limited under the Information Technology Act, 2000.
          </div>
        </div>

        {/* Section 1: Acceptance & Eligibility */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>1. Account Registration &amp; Eligibility</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            By creating an account on GenZNex or enrolling in any course or cohort batch, you represent and warrant that:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-2">
            <li>You are at least 18 years of age or possess authorized parental/guardian consent if under 18.</li>
            <li>All registration details, including your full name, email, and academic qualifications, are truthful and accurate.</li>
            <li>You will maintain the confidentiality of your account credentials and not share access with unauthorized individuals.</li>
          </ul>
        </section>

        {/* Section 2: Intellectual Property & Course License */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <span>2. Intellectual Property &amp; Educational License</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            All videos, source code repositories, quiz question banks, architecture guides, and curriculum outlines provided on GenZNex are the exclusive intellectual property of GenZNex EdTech Private Limited and its licensed instructors.
          </p>
          <div className="p-4 rounded-xl bg-[#141525] border border-gray-800 text-xs text-gray-300 space-y-2">
            <p><strong>Permitted Use:</strong> You are granted a limited, personal, non-transferable, revocable license to view lessons, complete assignments, and download personal certificate credentials.</p>
            <p className="text-rose-400"><strong>Prohibited Use:</strong> Screen recording, ripping signed video streams, redistributing proprietary assignment code, or reselling course credentials constitutes copyright infringement and will result in immediate account termination without refund and legal prosecution under the Indian Copyright Act, 1957.</p>
          </div>
        </section>

        {/* Section 3: Student Code of Conduct & Forum Ethics */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>3. Community Code of Conduct &amp; Zero-Plagiarism Policy</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            GenZNex upholds high engineering integrity. Students agree to:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1.5 ml-2">
            <li>Submit authentic capstone project code and genuine quiz answers written personally.</li>
            <li>Maintain polite, constructive discourse on the Doubt Clearing Forums. Harassment, spam, illicit content, or discrimination will trigger automated moderation and bans.</li>
            <li>Respect live cohort schedule windows. Trainers reserve the right to remove disruptive participants from live Zoom/Meet sessions.</li>
          </ul>
        </section>

        {/* Section 4: Fees, Payments & GST Invoicing */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <span>4. Course Fees, Razorpay Checkout &amp; GST Invoicing</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            All course and bootcamp prices are quoted in Indian Rupees (INR) and are inclusive or clearly itemized with applicable 18% Goods and Services Tax (GST).
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Payments are securely routed through Razorpay Software Private Limited. Upon confirmation of payment, an official GST tax invoice with SAC Code 999293 is automatically generated and downloadable in the student billing portal.
          </p>
        </section>

        {/* Section 5: Governing Law & Jurisdiction */}
        <section className="space-y-3 p-5 rounded-2xl bg-[#121422] border border-gray-800">
          <h2 className="text-lg font-bold text-white">5. Governing Law &amp; Dispute Jurisdiction</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            These Terms of Service are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts located in New Delhi, India.
          </p>
        </section>

      </div>
    </div>
  );
}
