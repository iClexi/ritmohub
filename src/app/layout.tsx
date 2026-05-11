import type { Metadata, Viewport } from "next";
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

const SITE_URL = "https://ritmohub.iclexi.tech";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RitmoHub",
    template: "%s · RitmoHub",
  },
  description:
    "Red de gestion para musicos con conciertos, ensayos y colaboraciones.",
  applicationName: "RitmoHub",
  authors: [{ name: "RitmoHub" }],
  generator: "Next.js",
  keywords: [
    "musicos",
    "bandas",
    "conciertos",
    "colaboracion musical",
    "RitmoHub",
  ],
  alternates: {
    canonical: "/",
    types: {
      "application/json": [
        { url: "/.well-known/security.txt", title: "Security policy" },
      ],
    },
  },
  other: {
    "terms-of-service": `${SITE_URL}/terminos`,
    "privacy-policy": `${SITE_URL}/privacidad`,
  },
  openGraph: {
    type: "website",
    locale: "es_DO",
    url: SITE_URL,
    siteName: "RitmoHub",
    title: "RitmoHub · Red de gestion para musicos",
    description:
      "Conciertos, ensayos, colaboraciones y comunidades musicales en una sola plataforma.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RitmoHub",
    description:
      "Conciertos, ensayos, colaboraciones y comunidades musicales en una sola plataforma.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
  colorScheme: "light dark",
};

const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "RitmoHub",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo.svg`,
  sameAs: [],
};

const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RitmoHub",
  url: SITE_URL,
  inLanguage: "es",
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
      <head>
        <link rel="terms-of-service" href="/terminos" />
        <link rel="privacy-policy" href="/privacidad" />
        <link rel="license" href="/terminos" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
      </head>
      <body className="min-h-full bg-[var(--ui-bg)] text-[var(--ui-text)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-black focus:px-3 focus:py-2 focus:text-white"
        >
          Saltar al contenido
        </a>
        <SmoothScroll />
        <RevealOnScroll />
        <SessionWatchdog />
        <VisitTracker enabled />
        <AnimePageEnhancer />
        <span id="main-content" tabIndex={-1} className="sr-only" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
