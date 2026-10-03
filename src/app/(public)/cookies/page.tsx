import React from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";
import { ResetConsentButton } from "@/components/legal/ResetConsentButton";

export const metadata = {
  title: "Cookie Policy | GenZNex EdTech India",
  description: "Transparent cookie usage policy explaining session authentication and zero-PII privacy telemetry.",
};

export default function CookiePolicyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
            <Cookie className="w-3.5 h-3.5" />
            <span>Zero-PII Telemetry &amp; Cookie Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Last Updated: October 2, 2026 | India Digital Personal Data Protection (DPDP) Standards
          </p>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>1. What are Cookies and Local Storage?</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Cookies and browser LocalStorage tokens are compact data packets placed on your device to ensure secure session authentication, remember player volume settings, and measure educational course completion rates.
          </p>
        </section>

        {/* Section 2: Types of Cookies We Use */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">2. Categories of Storage Employed</h2>
          
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#141525] border border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">Essential &amp; Security Cookies (Mandatory)</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Strictly Necessary</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Required for Firebase Authentication tokens (`__session`), dark/light theme state (`genznex_theme`), and Razorpay checkout session security. These cannot be switched off as the platform cannot function without them.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#141525] border border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">Privacy-Preserving Telemetry (Optional)</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">Opt-In Consent</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                We track aggregated lesson completion events and course drop-off rates with zero Personally Identifiable Information (zero PII) to identify difficult modules. You can grant or revoke this consent at any time via the banner or cookie settings.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Managing Preferences */}
        <section className="space-y-3 p-5 rounded-2xl bg-[#121422] border border-gray-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>3. How to Manage Your Consent</span>
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            You can modify your browser settings to decline all cookies or clear your cache at any time. To reset your platform analytics consent:
          </p>
          <div className="mt-2">
            <ResetConsentButton />
          </div>
        </section>

      </div>
    </div>
  );
}
