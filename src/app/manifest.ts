import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RitmoHub",
    short_name: "RitmoHub",
    description:
      "Red de gestion para musicos con conciertos, ensayos y colaboraciones.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b0b0b",
    theme_color: "#0b0b0b",
    lang: "es",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
    ],
  };
}
