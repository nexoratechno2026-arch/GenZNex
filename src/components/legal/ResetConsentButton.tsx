"use client";

import React, { useState } from "react";

export function ResetConsentButton() {
  const [cleared, setCleared] = useState(false);

  const handleReset = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("genznex_analytics_consent");
      setCleared(true);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/30"
    >
      {cleared ? "Preferences Resetting..." : "Reset Analytics Consent Preferences"}
    </button>
  );
}
