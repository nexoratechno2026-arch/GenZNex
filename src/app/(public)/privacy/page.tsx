import React from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata = {
  title: "Privacy Policy | GenZNex EdTech India",
  description: "DPDP Act (2023) compliant privacy policy detailing zero-PII telemetry, student data rights, and grievance officer contact.",
};

export default function PrivacyPolicyPage() {
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
            <GoogleIcon name="shield" size={16} />
            <span>DPDP Act (2023) Compliant Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">
            Privacy Policy &amp; Data Protection
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            Last Updated: October 2, 2026 | Document Reference: GZN-POL-PRIV-2026-V1
          </p>
          <div className="mt-3 p-3 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs">
            <strong className="text-black dark:text-white">Notice:</strong> This policy template is published for regulatory compliance and transparency. It does not constitute formal legal advice.
          </div>
        </div>

        {/* Section 1: Introduction & Data Fiduciary */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="description" size={20} />
            <span>1. Identity of Data Fiduciary</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            GenZNex EdTech Private Limited (&quot;GenZNex&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates as a recognized Data Fiduciary under the Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;) and the Information Technology Act, 2000. We provide cohort-based software engineering bootcamps, self-paced courses, mock interview programs, and placement preparation desks.
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <strong className="text-black dark:text-white">Corporate Identification:</strong> CIN: U80900DL2026PTC998877 | GSTIN: 07AABCU9603R1ZM<br />
            <strong className="text-black dark:text-white">Registered Office:</strong> 241, East Permanur, Anna Park Backside, Salem-7, Tamil Nadu 636007, India.<br />
            <strong className="text-black dark:text-white">Email:</strong> privacy@genznex.in
          </p>
        </section>

        {/* Section 2: Personal Data We Collect */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="lock" size={20} />
            <span>2. Categories of Digital Personal Data Collected</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            We collect only the minimum personal data strictly necessary to deliver educational training, issue verifiable certificates, and process statutory tax invoices:
          </p>
          <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1.5 ml-2">
            <li><strong className="text-black dark:text-white">Identity &amp; Contact:</strong> Full legal name, email address, phone number (used exclusively for optional OTP authentication).</li>
            <li><strong className="text-black dark:text-white">Educational &amp; Placement Profile:</strong> Degree, college/university, graduation year, technical skills, resume PDFs, and project milestones.</li>
            <li><strong className="text-black dark:text-white">Transactional Records:</strong> Razorpay order ID, payment receipt ID, taxable amount, and GST state code. (Card details and bank credentials are processed exclusively by Razorpay and never stored on our servers).</li>
            <li><strong className="text-black dark:text-white">Learning Telemetry:</strong> Lesson progress percentages, quiz attempt timestamps, assignment grades, and XP ledger transactions.</li>
          </ul>
        </section>

        {/* Section 3: Purpose of Processing */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="visibility" size={20} />
            <span>3. Specified Purpose Limitation</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Personal data is processed strictly for:
          </p>
          <ol className="list-decimal list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1 ml-2">
            <li>Provisioning secure student accounts and role-based course access.</li>
            <li>Tracking course completion and cryptographically signing tamper-proof certificates.</li>
            <li>Complying with statutory Indian GST accounting standards and issuing tax invoices.</li>
            <li>Delivering cohort schedule notifications, trainer feedback, and live session join links.</li>
          </ol>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-bold">
            We never sell, rent, or monetize student personal data with third-party advertisers or recruitment brokers.
          </p>
        </section>

        {/* Section 4: Children's Data & Under-18 Learners */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="warning" size={20} />
            <span>4. Protection of Children&apos;s Data (Under-18 Users)</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            In compliance with Section 9 of the DPDP Act 2023:
          </p>
          <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1.5 ml-2">
            <li>Users under the age of 18 must obtain verifiable parental or legal guardian consent prior to enrolling in paid cohort bootcamps.</li>
            <li>We do not engage in targeted advertising, behavioral tracking, or psychological profiling directed at children.</li>
            <li>Parents and guardians may exercise the right to review, update, or request erasure of a child&apos;s account at any time by contacting our Grievance Officer.</li>
          </ul>
        </section>

        {/* Section 5: Student Data Rights (DPDP Act) */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="verified_user" size={20} />
            <span>5. Your Data Rights &amp; Self-Service Tools</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            As a Data Principal, you have the following enforceable rights under the DPDP Act:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h4 className="font-bold text-black dark:text-white text-sm">Right to Access &amp; Portability</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Export all your enrolled courses, certificates, quiz attempts, and achievements in JSON format instantly via your Account Settings.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h4 className="font-bold text-black dark:text-white text-sm">Right to Erasure (Account Deletion)</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Request permanent anonymization of your profile and discussion posts. Statutory tax invoices are retained in anonymized form as required by Indian tax laws.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h4 className="font-bold text-black dark:text-white text-sm">Leaderboard Privacy Opt-Out</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Toggle your profile visibility on the global and weekly leaderboards to show as &quot;Anonymous Learner&quot; at any time.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h4 className="font-bold text-black dark:text-white text-sm">Quiet Hours &amp; Push Controls</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Set personalized quiet hours (Asia/Kolkata timezone) to mute push and email notifications during evening and study hours.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Grievance Redressal */}
        <section className="space-y-3 p-5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-black dark:text-white">6. Grievance Redressal Officer (Rule 3(2) IT Rules, 2021)</h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            In accordance with the Information Technology Act 2000 and DPDP Act 2023, our designated Grievance Officer details are published below:
          </p>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1 mt-2">
            <p><strong className="text-black dark:text-white">Name:</strong> Rajesh Vardhan</p>
            <p><strong className="text-black dark:text-white">Designation:</strong> Data Protection &amp; Grievance Redressal Officer</p>
            <p><strong className="text-black dark:text-white">Email:</strong> grievance@genznex.in</p>
            <p><strong className="text-black dark:text-white">Address:</strong> 241, East Permanur, Anna Park Backside, Salem-7, Tamil Nadu 636007, India</p>
            <p><strong className="text-black dark:text-white">Turnaround SLA:</strong> Acknowledgement within 24 hours; resolution within 15 business days.</p>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
