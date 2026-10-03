import React from "react";

interface GoogleIconProps {
  name: string;
  className?: string;
  size?: number | string;
  filled?: boolean;
}

export function GoogleIcon({
  name,
  className = "",
  size = 20,
  filled = false,
}: GoogleIconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none align-middle inline-flex items-center justify-center leading-none ${className}`}
      style={{
        fontSize: typeof size === "number" ? `${size}px` : size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
