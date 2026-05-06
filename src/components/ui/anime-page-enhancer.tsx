"use client";

import { animate, stagger } from "animejs";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ENTRY_SELECTOR = [
  "[data-page-animate]",
  "main > section",
  ".landing-hero > div",
  ".landing-media-tile",
  ".landing-stat-card",
  ".landing-collab-card",
  ".landing-city-card",
  ".rh-card",
].join(",");

const INTERACTIVE_SELECTOR = [
  "a.rh-btn-primary",
  "button.rh-btn-primary",
  ".landing-ghost-btn",
  "[data-motion-lift]",
].join(",");

function canAnimate() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pickEntryNodes() {
  return Array.from(document.querySelectorAll<HTMLElement>(ENTRY_SELECTOR))
    .filter((node) => {
      if (node.closest("[data-no-page-animate]")) return false;
      const rect = node.getBoundingClientRect();
      return rect.width >= 32 && rect.height >= 24;
    })
    .slice(0, 42);
}

export function AnimePageEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    if (!canAnimate()) return;

    let animation: ReturnType<typeof animate> | null = null;
    const frame = window.requestAnimationFrame(() => {
      const nodes = pickEntryNodes();
      if (!nodes.length) return;

      for (const node of nodes) {
        node.style.willChange = "opacity, transform";
      }

      animation = animate(nodes, {
        opacity: [0, 1],
        translateY: [22, 0],
        scale: [0.985, 1],
        delay: stagger(42),
        duration: 820,
        ease: "outCubic",
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      animation?.revert();
    };
  }, [pathname]);

  useEffect(() => {
    if (!canAnimate()) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)).slice(0, 80);
    const handleEnter = (event: Event) => {
      const target = event.currentTarget;
      if (!(target instanceof HTMLElement)) return;
      animate(target, {
        translateY: -2,
        scale: 1.015,
        duration: 220,
        ease: "outCubic",
      });
    };
    const handleLeave = (event: Event) => {
      const target = event.currentTarget;
      if (!(target instanceof HTMLElement)) return;
      animate(target, {
        translateY: 0,
        scale: 1,
        duration: 260,
        ease: "outCubic",
      });
    };

    for (const node of nodes) {
      node.addEventListener("mouseenter", handleEnter);
      node.addEventListener("mouseleave", handleLeave);
      node.addEventListener("focus", handleEnter);
      node.addEventListener("blur", handleLeave);
    }

    return () => {
      for (const node of nodes) {
        node.removeEventListener("mouseenter", handleEnter);
        node.removeEventListener("mouseleave", handleLeave);
        node.removeEventListener("focus", handleEnter);
        node.removeEventListener("blur", handleLeave);
      }
    };
  }, [pathname]);

  return null;
}
