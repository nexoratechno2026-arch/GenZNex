"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  showLabel?: boolean;
  color?: "purple" | "cyan" | "emerald" | "amber";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  color = "purple",
  size = "md",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const colorStyles = {
    purple: "bg-gradient-to-r from-purple-600 to-indigo-500",
    cyan: "bg-gradient-to-r from-cyan-500 to-blue-500",
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-400",
    amber: "bg-gradient-to-r from-amber-500 to-orange-400",
  };

  return (
    <div className={twMerge(clsx("w-full space-y-1.5", className))}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-mono">{percentage}%</span>
        </div>
      )}
      <div
        className={twMerge(
          clsx(
            "w-full bg-[#181b2a] rounded-full overflow-hidden border border-gray-800",
            sizeStyles[size]
          )
        )}
      >
        <div
          className={twMerge(
            clsx(
              "h-full rounded-full transition-all duration-500 ease-out shadow-sm",
              colorStyles[color]
            )
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
