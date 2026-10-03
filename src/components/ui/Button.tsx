"use client";

import React from "react";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold tracking-tight rounded-md transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-5 py-2.5 text-sm gap-2",
      lg: "px-7 py-3.5 text-base gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-black text-white border border-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:border-white dark:hover:bg-neutral-200",
      secondary:
        "bg-white text-black border border-neutral-300 hover:bg-neutral-100 dark:bg-black dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-900",
      outline:
        "bg-transparent text-black border border-black hover:bg-neutral-100 dark:text-white dark:border-white dark:hover:bg-neutral-900",
      ghost:
        "bg-transparent text-black hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-900",
      danger:
        "bg-black text-white border border-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:border-white dark:hover:bg-neutral-200",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(
          clsx(
            baseStyles,
            sizeStyles[size],
            variantStyles[variant],
            fullWidth && "w-full",
            className
          )
        )}
        {...props}
      >
        {loading ? (
          <GoogleIcon name="progress_activity" size={16} className="animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span className="font-bold">{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
