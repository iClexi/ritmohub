import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { SessionWatchdog } from "@/components/auth/session-watchdog";
import { VisitTracker } from "@/components/auth/visit-tracker";
import { AnimePageEnhancer } from "@/components/ui/anime-page-enhancer";

import "./globals.css";
import "react-international-phone/style.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RitmoHub",
  description: "Red de gestion para musicos con conciertos, ensayos y colaboraciones.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("rh-theme")?.value;
  const initialTheme = cookieTheme === "noir" ? "noir" : "classic";

  return (
    <html
      lang="es"
      data-theme={initialTheme}
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--ui-bg)] text-[var(--ui-text)]">
        <SmoothScroll />
        <RevealOnScroll />
        <SessionWatchdog />
        <VisitTracker enabled />
        <AnimePageEnhancer />
        {children}
      </body>
    </html>
  );
}
