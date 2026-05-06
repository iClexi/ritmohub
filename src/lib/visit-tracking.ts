import { randomUUID } from "node:crypto";

import { pool } from "@/lib/db";

// ── User-Agent parser (sin dependencias externas) ─────────────────────────────
type UserAgentInfo = {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: "mobile" | "tablet" | "desktop" | "bot" | "unknown";
  deviceVendor: string;
};

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /facebookexternalhit/i,
  /headless/i,
  /lighthouse/i,
  /pingdom/i,
];

function detectBrowser(ua: string): { name: string; version: string } {
  const tests: Array<{ name: string; pattern: RegExp }> = [
    { name: "Edge", pattern: /Edg(?:A|iOS)?\/([\d.]+)/ },
    { name: "Edge Legacy", pattern: /Edge\/([\d.]+)/ },
    { name: "Opera", pattern: /OPR\/([\d.]+)/ },
    { name: "Opera", pattern: /Opera\/([\d.]+)/ },
    { name: "Samsung Internet", pattern: /SamsungBrowser\/([\d.]+)/ },
    { name: "Chrome", pattern: /CriOS\/([\d.]+)/ },
    { name: "Chrome", pattern: /Chrome\/([\d.]+)/ },
    { name: "Firefox", pattern: /FxiOS\/([\d.]+)/ },
    { name: "Firefox", pattern: /Firefox\/([\d.]+)/ },
    { name: "Safari", pattern: /Version\/([\d.]+).+Safari/ },
    { name: "Safari", pattern: /Safari\/([\d.]+)/ },
    { name: "MSIE", pattern: /MSIE ([\d.]+)/ },
  ];
  for (const t of tests) {
    const match = ua.match(t.pattern);
    if (match) return { name: t.name, version: match[1] ?? "" };
  }
  return { name: "Desconocido", version: "" };
}

function detectOS(ua: string): { name: string; version: string } {
  const tests: Array<{ name: string; pattern: RegExp; versionGroup?: number; transform?: (v: string) => string }> = [
    { name: "Windows", pattern: /Windows NT ([\d.]+)/, transform: (v) => {
      const map: Record<string, string> = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7", "6.0": "Vista", "5.1": "XP" };
      return map[v] ?? v;
    } },
    { name: "iOS", pattern: /OS ([\d_]+) like Mac/, transform: (v) => v.replaceAll("_", ".") },
    { name: "iPadOS", pattern: /iPad.*OS ([\d_]+)/, transform: (v) => v.replaceAll("_", ".") },
    { name: "macOS", pattern: /Mac OS X ([\d_.]+)/, transform: (v) => v.replaceAll("_", ".") },
    { name: "Android", pattern: /Android ([\d.]+)/ },
    { name: "Linux", pattern: /Linux/ },
    { name: "Chrome OS", pattern: /CrOS [^\s]+ ([\d.]+)/ },
  ];
  for (const t of tests) {
    const match = ua.match(t.pattern);
    if (match) {
      const raw = match[1] ?? "";
      return { name: t.name, version: t.transform ? t.transform(raw) : raw };
    }
  }
  return { name: "Desconocido", version: "" };
}

