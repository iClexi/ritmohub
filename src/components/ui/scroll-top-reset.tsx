"use client";

import { useEffect } from "react";

export function ScrollTopReset() {
  useEffect(() => {
    const hasRestoration = typeof history !== "undefined" && "scrollRestoration" in history;
    const previous = hasRestoration ? history.scrollRestoration : null;

    if (hasRestoration) {
      history.scrollRestoration = "manual";
    }

    const resetToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    resetToTop();
    const frame = window.requestAnimationFrame(() => {
      resetToTop();
    });
    const timer = window.setTimeout(() => {
      resetToTop();
    }, 120);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      if (hasRestoration && previous) {
        history.scrollRestoration = previous;
      }
    };
  }, []);

  return null;
}
