"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      lerp: 0.075,
      smoothWheel: true,
      wheelMultiplier: 0.82,
      touchMultiplier: 1.1,
    });

    const stopLenis = () => {
      lenis.stop();
    };

    const startLenis = () => {
      lenis.start();
    };

    let frameId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frameId = window.requestAnimationFrame(raf);
    };

    frameId = window.requestAnimationFrame(raf);
    window.addEventListener("rh-stage-lock", stopLenis);
    window.addEventListener("rh-stage-unlock", startLenis);

    return () => {
      window.removeEventListener("rh-stage-lock", stopLenis);
      window.removeEventListener("rh-stage-unlock", startLenis);
      window.cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  return null;
}
