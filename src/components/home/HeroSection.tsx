import React from "react";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import type { UserRole } from "@/types";

interface HeroSectionProps {
  currentRole?: UserRole;
}

export function HeroSection({ currentRole }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Main Heading - Clean high contrast, Arial, pure white in dark, pure black in light */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1] text-white dark:text-white light:text-black">
          Level Up Your Tech Career. No Fluff. Pure Craft.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-neutral-300 dark:text-neutral-300 light:text-neutral-700 max-w-2xl mx-auto font-normal leading-relaxed">
          Master Full Stack, Generative AI, and DevOps built for India&apos;s modern software workforce. 
          Seamless Razorpay checkout, high-performance Cloud Functions 2nd Gen, and zero-trust security architecture.
        </p>

        {/* Action Buttons using Google Icons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#courses"
            id="hero-explore-courses-btn"
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg font-bold text-sm glow-btn-primary flex items-center justify-center gap-2"
          >
            <span>Explore Courses</span>
            <GoogleIcon name="arrow_forward" size={18} />
          </a>
          <a
            href="#emulator-status"
            id="hero-view-architecture-btn"
            className="w-full sm:w-auto px-6 py-3.5 rounded-lg font-bold text-sm glow-btn-secondary flex items-center justify-center gap-2"
          >
            <GoogleIcon name="verified_user" size={18} />
            <span>Verify Security Rules</span>
          </a>
        </div>

        {/* Architecture Highlight Metrics */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          
          <div className="glass-card p-5 rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-300">
            <div className="flex items-center gap-2 text-white dark:text-white light:text-black mb-2">
              <GoogleIcon name="payments" size={20} />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 light:text-neutral-600">Payments</span>
            </div>
            <div className="text-lg font-bold text-white dark:text-white light:text-black">Razorpay</div>
            <div className="text-xs text-neutral-400 dark:text-neutral-400 light:text-neutral-600 mt-1">
              Server-side pricing &amp; webhook verification
            </div>
          </div>

          <div className="glass-card p-5 rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-300">
            <div className="flex items-center gap-2 text-white dark:text-white light:text-black mb-2">
              <GoogleIcon name="security" size={20} />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 light:text-neutral-600">Security</span>
            </div>
            <div className="text-lg font-bold text-white dark:text-white light:text-black">Zero Client Write</div>
            <div className="text-xs text-neutral-400 dark:text-neutral-400 light:text-neutral-600 mt-1">
              Direct writes to payments &amp; enrollments blocked
            </div>
          </div>

          <div className="glass-card p-5 rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-300">
            <div className="flex items-center gap-2 text-white dark:text-white light:text-black mb-2">
              <GoogleIcon name="terminal" size={20} />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 light:text-neutral-600">Runtime</span>
            </div>
            <div className="text-lg font-bold text-white dark:text-white light:text-black">Functions 2nd Gen</div>
            <div className="text-xs text-neutral-400 dark:text-neutral-400 light:text-neutral-600 mt-1">
              TypeScript &amp; Secret Manager (defineSecret)
            </div>
          </div>

          <div className="glass-card p-5 rounded-lg border border-neutral-800 dark:border-neutral-800 light:border-neutral-300">
            <div className="flex items-center gap-2 text-white dark:text-white light:text-black mb-2">
              <GoogleIcon name="dns" size={20} />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 light:text-neutral-600">Dev Mode</span>
            </div>
            <div className="text-lg font-bold text-white dark:text-white light:text-black">Emulator Suite</div>
            <div className="text-xs text-neutral-400 dark:text-neutral-400 light:text-neutral-600 mt-1">
              100% offline emulator-first development
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
