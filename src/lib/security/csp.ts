export function createContentSecurityPolicy(nonce: string): string {
  const isProduction = process.env.NODE_ENV === "production";
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    ...(isProduction ? [] : ["'unsafe-eval'"]),
    "https://static.cloudflareinsights.com",
  ];
  const connectSources = [
    "'self'",
    "https://cloudflareinsights.com",
    "https://*.ingest.us.sentry.io",
    "https://*.ingest.sentry.io",
    ...(isProduction ? [] : ["ws:", "http://localhost:*", "http://127.0.0.1:*"]),
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-src https://www.youtube-nocookie.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