function detectDevice(ua: string): { type: UserAgentInfo["deviceType"]; vendor: string } {
  if (BOT_PATTERNS.some((p) => p.test(ua))) return { type: "bot", vendor: "" };
  if (/iPad/i.test(ua)) return { type: "tablet", vendor: "Apple" };
  if (/iPhone/i.test(ua)) return { type: "mobile", vendor: "Apple" };
  if (/iPod/i.test(ua)) return { type: "mobile", vendor: "Apple" };
  if (/Android/i.test(ua)) {
    const isTablet = /Tablet|SM-T|Nexus 7|Nexus 10|Pixel C/i.test(ua) || (!/Mobile/i.test(ua) && /Android/i.test(ua));
    let vendor = "";
    const vendorMatch = ua.match(/;\s*([A-Za-z0-9 _-]+)\s+Build/);
    if (vendorMatch) vendor = vendorMatch[1].trim();
    if (/Samsung|SM-/i.test(ua)) vendor = vendor || "Samsung";
    else if (/Huawei|HUAWEI/i.test(ua)) vendor = vendor || "Huawei";
    else if (/Xiaomi|Redmi|Mi /i.test(ua)) vendor = vendor || "Xiaomi";
    else if (/Pixel/i.test(ua)) vendor = vendor || "Google";
    else if (/OnePlus/i.test(ua)) vendor = vendor || "OnePlus";
    return { type: isTablet ? "tablet" : "mobile", vendor };
  }
  if (/Mobile|Phone/i.test(ua)) return { type: "mobile", vendor: "" };
  return { type: "desktop", vendor: "" };
}

export function parseUserAgent(userAgent: string): UserAgentInfo {
  if (!userAgent) {
    return { browser: "", browserVersion: "", os: "", osVersion: "", deviceType: "unknown", deviceVendor: "" };
  }
  const browser = detectBrowser(userAgent);
  const os = detectOS(userAgent);
  const device = detectDevice(userAgent);
  return {
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    deviceType: device.type,
    deviceVendor: device.vendor,
  };
}

// ── IP extraction ─────────────────────────────────────────────────────────────
export function extractClientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return null;
}

// ── Geolocation lookup (gratuito, opcional) ───────────────────────────────────
type GeoInfo = {
  country: string | null;
  region: string | null;
  cityGeo: string | null;
  isp: string | null;
  geoLat: number | null;
  geoLon: number | null;
};

const geoCache = new Map<string, { value: GeoInfo; expires: number }>();
const GEO_TTL_MS = 24 * 60 * 60 * 1000;

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "127.0.0.1" || ip === "::1") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const second = Number(ip.split(".")[1] ?? "0");
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true;
  if (ip.startsWith("fe80:")) return true;
  return false;
}

