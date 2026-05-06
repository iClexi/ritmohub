import { redirect } from "next/navigation";

import { VerifyAccountForm } from "@/components/auth/verify-account-form";
import { BackButton } from "@/components/ui/back-button";
import { requireUser } from "@/lib/auth/current-user";

export default async function VerifyAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ limited?: string; error?: string }>;
}) {
  const user = await requireUser({ allowUnverified: true });
  const params = await searchParams;

  if (!user.isVerificationPending) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/" />

      <header className="space-y-2">
        <h2 className="text-3xl font-semibold text-[var(--ui-text)]">Verifica tu cuenta</h2>
        <p className="text-sm text-[var(--ui-muted)]">
          Tu cuenta esta limitada hasta que confirmes por correo o SMS.
        </p>
      </header>

      {params.limited ? (
        <p className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.14)] px-3 py-2 text-sm text-[var(--ui-danger)]">
          Esta seccion requiere una cuenta verificada.
        </p>
      ) : null}

      {params.error ? (
        <p className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.14)] px-3 py-2 text-sm text-[var(--ui-danger)]">
          No pudimos validar el enlace de correo. Solicita uno nuevo.
        </p>
      ) : null}

      <VerifyAccountForm />
    </div>
  );
}
