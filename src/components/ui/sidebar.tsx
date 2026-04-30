"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { ProfileMenu } from "@/components/profile/profile-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { CurrentUser } from "@/lib/auth/current-user";

type SectionId =
  | "band"
  | "profile"
  | "shows"
  | "communities"
  | "chats"
  | "jobs"
  | "courses";

type NavItem = { id: SectionId; label: string; description: string; href: string };

const navItems: NavItem[] = [
  { id: "band", label: "Tu banda", description: "Equipo, roles y disponibilidad", href: "/dashboard?s=band" },
  { id: "profile", label: "Tu perfil", description: "Identidad artistica y marca", href: "/dashboard?s=profile" },
  { id: "shows", label: "Conciertos proximos", description: "Shows, flyers y agenda", href: "/dashboard?s=shows" },
  { id: "communities", label: "Comunidades", description: "Networking musical activo", href: "/dashboard?s=communities" },
  { id: "chats", label: "Chats privados", description: "Mensajeria de produccion", href: "/dashboard?s=chats" },
  { id: "jobs", label: "Trabajos como musico", description: "Oportunidades y castings", href: "/dashboard?s=jobs" },
  { id: "courses", label: "Cursos", description: "RitmoHub Academy", href: "/academiax" },
];

export function Sidebar({ user, activeSection }: { user: CurrentUser | null; activeSection?: string }) {
  const pathname = usePathname();
  
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-80 flex-col border-r border-[color:var(--ui-border)] bg-[var(--ui-bg)] lg:flex">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-[color:var(--ui-border)]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[linear-gradient(135deg,var(--ui-primary),var(--ui-accent))]" />
          <span className="text-lg font-bold tracking-tight text-[var(--ui-text)]">RitmoHub</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Nav list */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id || (item.id === "courses" && pathname.startsWith("/academiax"));
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex flex-col rounded-2xl px-4 py-3 transition-all ${
                isActive
                  ? "bg-[var(--ui-surface-soft)] ring-1 ring-[color:var(--ui-border)]"
                  : "hover:bg-[var(--ui-surface-soft)]/50"
              }`}
            >
              <span className={`text-sm font-semibold ${isActive ? "text-[var(--ui-primary)]" : "text-[var(--ui-text)]"}`}>
                {item.label}
              </span>
              <span className="text-[11px] text-[var(--ui-muted)] leading-tight mt-0.5">
                {item.description}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[color:var(--ui-border)] bg-[var(--ui-surface)]/30">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <ProfileMenu
              userName={user.name}
              userEmail={user.email}
              userAvatarUrl={user.avatarUrl}
              userBio={user.bio}
              userMusicianType={user.musicianType}
              userPrimaryInstrument={user.primaryInstrument}
              userOrientation={user.orientation}
              userStudies={user.studies}
            />
            <LogoutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-xl bg-[var(--ui-primary)] py-2 text-sm font-bold text-[var(--ui-on-primary)]"
          >
            Iniciar Sesión
          </Link>
        )}
      </div>
    </aside>
  );
}