export async function lookupGeo(ip: string | null): Promise<GeoInfo> {
  const empty: GeoInfo = { country: null, region: null, cityGeo: null, isp: null, geoLat: null, geoLon: null };
  if (!ip || isPrivateIp(ip)) return empty;

  const cached = geoCache.get(ip);
  if (cached && cached.expires > Date.now()) return cached.value;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,isp,lat,lon`,
      { signal: controller.signal, cache: "no-store" },
    );
    clearTimeout(timeout);
    if (!response.ok) return empty;
    const data = (await response.json()) as {
      status?: string;
      country?: string;
      regionName?: string;
      city?: string;
      isp?: string;
      lat?: number;
      lon?: number;
    };
    if (data.status !== "success") return empty;
    const value: GeoInfo = {
      country: data.country ?? null,
      region: data.regionName ?? null,
      cityGeo: data.city ?? null,
      isp: data.isp ?? null,
      geoLat: typeof data.lat === "number" ? data.lat : null,
      geoLon: typeof data.lon === "number" ? data.lon : null,
    };
    geoCache.set(ip, { value, expires: Date.now() + GEO_TTL_MS });
    return value;
  } catch {
    return empty;
  }
}

// ── Persistencia ──────────────────────────────────────────────────────────────
type ServerVisitInput = {
  userId: string;
  source: "login" | "session" | "register" | "client";
  ip: string | null;
  userAgent: string | null;
  referrer?: string | null;
  pagePath?: string | null;
};

export type SiteTrafficRecord = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  occurredAt: string;
  source: string;
  ip: string | null;
  userAgent: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: string | null;
  deviceVendor: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  pixelRatio: number | null;
  colorDepth: number | null;
  language: string | null;
  languages: string | null;
  timezone: string | null;
  timezoneOffset: number | null;
  referrer: string | null;
  pagePath: string | null;
  country: string | null;
  region: string | null;
  cityGeo: string | null;
  isp: string | null;
  geoLat: number | null;
  geoLon: number | null;
  connection: string | null;
  platform: string | null;
  cpuCores: number | null;
  memoryGb: number | null;
  touchPoints: number | null;
  dnt: string | null;
};

let lastSeenSchemaPromise: Promise<void> | null = null;

async function ensureVisitSchema() {
  if (lastSeenSchemaPromise) return lastSeenSchemaPromise;
  lastSeenSchemaPromise = (async () => {
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS first_seen_at TEXT,
        ADD COLUMN IF NOT EXISTS last_seen_at TEXT,
        ADD COLUMN IF NOT EXISTS last_login_at TEXT,
        ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_ip TEXT,
        ADD COLUMN IF NOT EXISTS last_user_agent TEXT,
        ADD COLUMN IF NOT EXISTS last_browser TEXT,
        ADD COLUMN IF NOT EXISTS last_browser_version TEXT,
        ADD COLUMN IF NOT EXISTS last_os TEXT,
        ADD COLUMN IF NOT EXISTS last_os_version TEXT,
        ADD COLUMN IF NOT EXISTS last_device_type TEXT,
        ADD COLUMN IF NOT EXISTS last_device_vendor TEXT,
        ADD COLUMN IF NOT EXISTS last_screen_width INTEGER,
        ADD COLUMN IF NOT EXISTS last_screen_height INTEGER,
        ADD COLUMN IF NOT EXISTS last_viewport_width INTEGER,
        ADD COLUMN IF NOT EXISTS last_viewport_height INTEGER,
        ADD COLUMN IF NOT EXISTS last_pixel_ratio NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS last_color_depth INTEGER,
        ADD COLUMN IF NOT EXISTS last_language TEXT,
        ADD COLUMN IF NOT EXISTS last_languages TEXT,
        ADD COLUMN IF NOT EXISTS last_timezone TEXT,
        ADD COLUMN IF NOT EXISTS last_timezone_offset INTEGER,
        ADD COLUMN IF NOT EXISTS last_referrer TEXT,
        ADD COLUMN IF NOT EXISTS last_country TEXT,
        ADD COLUMN IF NOT EXISTS last_region TEXT,
        ADD COLUMN IF NOT EXISTS last_city_geo TEXT,
        ADD COLUMN IF NOT EXISTS last_isp TEXT,
        ADD COLUMN IF NOT EXISTS last_geo_lat NUMERIC(9,6),
        ADD COLUMN IF NOT EXISTS last_geo_lon NUMERIC(9,6),
        ADD COLUMN IF NOT EXISTS last_connection TEXT,
        ADD COLUMN IF NOT EXISTS last_platform TEXT,
        ADD COLUMN IF NOT EXISTS last_cpu_cores INTEGER,
        ADD COLUMN IF NOT EXISTS last_memory_gb NUMERIC(5,1),
        ADD COLUMN IF NOT EXISTS last_touch_points INTEGER,
        ADD COLUMN IF NOT EXISTS last_dnt TEXT;

      CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at);
      CREATE INDEX IF NOT EXISTS idx_users_last_country ON users(last_country);

      CREATE TABLE IF NOT EXISTS user_visits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'login',
        ip TEXT,
        user_agent TEXT,
        browser TEXT,
        browser_version TEXT,
        os TEXT,
        os_version TEXT,
        device_type TEXT,
        device_vendor TEXT,
        screen_width INTEGER,
        screen_height INTEGER,
        viewport_width INTEGER,
        viewport_height INTEGER,
        pixel_ratio NUMERIC(5,2),
        color_depth INTEGER,
        language TEXT,
        languages TEXT,
        timezone TEXT,
        timezone_offset INTEGER,
        referrer TEXT,
        page_path TEXT,
        country TEXT,
        region TEXT,
        city_geo TEXT,
        isp TEXT,
        geo_lat NUMERIC(9,6),
        geo_lon NUMERIC(9,6),
        connection TEXT,
        platform TEXT,
        cpu_cores INTEGER,
        memory_gb NUMERIC(5,1),
        touch_points INTEGER,
        dnt TEXT,
        CONSTRAINT fk_user_visits_user
          FOREIGN KEY(user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_user_visits_user_id ON user_visits(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_visits_occurred_at ON user_visits(occurred_at);
      CREATE INDEX IF NOT EXISTS idx_user_visits_country ON user_visits(country);

      CREATE TABLE IF NOT EXISTS site_visits (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        occurred_at TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'client',
        ip TEXT,
        user_agent TEXT,
        browser TEXT,
        browser_version TEXT,
        os TEXT,
        os_version TEXT,
        device_type TEXT,
        device_vendor TEXT,
        screen_width INTEGER,
        screen_height INTEGER,
        viewport_width INTEGER,
        viewport_height INTEGER,
        pixel_ratio NUMERIC(5,2),
        color_depth INTEGER,
        language TEXT,
        languages TEXT,
        timezone TEXT,
        timezone_offset INTEGER,
        referrer TEXT,
        page_path TEXT,
        country TEXT,
        region TEXT,
        city_geo TEXT,
        isp TEXT,
        geo_lat NUMERIC(9,6),
        geo_lon NUMERIC(9,6),
        connection TEXT,
        platform TEXT,
        cpu_cores INTEGER,
        memory_gb NUMERIC(5,1),
        touch_points INTEGER,
        dnt TEXT,
        CONSTRAINT fk_site_visits_user
          FOREIGN KEY(user_id)
          REFERENCES users(id)
          ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_site_visits_user_id ON site_visits(user_id);
      CREATE INDEX IF NOT EXISTS idx_site_visits_occurred_at ON site_visits(occurred_at);
      CREATE INDEX IF NOT EXISTS idx_site_visits_country ON site_visits(country);
      CREATE INDEX IF NOT EXISTS idx_site_visits_page_path ON site_visits(page_path);
    `);
  })();
  try {
    await lastSeenSchemaPromise;
  } catch (err) {
    lastSeenSchemaPromise = null;
    throw err;
  }
}

