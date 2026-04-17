import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PaymentConfirmHandler } from "@/components/courses/payment-confirm-handler";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function RitmoHubAcademyLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen" style={{ background: "var(--ui-bg)" }}>
      <Suspense>
        <PaymentConfirmHandler />
      </Suspense>
      <header
        style={{ borderBottom: "1px solid var(--ui-border)", background: "var(--ui-surface)" }}
        className="fixed top-0 z-30 w-full backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--ui-text)" }}>
            RitmoHub <span style={{ color: "#ef4444" }}>Academy</span>
          </span>

          <div className="flex items-center gap-3">
            {/* Nav interno de la academia */}
            <nav className="hidden items-center gap-8 md:flex">
              {[
                { href: "/academiax", label: "Inicio" },
                { href: "/academiax/catalog", label: "Cursos" },
                ...(user ? [{ href: "/academiax/dashboard", label: "Mi aprendizaje" }] : []),
                { href: "/dashboard", label: "Volver a Red Social" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: "var(--ui-muted)" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div>
        {children}
      </div>
    </div>
  );
}
