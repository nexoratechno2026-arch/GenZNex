import React from "react";
import Link from "next/link";
import { GoogleIcon } from "@/components/ui/GoogleIcon";

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 dark:border-neutral-800 light:border-neutral-200 bg-black dark:bg-black light:bg-white text-neutral-300 dark:text-neutral-300 light:text-neutral-700 text-xs py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Brand & Corporate Overview */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-white dark:bg-white light:bg-black flex items-center justify-center text-black dark:text-black light:text-white font-bold">
                <GoogleIcon name="bolt" size={18} filled />
              </div>
              <span className="font-bold text-white dark:text-white light:text-black text-base">GenZNex</span>
              <span className="text-[10px] bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-200 text-white dark:text-white light:text-black border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 px-1.5 py-0.5 rounded font-bold">
                Production Ready
              </span>
            </div>
            <p className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 max-w-sm text-xs leading-relaxed">
              GenZNex EdTech Private Limited. India&apos;s Next-Gen Developer Academy. Empowering engineering students and professionals with cohort bootcamps, verifiable credentials, and Razorpay-secured payments.
            </p>
            <div className="text-[11px] text-neutral-400 dark:text-neutral-400 light:text-neutral-600 space-y-0.5 pt-1">
              <p><strong>CIN:</strong> U80900DL2026PTC998877 | <strong>GSTIN:</strong> 07AABCU9603R1ZM</p>
              <p className="font-medium text-white dark:text-white light:text-black">
                241, East Permanur, Anna Park Backside, Salem-7, Tamil Nadu 636007
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-400 dark:text-neutral-400 light:text-neutral-600 pt-1">
              <span className="flex items-center gap-1 text-white dark:text-white light:text-black font-medium">
                <GoogleIcon name="verified" size={16} />
                WCAG AA Compliant
              </span>
              <span className="flex items-center gap-1 text-white dark:text-white light:text-black font-medium">
                <GoogleIcon name="lock" size={16} />
                DPDP Act (2023) Ready
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-bold text-white dark:text-white light:text-black uppercase text-[11px] tracking-wider mb-3">
              Platform &amp; Learning
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/courses" className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors">Course Catalog</Link></li>
              <li><Link href="/programs" className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors">Cohort Programs</Link></li>
              <li><Link href="/forum" className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors">Doubt Clearing Forum</Link></li>
              <li><Link href="/leaderboard" className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors">Hall of Fame</Link></li>
              <li><Link href="/jobs" className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors">Placement Desk</Link></li>
              <li><Link href="/verify/GZN-2026-A1B2C3D4" className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors">Verify Certificate</Link></li>
            </ul>
          </div>

          {/* Legal & Razorpay Compliance */}
          <div>
            <h4 className="font-bold text-white dark:text-white light:text-black uppercase text-[11px] tracking-wider mb-3">
              Trust &amp; Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/terms" className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors">Privacy Policy (DPDP)</Link></li>
              <li><Link href="/refunds" className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors">Refund &amp; Cancellation</Link></li>
              <li><Link href="/contact" className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors">Contact Support</Link></li>
              <li><Link href="/security" className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors">Security Disclosure</Link></li>
            </ul>
          </div>

          {/* Connect & Business Address */}
          <div>
            <h4 className="font-bold text-white dark:text-white light:text-black uppercase text-[11px] tracking-wider mb-3">
              Headquarters
            </h4>
            <div className="space-y-2 text-xs text-neutral-300 dark:text-neutral-300 light:text-neutral-700">
              <p className="flex items-start gap-1.5">
                <GoogleIcon name="location_on" size={16} className="mt-0.5" />
                <span>241, East Permanur, Anna Park Backside, Salem-7, Tamil Nadu 636007</span>
              </p>
              <p className="flex items-center gap-1.5">
                <GoogleIcon name="mail" size={16} />
                <span>support@genznex.in</span>
              </p>
              <p className="flex items-center gap-1.5">
                <GoogleIcon name="call" size={16} />
                <span>+91 427 241 7000</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 dark:border-neutral-800 light:border-neutral-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400 dark:text-neutral-400 light:text-neutral-600">
          <p>© {new Date().getFullYear()} GenZNex EdTech Private Limited. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Built with precision for India</span>
            <GoogleIcon name="favorite" size={14} className="text-neutral-400" />
            <span>Salem, Tamil Nadu</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
