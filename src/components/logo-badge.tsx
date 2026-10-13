"use client";

import { useState } from "react";

export default function LogoBadge({
  src,
  alt,
  fallback,
}: {
  src: string;
  alt: string;
  fallback: string;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center border border-teal-400/60 shadow-sm overflow-hidden">
      {hasError && (
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-blue-900">
          {fallback}
        </span>
      )}

      <img
        src={src}
        alt={alt}
        className={`relative z-10 w-full h-full object-contain p-0.5 ${
          hasError ? "hidden" : ""
        }`}
        onError={() => setHasError(true)}
      />
    </div>
  );
}