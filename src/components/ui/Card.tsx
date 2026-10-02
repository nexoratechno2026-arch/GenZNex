"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "purple" | "cyan" | "emerald" | "none";
}

export function Card({ glow = "none", className, children, ...props }: CardProps) {
  const glowStyles = {
    none: "",
    purple: "hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/15",
    cyan: "hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/15",
    emerald: "hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/15",
  };

  return (
    <div
      className={twMerge(
        clsx(
          "glass-card rounded-2xl overflow-hidden transition-all duration-200 border border-gray-800",
          glowStyles[glow],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge(clsx("p-6 pb-3", className))} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={twMerge(
        clsx("text-lg sm:text-xl font-bold text-white tracking-tight", className)
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={twMerge(clsx("text-xs sm:text-sm text-gray-400 mt-1", className))}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge(clsx("p-6 pt-3", className))} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        clsx("p-6 pt-0 border-t border-gray-800/60 mt-4", className)
      )}
      {...props}
    >
      {children}
    </div>
  );
}
