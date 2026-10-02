"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle, RefreshCw, ArrowLeft, LifeBuoy, AlertTriangle, Loader2 } from "lucide-react";

function FailureContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const errorMsg = searchParams.get("error");

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl text-center">
        {/* Failure Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 mb-6">
          <XCircle className="h-9 w-9" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Payment Incomplete</h1>
        <p className="text-xs text-zinc-400 mb-6">
          Your payment could not be processed. Don't worry—if any funds were deducted, they will be reversed by your bank within 24-48 hours.
        </p>

        {/* Error Detail */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-left text-xs mb-6 space-y-2">
          {errorMsg && (
            <div className="flex items-start gap-2 text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{decodeURIComponent(errorMsg)}</span>
            </div>
          )}
          {orderId && (
            <div className="flex justify-between text-zinc-500 text-[11px] pt-1">
              <span>Order Reference:</span>
              <code className="text-zinc-400 font-mono">{orderId}</code>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-xs text-white shadow-lg shadow-violet-600/30 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Payment Again</span>
          </button>

          <Link
            href="/courses"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-all border border-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Browse Other Courses</span>
          </Link>

          <a
            href="mailto:payments@genznex.in"
            className="inline-flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-400 pt-2 transition-colors"
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            <span>Need help? Contact payment support</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </div>
      }
    >
      <FailureContent />
    </Suspense>
  );
}
