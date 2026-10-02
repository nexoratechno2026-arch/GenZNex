import React from "react";
import { Sparkles, Shield, ArrowRight, Code2, Zap } from "lucide-react";
import type { UserRole } from "@/types";

interface HeroSectionProps {
  currentRole: UserRole;
}

export function HeroSection({ currentRole }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-cyan-500/15 to-emerald-400/10 blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Gen Z Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300 mb-6 shadow-sm shadow-purple-500/10">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>India&apos;s Gen Z Tech Academy &amp; LMS</span>
          <span className="text-gray-500">•</span>
          <span className="text-emerald-400 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Active Role: <span className="uppercase font-bold">{currentRole}</span>
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Level Up Your Tech Career.{" "}
          <span className="glow-text-gradient">No Fluff. Pure Craft.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Master Full Stack, Generative AI, and DevOps built for India&apos;s modern software workforce. 
          Seamless Razorpay checkout, high-performance Cloud Functions 2nd Gen, and zero-trust security architecture.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#courses"
            id="hero-explore-courses-btn"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm glow-btn-primary flex items-center justify-center gap-2"
          >
            <span>Explore Courses</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#emulator-status"
            id="hero-view-architecture-btn"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm glow-btn-secondary flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Verify Security Rules</span>
          </a>
        </div>

        {/* Trust & Architecture Highlight Metrics */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Payments</span>
            </div>
            <div className="text-xl font-black text-white">Razorpay</div>
            <div className="text-xs text-gray-400 mt-1">
              Server-side pricing &amp; webhook verification
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Security</span>
            </div>
            <div className="text-xl font-black text-white">Zero Client Write</div>
            <div className="text-xs text-gray-400 mt-1">
              Direct writes to payments &amp; enrollments blocked
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Code2 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Runtime</span>
            </div>
            <div className="text-xl font-black text-white">Functions 2nd Gen</div>
            <div className="text-xs text-gray-400 mt-1">
              TypeScript &amp; Secret Manager (`defineSecret`)
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Dev Mode</span>
            </div>
            <div className="text-xl font-black text-white">Emulator Suite</div>
            <div className="text-xs text-gray-400 mt-1">
              100% offline emulator-first development
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
