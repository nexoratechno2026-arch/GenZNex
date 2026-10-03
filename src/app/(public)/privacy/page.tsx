import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText, AlertCircle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | GenZNex EdTech India",
  description: "DPDP Act (2023) compliant privacy policy detailing zero-PII telemetry, student data rights, and grievance officer contact.",
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DPDP Act (2023) Compliant Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy &amp; Data Protection
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Last Updated: October 2, 2026 | Document Reference: GZN-POL-PRIV-2026-V1
          </p>
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <strong>Notice:</strong> This policy template is published for regulatory compliance and transparency. It does not constitute formal legal advice.
          </div>
        </div>

        {/* Section 1: Introduction & Data Fiduciary */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <span>1. Identity of Data Fiduciary</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            GenZNex EdTech Private Limited (&quot;GenZNex&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates as a recognized Data Fiduciary under the Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;) and the Information Technology Act, 2000. We provide cohort-based software engineering bootcamps, self-paced courses, mock interview programs, and placement preparation desks.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            <strong>Corporate Identification:</strong> CIN: U80900DL2026PTC998877 | GSTIN: 07AABCU9603R1ZM<br />
            <strong>Registered Office:</strong> Level 4, Cyber City, Gurugram, Haryana 122002, India.<br />
            <strong>Email:</strong> privacy@genznex.in
          </p>
        </section>

        {/* Section 2: Personal Data We Collect */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            <span>2. Categories of Digital Personal Data Collected</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            We collect only the minimum personal data strictly necessary to deliver educational training, issue verifiable certificates, and process statutory tax invoices:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1.5 ml-2">
            <li><strong>Identity &amp; Contact:</strong> Full legal name, email address, phone number (used exclusively for optional OTP authentication).</li>
            <li><strong>Educational &amp; Placement Profile:</strong> Degree, college/university, graduation year, technical skills, resume PDFs, and project milestones.</li>
            <li><strong>Transactional Records:</strong> Razorpay order ID, payment receipt ID, taxable amount, and GST state code. (Card details and bank credentials are processed exclusively by Razorpay and never stored on our servers).</li>
            <li><strong>Learning Telemetry:</strong> Lesson progress percentages, quiz attempt timestamps, assignment grades, and XP ledger transactions.</li>
          </ul>
        </section>

        {/* Section 3: Purpose of Processing */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-400" />
            <span>3. Specified Purpose Limitation</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Personal data is processed strictly for:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1 ml-2">
            <li>Provisioning secure student accounts and role-based course access.</li>
            <li>Tracking course completion and cryptographically signing tamper-proof certificates.</li>
            <li>Complying with statutory Indian GST accounting standards and issuing tax invoices.</li>
            <li>Delivering cohort schedule notifications, trainer feedback, and live session join links.</li>
          </ol>
          <p className="text-sm text-gray-300 leading-relaxed font-semibold text-emerald-400">
            We never sell, rent, or monetize student personal data with third-party advertisers or recruitment brokers.
          </p>
        </section>

        {/* Section 4: Children's Data & Under-18 Learners */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span>4. Protection of Children&apos;s Data (Under-18 Users)</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            In compliance with Section 9 of the DPDP Act 2023:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1.5 ml-2">
            <li>Users under the age of 18 must obtain verifiable parental or legal guardian consent prior to enrolling in paid cohort bootcamps.</li>
            <li>We do not engage in targeted advertising, behavioral tracking, or psychological profiling directed at children.</li>
            <li>Parents and guardians may exercise the right to review, update, or request erasure of a child&apos;s account at any time by contacting our Grievance Officer.</li>
          </ul>
        </section>

        {/* Section 5: Student Data Rights (DPDP Act) */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>5. Your Data Rights &amp; Self-Service Tools</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            As a Data Principal, you have the following enforceable rights under the DPDP Act:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div className="p-4 rounded-xl bg-[#141525] border border-gray-800">
              <h4 className="font-bold text-white text-sm">Right to Access &amp; Portability</h4>
              <p className="text-xs text-gray-400 mt-1">
                Export all your enrolled courses, certificates, quiz attempts, and achievements in JSON format instantly via your Account Settings.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#141525] border border-gray-800">
              <h4 className="font-bold text-white text-sm">Right to Erasure (Account Deletion)</h4>
              <p className="text-xs text-gray-400 mt-1">
                Request permanent anonymization of your profile and discussion posts. Statutory tax invoices are retained in anonymized form as required by Indian tax laws.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#141525] border border-gray-800">
              <h4 className="font-bold text-white text-sm">Leaderboard Privacy Opt-Out</h4>
              <p className="text-xs text-gray-400 mt-1">
                Toggle your profile visibility on the global and weekly leaderboards to show as &quot;Anonymous Learner&quot; at any time.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#141525] border border-gray-800">
              <h4 className="font-bold text-white text-sm">Quiet Hours &amp; Push Controls</h4>
              <p className="text-xs text-gray-400 mt-1">
                Set personalized quiet hours (Asia/Kolkata timezone) to mute push and email notifications during evening and study hours.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Grievance Redressal */}
        <section className="space-y-3 p-5 rounded-2xl bg-[#121422] border border-purple-500/30">
          <h2 className="text-lg font-bold text-white">6. Grievance Redressal Officer (Rule 3(2) IT Rules, 2021)</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            In accordance with the Information Technology Act 2000 and DPDP Act 2023, our designated Grievance Officer details are published below:
          </p>
          <div className="text-xs text-gray-300 space-y-1 mt-2">
            <p><strong>Name:</strong> Rajesh Vardhan</p>
            <p><strong>Designation:</strong> Data Protection &amp; Grievance Redressal Officer</p>
            <p><strong>Email:</strong> grievance@genznex.in</p>
            <p><strong>Address:</strong> Level 4, DLF Cyber City, Gurugram, Haryana 122002, India</p>
            <p><strong>Turnaround SLA:</strong> Acknowledgement within 24 hours; resolution within 15 business days.</p>
          </div>
        </section>

      </div>
    </div>
  );
}
