import type { MetadataRoute } from "next";

const SITE = "https://ritmohub.iclexi.tech";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/terminos", "/privacidad", "/login", "/register"],
        disallow: [
          "/dashboard",
          "/api/",
          "/change-contact",
          "/reset-password",
          "/verify-account",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
