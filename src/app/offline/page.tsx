import React from "react";
import Link from "next/link";
import { WifiOff, ArrowLeft } from "lucide-react";
import { OfflineReloadButton } from "@/components/offline/OfflineReloadButton";

export const metadata = {
  title: "Offline | GenZNex",
  description: "You appear to be offline. Reconnect to resume learning.",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl">
        
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            You&apos;re Currently Offline
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Please check your network connection or mobile data. Your quiz attempts and video progress will sync automatically once connectivity is restored.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <OfflineReloadButton />
          
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors flex items-center justify-center gap-1.5 border border-neutral-300 dark:border-neutral-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
