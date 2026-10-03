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
    <div className="min-h-screen bg-[#090a0f] text-gray-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-[#141525] border border-gray-800">
        
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            You&apos;re Currently Offline
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            Please check your network connection or mobile data. Your quiz attempts and video progress will sync automatically once connectivity is restored.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <OfflineReloadButton />
          
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
