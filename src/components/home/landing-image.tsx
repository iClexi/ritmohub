"use client";

import { useState } from "react";

type LandingImageProps = {
  src: string;
  alt: string;
  className: string;
  fallbackSrc?: string;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
};

const DEFAULT_FALLBACK_SRC = "/artists/default-artist.svg";

export function LandingImage({
  src,
  alt,
  className,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  loading = "lazy",
  width = 900,
  height = 600,
}: LandingImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const currentSrc = failedSrc === src ? fallbackSrc : src;

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setFailedSrc(src);
    }
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      className={className}
      onError={handleError}
    />
  );
}
