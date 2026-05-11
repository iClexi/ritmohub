import type { MetadataRoute } from "next";

const SITE = "https://ritmohub.iclexi.tech";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/terminos`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];
}
