import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { BackButton } from "@/components/ui/back-button";
import { getCurrentUser } from "@/lib/auth/current-user";

function mapOAuthError(code?: string) {
  if (!code) return null;

  if (code.includes("not_configured")) {
    return "OAuth no configurado. Define las variables de entorno del proveedor.";
  }
  if (code.includes("invalid_state")) {
    return "La sesion OAuth expiró. Intenta de nuevo.";
  }
  if (code.includes("email_required")) {
    return "Meta requiere permiso de correo para iniciar sesion.";
  }
  return "No se pudo iniciar sesion social. Intenta nuevamente.";
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ oauthError?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const oauthErrorMessage = mapOAuthError(params.oauthError);

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/" />

      <header className="space-y-2">
        <h2 className="text-3xl font-semibold text-[var(--ui-text)]">Crea tu cuenta</h2>
        <p className="text-sm text-[var(--ui-muted)]">Unete a la red para crear conciertos y conectar con otros musicos.</p>
      </header>

      {oauthErrorMessage ? (
        <p className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.14)] px-3 py-2 text-sm text-[var(--ui-danger)]">
          {oauthErrorMessage}
        </p>
      ) : null}

      <RegisterForm />
    </div>
  );
}