export async function recordServerVisit(input: ServerVisitInput): Promise<string | null> {
  try {
    await ensureVisitSchema();
    const ua = parseUserAgent(input.userAgent ?? "");
    const geo = await lookupGeo(input.ip);
    const now = new Date().toISOString();
    const visitId = randomUUID();
    const dnt = null;

    await pool.query(
      `
        INSERT INTO user_visits (
          id, user_id, occurred_at, source, ip, user_agent,
          browser, browser_version, os, os_version, device_type, device_vendor,
          referrer, country, region, city_geo, isp, geo_lat, geo_lon, dnt
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20
        )
      `,
      [
        visitId,
        input.userId,
        now,
        input.source,
        input.ip,
        input.userAgent ?? null,
        ua.browser || null,
        ua.browserVersion || null,
        ua.os || null,
        ua.osVersion || null,
        ua.deviceType,
        ua.deviceVendor || null,
        input.referrer ?? null,
        geo.country,
        geo.region,
        geo.cityGeo,
        geo.isp,
        geo.geoLat,
        geo.geoLon,
        dnt,
      ],
    );

    await pool.query(
      `
        UPDATE users
        SET
          last_seen_at = $1,
          first_seen_at = COALESCE(first_seen_at, $1),
          last_login_at = CASE WHEN $2 IN ('login','register') THEN $1 ELSE last_login_at END,
          visit_count = visit_count + 1,
          last_ip = COALESCE($3, last_ip),
          last_user_agent = COALESCE($4, last_user_agent),
          last_browser = COALESCE($5, last_browser),
          last_browser_version = COALESCE($6, last_browser_version),
          last_os = COALESCE($7, last_os),
          last_os_version = COALESCE($8, last_os_version),
          last_device_type = COALESCE($9, last_device_type),
          last_device_vendor = COALESCE($10, last_device_vendor),
          last_referrer = COALESCE($11, last_referrer),
          last_country = COALESCE($12, last_country),
          last_region = COALESCE($13, last_region),
          last_city_geo = COALESCE($14, last_city_geo),
          last_isp = COALESCE($15, last_isp),
          last_geo_lat = COALESCE($16, last_geo_lat),
          last_geo_lon = COALESCE($17, last_geo_lon),
          updated_at = $1
        WHERE id = $18
      `,
      [
        now,
        input.source,
        input.ip,
        input.userAgent ?? null,
        ua.browser || null,
        ua.browserVersion || null,
        ua.os || null,
        ua.osVersion || null,
        ua.deviceType,
        ua.deviceVendor || null,
        input.referrer ?? null,
        geo.country,
        geo.region,
        geo.cityGeo,
        geo.isp,
        geo.geoLat,
        geo.geoLon,
        input.userId,
      ],
    );

    return visitId;
  } catch (error) {
    console.error("[visit-tracking] recordServerVisit error:", error);
    return null;
  }
}

