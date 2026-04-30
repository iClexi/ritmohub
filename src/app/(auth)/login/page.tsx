import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { BackButton } from "@/components/ui/back-button";
import { getCurrentUser } from "@/lib/auth/current-user";

function mapOAuthError(code?: string) {
  if (!code) return null;

  if (code.includes("not_configured")) {
    return "OAuth no configurado. Define las variables de entorno del proveedor.";
  }
  if (code.includes("invalid_state")) {
    return "La sesion OAuth expiro. Intenta de nuevo.";
  }
  if (code.includes("email_not_verified")) {
    return "Google no confirmo ese correo. Usa otra cuenta o inicia sesion con correo y contrasena.";
  }
  if (code.includes("email_required")) {
    return "Meta requiere permiso de correo para iniciar sesion.";
  }
  return "No se pudo iniciar sesion social. Intenta nuevamente.";
}

export default async function LoginPage({
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
        <h2 className="text-3xl font-semibold text-[var(--ui-text)]">Bienvenido de nuevo</h2>
        <p className="text-sm text-[var(--ui-muted)]">Inicia sesion para revisar tu agenda musical y tus eventos.</p>
      </header>

      {oauthErrorMessage ? (
        <p className="rounded-xl bg-[color:rgb(var(--ui-glow-danger)/0.14)] px-3 py-2 text-sm text-[var(--ui-danger)]">
          {oauthErrorMessage}
        </p>
      ) : null}

      <LoginForm />

      <SocialLoginButtons flow="login" />
    </div>
  );
}
