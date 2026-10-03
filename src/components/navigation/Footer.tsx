import React from "react";
import Link from "next/link";
import { Zap, Heart, Shield, Lock, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-[#07080c] text-gray-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Brand & Corporate Overview */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 p-[1px] flex items-center justify-center">
                <div className="w-full h-full bg-[#0d0e17] rounded-[7px] flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </div>
              <span className="font-extrabold text-white text-base">GenZNex</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                Production Ready
              </span>
            </div>
            <p className="text-gray-400 max-w-sm text-xs leading-relaxed">
              GenZNex EdTech Private Limited. India&apos;s Next-Gen Developer Academy. Empowering engineering students and professionals with cohort bootcamps, verifiable credentials, and Razorpay-secured payments.
            </p>
            <div className="text-[11px] text-gray-500 space-y-0.5 pt-1">
              <p><strong>CIN:</strong> U80900DL2026PTC998877 | <strong>GSTIN:</strong> 07AABCU9603R1ZM</p>
              <p>241, East Permanur, Anna Park Backside, Salem-7, Tamil Nadu 636007</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
              <span className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                WCAG AA Compliant
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Lock className="w-3.5 h-3.5" />
                DPDP Act (2023) Ready
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Platform &amp; Learning
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/courses" className="hover:text-purple-400 transition-colors">Course Catalog</Link></li>
              <li><Link href="/programs" className="hover:text-purple-400 transition-colors">Cohort Programs</Link></li>
              <li><Link href="/forum" className="hover:text-purple-400 transition-colors">Doubt Clearing Forum</Link></li>
              <li><Link href="/leaderboard" className="hover:text-purple-400 transition-colors">Hall of Fame</Link></li>
              <li><Link href="/jobs" className="hover:text-purple-400 transition-colors">Placement Desk</Link></li>
              <li><Link href="/verify/GZN-2026-A1B2C3D4" className="hover:text-purple-400 transition-colors">Verify Certificate</Link></li>
            </ul>
          </div>

          {/* Legal & Razorpay Compliance */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Legal &amp; Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy (DPDP)</Link></li>
              <li><Link href="/terms" className="hover:text-purple-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/refunds" className="hover:text-purple-400 transition-colors">Refund &amp; Cancellation (7D)</Link></li>
              <li><Link href="/cookies" className="hover:text-purple-400 transition-colors">Cookie Policy</Link></li>
              <li><Link href="/accessibility" className="hover:text-purple-400 transition-colors">Accessibility Statement</Link></li>
              <li><Link href="/contact" className="hover:text-purple-400 transition-colors font-semibold text-purple-300">Contact &amp; Grievance</Link></li>
            </ul>
          </div>

          {/* System & Architecture */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Zero-Trust Architecture
            </h4>
            <ul className="space-y-2 text-xs text-gray-500">
              <li>Firebase 2nd Gen Functions</li>
              <li>Server-Side Pricing Engine</li>
              <li>Idempotent Webhooks</li>
              <li>Secret Manager Isolation</li>
              <li>Daily Pre-Aggregated Stats</li>
              <li>
                <a
                  href="http://127.0.0.1:4000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  <span>Emulator UI</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for Indian Tech Talent • GenZNex Academy</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} GenZNex EdTech Private Limited. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
