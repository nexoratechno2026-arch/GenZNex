"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  const consent = localStorage.getItem("genznex_analytics_consent");
  if (consent !== "granted") {
    // DPDP protection: do not fire analytics if consent not explicitly granted
    return;
  }

  // Safe parameters only: Strip any PII (email, phone, name)
  const safeParams: Record<string, any> = {};
  for (const [k, v] of Object.entries(params)) {
    if (!["email", "phone", "phoneNumber", "name", "studentName"].includes(k)) {
      safeParams[k] = v;
    }
  }

  // Log in emulator / console or forward to window.gtag if present
  console.log(`[Analytics] 📊 Event tracked: "${eventName}"`, safeParams);
  if ((window as any).gtag) {
    (window as any).gtag("event", eventName, safeParams);
  }
}

export function CookieConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem("genznex_analytics_consent");
    if (!existing) {
      setShow(true);
    }
  }, []);

  const handleConsent = (granted: boolean) => {
    localStorage.setItem("genznex_analytics_consent", granted ? "granted" : "denied");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#141525]/95 backdrop-blur-md border border-purple-500/40 rounded-2xl p-4 shadow-2xl shadow-purple-500/10 text-xs">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm">Privacy &amp; Analytics Notice</h4>
          <p className="text-gray-400 mt-1 leading-relaxed">
            We use privacy-preserving, zero-PII telemetry to understand course drop-offs and platform uptime in compliance with India's DPDP Act.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => handleConsent(true)}
              className="px-3 py-1.5 rounded-lg font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm"
            >
              Accept Analytics
            </button>
            <button
              onClick={() => handleConsent(false)}
              className="px-3 py-1.5 rounded-lg font-medium text-gray-400 hover:text-white bg-gray-800/80 transition-all"
            >
              Decline
            </button>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-gray-500 hover:text-gray-300"
          aria-label="Close Banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
