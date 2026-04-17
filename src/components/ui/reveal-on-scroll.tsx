"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_SELECTOR = [
  "[data-reveal]",
  ".landing-hero",
  ".landing-stat-card",
  ".landing-story-card",
  ".landing-text-panel",
  ".landing-collab-card",
  ".landing-city-card",
  ".landing-final-cta",
  ".rh-feed-grid > article",
].join(", ");

export function RevealOnScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    const tracked = new WeakSet<Element>();
    const registerNodes = () => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
      nodes.forEach((node, index) => {
        if (tracked.has(node)) {
          return;
        }
        tracked.add(node);
        node.classList.add("reveal-on-scroll");
        if (!node.style.getPropertyValue("--reveal-delay")) {
          node.style.setProperty("--reveal-delay", `${Math.min(index * 36, 360)}ms`);
        }
        observer.observe(node);
      });
    };

    registerNodes();

    const mutationObserver = new MutationObserver(() => {
      registerNodes();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
