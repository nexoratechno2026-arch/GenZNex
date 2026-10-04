import React from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { ResetConsentButton } from "@/components/legal/ResetConsentButton";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata = {
  title: "Cookie Policy | GenZNex EdTech India",
  description: "Transparent cookie usage policy explaining session authentication and zero-PII privacy telemetry.",
};

export default function CookiePolicyPage() {
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
            <GoogleIcon name="cookie" size={16} />
            <span>Zero-PII Telemetry &amp; Cookie Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            Last Updated: October 2, 2026 | India Digital Personal Data Protection (DPDP) Standards
          </p>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="shield" size={20} />
            <span>1. What are Cookies and Local Storage?</span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Cookies and browser LocalStorage tokens are compact data packets placed on your device to ensure secure session authentication, remember player volume settings, and measure educational course completion rates.
          </p>
        </section>

        {/* Section 2: Types of Cookies We Use */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-black dark:text-white">2. Categories of Storage Employed</h2>
          
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-black dark:text-white text-sm">Essential &amp; Security Cookies (Mandatory)</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black font-bold">Strictly Necessary</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Required for Firebase Authentication tokens (`__session`), dark/light theme state (`genznex_theme`), and Razorpay checkout session security. These cannot be switched off as the platform cannot function without them.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-black dark:text-white text-sm">Privacy-Preserving Telemetry (Optional)</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-400 text-black dark:text-white font-bold">Opt-In Consent</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                We track aggregated lesson completion events and course drop-off rates with zero Personally Identifiable Information (zero PII) to identify difficult modules. You can grant or revoke this consent at any time via the banner or cookie settings.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Managing Preferences */}
        <section className="space-y-3 p-5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <GoogleIcon name="check_circle" size={20} />
            <span>3. How to Manage Your Consent</span>
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            You can modify your browser settings to decline all cookies or clear your cache at any time. To reset your platform analytics consent:
          </p>
          <div className="mt-2">
            <ResetConsentButton />
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
