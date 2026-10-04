import React from "react";
import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
  href?: string;
}

export function BrandLogo({
  size = "md",
  className = "",
  showTagline = true,
  href = "/",
}: BrandLogoProps) {
  // Dimensions mapping
  const sizeMap = {
    sm: { img: 32, text: "text-lg", sub: "text-[9px]" },
    md: { img: 40, text: "text-xl", sub: "text-[10px]" },
    lg: { img: 52, text: "text-2xl", sub: "text-xs" },
    xl: { img: 68, text: "text-3xl", sub: "text-sm" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Official GenzNex Brand Emblem */}
      <div
        className="relative overflow-hidden rounded-xl bg-white border border-neutral-200/80 dark:border-neutral-800 shadow-sm shrink-0 flex items-center justify-center p-1 transition-transform group-hover:scale-105"
        style={{ width: currentSize.img + 4, height: currentSize.img + 4 }}
      >
        <Image
          src="/images/genznex-logo.jpg"
          alt="GenzNex"
          width={currentSize.img * 2}
          height={currentSize.img * 2}
          priority
          className="w-full h-full object-contain"
        />
      </div>

      {/* Brand Wordmark & Tagline */}
      <div className="flex flex-col">
        <span
          className={`font-black tracking-tight leading-none text-black dark:text-white font-sans ${currentSize.text}`}
        >
          Genz<span className="text-blue-600 dark:text-teal-400">Nex</span>
        </span>
        {showTagline && (
          <span
            className={`font-bold tracking-wider text-neutral-500 dark:text-neutral-400 mt-0.5 uppercase ${currentSize.sub}`}
          >
            Learn. Build. Next.
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
