import React from "react";
import { Zap, Heart, Shield, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-[#07080c] text-gray-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 p-[1px] flex items-center justify-center">
                <div className="w-full h-full bg-[#0d0e17] rounded-[7px] flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </div>
              <span className="font-extrabold text-white text-base">GenZNex</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                v1.0 (Phase 1)
              </span>
            </div>
            <p className="text-gray-400 max-w-sm text-xs leading-relaxed">
              India&apos;s Gen Z EdTech Platform. Empowering students, trainers, and engineers with real-world LMS training, Razorpay integration, and zero-trust Firebase architecture.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
              <span className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                WCAG AA Compliant
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Lock className="w-3.5 h-3.5" />
                Zero-Trust Rules
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs">
              <li>Next.js 15 App Router</li>
              <li>Firebase Emulator Suite</li>
              <li>Cloud Functions 2nd Gen</li>
              <li>Razorpay Webhook Verification</li>
              <li>Signed Video Streaming</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Security Protocol
            </h4>
            <ul className="space-y-2 text-xs">
              <li>No Direct Client Payments Writes</li>
              <li>No Direct Client Enrollments Writes</li>
              <li>Server-Side Firestore Pricing</li>
              <li>Auth Custom Claims (RBAC)</li>
              <li>Google Secret Manager</li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for Indian Tech Talent • GenZNex LMS</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} GenZNex. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
