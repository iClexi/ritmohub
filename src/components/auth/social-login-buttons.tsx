import Link from "next/link";

type SocialLoginButtonsProps = {
  compact?: boolean;
};

export function SocialLoginButtons({ compact = false }: SocialLoginButtonsProps) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[color:var(--ui-border)]" />
        </div>
        <p className="relative mx-auto w-fit bg-[var(--ui-surface)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)]">
          O entrar con
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/api/auth/oauth/google/start"
          className="rh-icon-button inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-text)]"
        >
          <GoogleIcon />
          Google
        </Link>
        <Link
          href="/api/auth/oauth/meta/start"
          className="rh-icon-button inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--ui-text)]"
        >
          <MetaIcon />
          Meta
        </Link>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none">
      <path
        d="M21.35 12.27c0-.82-.07-1.4-.23-2H12v3.7h5.33c-.1.92-.62 2.32-1.77 3.25l-.02.12 2.83 2.15.2.02c1.84-1.66 2.91-4.1 2.91-7.24Z"
        fill="#4285F4"
      />
      <path
        d="M12 21.5c2.62 0 4.81-.85 6.42-2.3l-3.06-2.3c-.82.56-1.93.95-3.36.95-2.56 0-4.73-1.66-5.5-3.95l-.12.01-2.95 2.23-.04.11C5 19.35 8.22 21.5 12 21.5Z"
        fill="#34A853"
      />
      <path
        d="M6.5 13.9A5.5 5.5 0 0 1 6.18 12c0-.66.12-1.3.31-1.9l-.01-.13-2.99-2.27-.1.04A9.42 9.42 0 0 0 2.5 12c0 1.53.37 2.98 1.03 4.25l2.97-2.35Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.15c1.8 0 3 .75 3.7 1.38l2.7-2.58C16.8 3.46 14.62 2.5 12 2.5c-3.78 0-7 2.15-8.47 5.24L6.5 10.1C7.28 7.81 9.45 6.15 12 6.15Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MetaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none">
      <path
        d="M8.6 4.5c2.2 0 3.7 2.3 4.9 4.2 1.1-2 2.3-3.6 3.7-3.6 2.2 0 3.4 2.6 3.4 5.5 0 4.4-2.5 8.4-4.2 8.4-1.3 0-2.3-1.6-3.8-4.3-1.2 2.3-2.6 4.3-4.3 4.3-2.4 0-4.8-3.7-4.8-7.8C3.5 7.2 5.6 4.5 8.6 4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
