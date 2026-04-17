"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SESSION_COOKIE_NAME = "musisec_session";

function hasSessionCookieOnClient() {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie.split(";").some((part) => part.trim().startsWith(`${SESSION_COOKIE_NAME}=`));
}

export function SessionWatchdog() {
  const router = useRouter();
  const wasAuthenticatedRef = useRef(false);
  const handledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      if (cancelled || handledRef.current) {
        return;
      }

      if (!hasSessionCookieOnClient()) {
        wasAuthenticatedRef.current = false;
        return;
      }

      try {
        const response = await fetch("/api/auth/session-status", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as
          | { authenticated?: boolean; invalidated?: boolean; message?: string }
          | null;

        if (!response.ok) {
          return;
        }

        const isAuthenticated = Boolean(payload?.authenticated);
        if (isAuthenticated) {
          wasAuthenticatedRef.current = true;
          return;
        }

        const invalidated = Boolean(payload?.invalidated);
        if (invalidated && wasAuthenticatedRef.current && !handledRef.current) {
          handledRef.current = true;
          window.alert(payload?.message ?? "Tu usuario fue eliminado.");
          router.replace("/register?reason=user-deleted");
          router.refresh();
        }
      } catch {
        return;
      }
    };

    void checkSession();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void checkSession();
      }
    }, 6000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [router]);

  return null;
}
