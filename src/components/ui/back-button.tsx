"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
};

export function BackButton({ fallbackHref = "/", label = "Volver" }: BackButtonProps) {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleGoBack}
      className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] px-4 py-2 text-sm font-semibold text-[var(--ui-text)] transition hover:border-[var(--ui-primary)] hover:bg-[var(--ui-surface-soft)]"
    >
      <span aria-hidden>{"<-"}</span>
      <span>{label}</span>
    </button>
  );
}