// ── Enriquecimiento desde el cliente ──────────────────────────────────────────
export type ClientVisitPayload = {
  visitId?: string | null;
  pagePath?: string | null;
  referrer?: string | null;
  language?: string | null;
  languages?: string | null;
  timezone?: string | null;
  timezoneOffset?: number | null;
  screenWidth?: number | null;
  screenHeight?: number | null;
  viewportWidth?: number | null;
  viewportHeight?: number | null;
  pixelRatio?: number | null;
  colorDepth?: number | null;
  platform?: string | null;
  connection?: string | null;
  cpuCores?: number | null;
  memoryGb?: number | null;
  touchPoints?: number | null;
  dnt?: string | null;
};

function clean<T>(value: T | null | undefined): T | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

export async function recordClientVisit(input: {
  userId: string;
  payload: ClientVisitPayload;
  ip: string | null;
  userAgent: string | null;
}): Promise<void> {
  try {
    await ensureVisitSchema();
    const now = new Date().toISOString();
    const p = input.payload;

    if (p.visitId) {
      await pool.query(
        `
          UPDATE user_visits SET
            page_path = COALESCE($2, page_path),
            referrer = COALESCE($3, referrer),
            language = COALESCE($4, language),
            languages = COALESCE($5, languages),
            timezone = COALESCE($6, timezone),
            timezone_offset = COALESCE($7, timezone_offset),
            screen_width = COALESCE($8, screen_width),
            screen_height = COALESCE($9, screen_height),
            viewport_width = COALESCE($10, viewport_width),
            viewport_height = COALESCE($11, viewport_height),
            pixel_ratio = COALESCE($12, pixel_ratio),
            color_depth = COALESCE($13, color_depth),
            platform = COALESCE($14, platform),
            connection = COALESCE($15, connection),
            cpu_cores = COALESCE($16, cpu_cores),
            memory_gb = COALESCE($17, memory_gb),
            touch_points = COALESCE($18, touch_points),
            dnt = COALESCE($19, dnt)
          WHERE id = $1 AND user_id = $20
        `,
        [
          p.visitId,
          clean(p.pagePath),
          clean(p.referrer),
          clean(p.language),
          clean(p.languages),
          clean(p.timezone),
          clean(p.timezoneOffset),
          clean(p.screenWidth),
          clean(p.screenHeight),
          clean(p.viewportWidth),
          clean(p.viewportHeight),
          clean(p.pixelRatio),
          clean(p.colorDepth),
          clean(p.platform),
          clean(p.connection),
          clean(p.cpuCores),
          clean(p.memoryGb),
          clean(p.touchPoints),
          clean(p.dnt),
          input.userId,
        ],
      );
    } else {
      const ua = parseUserAgent(input.userAgent ?? "");
      const geo = await lookupGeo(input.ip);
      const visitId = randomUUID();
      await pool.query(
        `
          INSERT INTO user_visits (
            id, user_id, occurred_at, source, ip, user_agent,
            browser, browser_version, os, os_version, device_type, device_vendor,
            screen_width, screen_height, viewport_width, viewport_height,
            pixel_ratio, color_depth, language, languages, timezone, timezone_offset,
            referrer, page_path, country, region, city_geo, isp, geo_lat, geo_lon,
            connection, platform, cpu_cores, memory_gb, touch_points, dnt
          ) VALUES (
            $1, $2, $3, 'client', $4, $5,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21,
            $22, $23, $24, $25, $26, $27, $28, $29,
            $30, $31, $32, $33, $34, $35
          )
        `,
        [
          visitId,
          input.userId,
          now,
          input.ip,
          input.userAgent ?? null,
          ua.browser || null,
          ua.browserVersion || null,
          ua.os || null,
          ua.osVersion || null,
          ua.deviceType,
          ua.deviceVendor || null,
          clean(p.screenWidth),
          clean(p.screenHeight),
          clean(p.viewportWidth),
          clean(p.viewportHeight),
          clean(p.pixelRatio),
          clean(p.colorDepth),
          clean(p.language),
          clean(p.languages),
          clean(p.timezone),
          clean(p.timezoneOffset),
          clean(p.referrer),
          clean(p.pagePath),
          geo.country,
          geo.region,
          geo.cityGeo,
          geo.isp,
          geo.geoLat,
          geo.geoLon,
          clean(p.connection),
          clean(p.platform),
          clean(p.cpuCores),
          clean(p.memoryGb),
          clean(p.touchPoints),
          clean(p.dnt),
        ],
      );
    }

    await pool.query(
      `
        UPDATE users SET
          last_seen_at = $1,
          first_seen_at = COALESCE(first_seen_at, $1),
          last_screen_width = COALESCE($2, last_screen_width),
          last_screen_height = COALESCE($3, last_screen_height),
          last_viewport_width = COALESCE($4, last_viewport_width),
          last_viewport_height = COALESCE($5, last_viewport_height),
          last_pixel_ratio = COALESCE($6, last_pixel_ratio),
          last_color_depth = COALESCE($7, last_color_depth),
          last_language = COALESCE($8, last_language),
          last_languages = COALESCE($9, last_languages),
          last_timezone = COALESCE($10, last_timezone),
          last_timezone_offset = COALESCE($11, last_timezone_offset),
          last_connection = COALESCE($12, last_connection),
          last_platform = COALESCE($13, last_platform),
          last_cpu_cores = COALESCE($14, last_cpu_cores),
          last_memory_gb = COALESCE($15, last_memory_gb),
          last_touch_points = COALESCE($16, last_touch_points),
          last_dnt = COALESCE($17, last_dnt),
          last_referrer = COALESCE($18, last_referrer)
        WHERE id = $19
      `,
      [
        now,
        clean(p.screenWidth),
        clean(p.screenHeight),
        clean(p.viewportWidth),
        clean(p.viewportHeight),
        clean(p.pixelRatio),
        clean(p.colorDepth),
        clean(p.language),
        clean(p.languages),
        clean(p.timezone),
        clean(p.timezoneOffset),
        clean(p.connection),
        clean(p.platform),
        clean(p.cpuCores),
        clean(p.memoryGb),
        clean(p.touchPoints),
        clean(p.dnt),
        clean(p.referrer),
        input.userId,
      ],
    );
  } catch (error) {
    console.error("[visit-tracking] recordClientVisit error:", error);
  }
}

