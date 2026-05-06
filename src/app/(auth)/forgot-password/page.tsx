import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { BackButton } from "@/components/ui/back-button";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/login" />

      <header className="space-y-2">
        <h2 className="text-3xl font-semibold text-[var(--ui-text)]">Recupera tu acceso</h2>
        <p className="text-sm text-[var(--ui-muted)]">
          Recupera tu cuenta por enlace de correo o por codigo SMS.
        </p>
      </header>

      <ForgotPasswordForm />
    </div>
  );
}
