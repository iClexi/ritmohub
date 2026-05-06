"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "rh-last-visit-track";
const DEBOUNCE_MS = 60 * 1000;

type ConnectionLike = {
  effectiveType?: string;
  type?: string;
};

type NavigatorWithExtras = Navigator & {
  deviceMemory?: number;
  connection?: ConnectionLike;
  mozConnection?: ConnectionLike;
  webkitConnection?: ConnectionLike;
  userAgentData?: { platform?: string };
};

function shouldSendThisSession(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = window.sessionStorage.getItem(`${STORAGE_KEY}:${pathname}`);
    if (!last) return true;
    const parsed = Number(last);
    if (!Number.isFinite(parsed)) return true;
    return Date.now() - parsed > DEBOUNCE_MS;
  } catch {
    return true;
  }
}

function markSent() {
  try {
    window.sessionStorage.setItem(`${STORAGE_KEY}:${window.location.pathname}`, String(Date.now()));
  } catch {
    /* noop */
  }
}

function buildPayload() {
  if (typeof window === "undefined") return null;
  const nav = window.navigator as NavigatorWithExtras;
  const connection = nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
  let platform = "";
  try {
    platform = nav.userAgentData?.platform ?? nav.platform ?? "";
  } catch {
    platform = nav.platform ?? "";
  }

  let timezone = "";
  let timezoneOffset: number | null = null;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    /* noop */
  }
  try {
    timezoneOffset = -new Date().getTimezoneOffset();
  } catch {
    /* noop */
  }

  return {
    pagePath: window.location.pathname,
    referrer: document.referrer || null,
    language: nav.language || null,
    languages: nav.languages?.length ? nav.languages.join(",") : null,
    timezone: timezone || null,
    timezoneOffset,
    screenWidth: window.screen?.width ?? null,
    screenHeight: window.screen?.height ?? null,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio ?? null,
    colorDepth: window.screen?.colorDepth ?? null,
    platform: platform || null,
    connection: connection?.effectiveType || connection?.type || null,
    cpuCores: nav.hardwareConcurrency ?? null,
    memoryGb: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    touchPoints: nav.maxTouchPoints ?? null,
    dnt: nav.doNotTrack ?? null,
  };
}

export function VisitTracker({ enabled }: { enabled: boolean }) {
  const sent = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    sent.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!enabled || sent.current) return;
    if (!shouldSendThisSession(pathname)) return;
    sent.current = true;

    const payload = buildPayload();
    if (!payload) return;

    const body = JSON.stringify(payload);
    const url = "/api/users/track-visit";

    let dispatched = false;
    try {
      if (typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        dispatched = navigator.sendBeacon(url, blob);
      }
    } catch {
      dispatched = false;
    }

    if (!dispatched) {
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        credentials: "include",
      }).catch(() => {
        /* swallow */
      });
    }

    markSent();
  }, [enabled, pathname]);

  return null;
}
