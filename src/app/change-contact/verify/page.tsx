import { Suspense } from "react";

import VerifyContactChangeForm from "./form";

export default function VerifyContactChangePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ui-bg)] px-4">
      <Suspense fallback={
        <div className="w-full max-w-sm rounded-2xl border border-[color:var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--ui-primary)] border-t-transparent" />
          <p className="text-sm text-[var(--ui-muted)]">Cargando...</p>
        </div>
      }>
        <VerifyContactChangeForm />
      </Suspense>
    </div>
  );
}
