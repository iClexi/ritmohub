"use client";

import { useEffect } from "react";

type LenisController = {
  destroy: () => void;
  raf: (time: number) => void;
  scrollTo: (target: number, options: { immediate: boolean }) => void;
  start: () => void;
  stop: () => void;
};

const PREVENT_SELECTOR = [
  ".react-international-phone-country-selector-dropdown",
  ".artist-detail-shell",
  ".artist-wave-screen",
  "[data-lenis-prevent]",
].join(", ");

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let disposed = false;
    let frameId = 0;
    let locked = false;
    let lenis: LenisController | null = null;

    const stopLenis = () => {
      locked = true;
      lenis?.stop();
    };

    const startLenis = () => {
      locked = false;
      lenis?.scrollTo(window.scrollY, { immediate: true });
      lenis?.start();
    };

    const raf = (time: number) => {
      lenis?.raf(time);
      frameId = window.requestAnimationFrame(raf);
    };

    window.addEventListener("rh-stage-lock", stopLenis);
    window.addEventListener("rh-stage-unlock", startLenis);

    void import("lenis").then(({ default: Lenis }) => {
      if (disposed) {
        return;
      }

      lenis = new Lenis({
        duration: 1.25,
        lerp: 0.075,
        smoothWheel: true,
        wheelMultiplier: 0.82,
        touchMultiplier: 1.1,
        prevent: (node: Element) => node.closest(PREVENT_SELECTOR) !== null,
      });

      if (locked) {
        lenis.stop();
      }

      frameId = window.requestAnimationFrame(raf);
    });

    return () => {
      disposed = true;
      window.removeEventListener("rh-stage-lock", stopLenis);
      window.removeEventListener("rh-stage-unlock", startLenis);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      lenis?.destroy();
    };
  }, []);

  return null;
}
