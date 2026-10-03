"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "purple" | "cyan" | "emerald" | "none";
}

export function Card({ glow = "none", className, children, ...props }: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "rounded-xl overflow-hidden transition-all duration-150 border border-neutral-300 dark:border-neutral-800 bg-white text-black dark:bg-black dark:text-white shadow-sm",
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
        clsx("text-lg sm:text-xl font-bold text-black dark:text-white tracking-tight", className)
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
      className={twMerge(clsx("text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1", className))}
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
        clsx("p-6 pt-0 border-t border-neutral-200 dark:border-neutral-800 mt-4", className)
      )}
      {...props}
    >
      {children}
    </div>
  );
}
