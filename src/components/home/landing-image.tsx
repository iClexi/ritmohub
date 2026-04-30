"use client";

import { useEffect, useState } from "react";

type LandingImageProps = {
  src: string;
  alt: string;
  className: string;
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK_SRC = "/artists/default-artist.svg";

export function LandingImage({ src, alt, className, fallbackSrc = DEFAULT_FALLBACK_SRC }: LandingImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={currentSrc} alt={alt} loading="lazy" className={className} onError={handleError} />
  );
}

