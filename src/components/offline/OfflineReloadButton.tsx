"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";

export function OfflineReloadButton() {
  const [reloading, setReloading] = useState(false);

  const handleReload = () => {
    setReloading(true);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <button
      type="button"
      onClick={handleReload}
      className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/30 flex items-center justify-center gap-2"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${reloading ? "animate-spin" : ""}`} />
      <span>{reloading ? "Checking Connection..." : "Try Reconnecting"}</span>
    </button>
  );
}