export async function recordSiteVisit(input: {
  userId?: string | null;
  payload: ClientVisitPayload;
  ip: string | null;
  userAgent: string | null;
  source?: "client" | "register" | "login";
}): Promise<string | null> {
  try {
    await ensureVisitSchema();
    const payload = input.payload;
    const ua = parseUserAgent(input.userAgent ?? "");
    const geo = await lookupGeo(input.ip);
    const now = new Date().toISOString();
    const visitId = randomUUID();

    await pool.query(
      `
        INSERT INTO site_visits (
          id, user_id, occurred_at, source, ip, user_agent,
          browser, browser_version, os, os_version, device_type, device_vendor,
          screen_width, screen_height, viewport_width, viewport_height,
          pixel_ratio, color_depth, language, languages, timezone, timezone_offset,
          referrer, page_path, country, region, city_geo, isp, geo_lat, geo_lon,
          connection, platform, cpu_cores, memory_gb, touch_points, dnt
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22,
          $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36
        )
      `,
      [
        visitId,
        input.userId ?? null,
        now,
        input.source ?? "client",
        input.ip,
        input.userAgent ?? null,
        ua.browser || null,
        ua.browserVersion || null,
        ua.os || null,
        ua.osVersion || null,
        ua.deviceType,
        ua.deviceVendor || null,
        clean(payload.screenWidth),
        clean(payload.screenHeight),
        clean(payload.viewportWidth),
        clean(payload.viewportHeight),
        clean(payload.pixelRatio),
        clean(payload.colorDepth),
        clean(payload.language),
        clean(payload.languages),
        clean(payload.timezone),
        clean(payload.timezoneOffset),
        clean(payload.referrer),
        clean(payload.pagePath),
        geo.country,
        geo.region,
        geo.cityGeo,
        geo.isp,
        geo.geoLat,
        geo.geoLon,
        clean(payload.connection),
        clean(payload.platform),
        clean(payload.cpuCores),
        clean(payload.memoryGb),
        clean(payload.touchPoints),
        clean(payload.dnt),
      ],
    );

    return visitId;
  } catch (error) {
    console.error("[visit-tracking] recordSiteVisit error:", error);
    return null;
  }
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapSiteTrafficRow(row: Record<string, unknown>): SiteTrafficRecord {
  return {
    id: String(row.id ?? ""),
    userId: readString(row.user_id),
    userName: readString(row.user_name),
    userEmail: readString(row.user_email),
    occurredAt: String(row.occurred_at ?? ""),
    source: String(row.source ?? ""),
    ip: readString(row.ip),
    userAgent: readString(row.user_agent),
    browser: readString(row.browser),
    browserVersion: readString(row.browser_version),
    os: readString(row.os),
    osVersion: readString(row.os_version),
    deviceType: readString(row.device_type),
    deviceVendor: readString(row.device_vendor),
    screenWidth: readNumber(row.screen_width),
    screenHeight: readNumber(row.screen_height),
    viewportWidth: readNumber(row.viewport_width),
    viewportHeight: readNumber(row.viewport_height),
    pixelRatio: readNumber(row.pixel_ratio),
    colorDepth: readNumber(row.color_depth),
    language: readString(row.language),
    languages: readString(row.languages),
    timezone: readString(row.timezone),
    timezoneOffset: readNumber(row.timezone_offset),
    referrer: readString(row.referrer),
    pagePath: readString(row.page_path),
    country: readString(row.country),
    region: readString(row.region),
    cityGeo: readString(row.city_geo),
    isp: readString(row.isp),
    geoLat: readNumber(row.geo_lat),
    geoLon: readNumber(row.geo_lon),
    connection: readString(row.connection),
    platform: readString(row.platform),
    cpuCores: readNumber(row.cpu_cores),
    memoryGb: readNumber(row.memory_gb),
    touchPoints: readNumber(row.touch_points),
    dnt: readString(row.dnt),
  };
}

export async function listRecentSiteTraffic(limit = 120): Promise<SiteTrafficRecord[]> {
  await ensureVisitSchema();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
  const result = await pool.query<Record<string, unknown>>(
    `
      SELECT
        sv.*,
        u.name AS user_name,
        u.email AS user_email
      FROM site_visits sv
      LEFT JOIN users u ON u.id = sv.user_id
      ORDER BY sv.occurred_at DESC
      LIMIT $1
    `,
    [safeLimit],
  );

  return result.rows.map(mapSiteTrafficRow);
}
