import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { Pool } from "pg";

const VALID_MEDIA_TYPES = new Set(["image", "video", "audio"]);

function parseBooleanEnv(value, fallback) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;

  return fallback;
}

async function loadDotEnvIfPresent() {
  const envPath = path.join(process.cwd(), ".env");

  try {
    const text = await fs.readFile(envPath, "utf8");
    const lines = text.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const equalIndex = line.indexOf("=");
      if (equalIndex <= 0) {
        continue;
      }

      const key = line.slice(0, equalIndex).trim();
      const valueRaw = line.slice(equalIndex + 1).trim();
      const value =
        (valueRaw.startsWith('"') && valueRaw.endsWith('"')) ||
        (valueRaw.startsWith("'") && valueRaw.endsWith("'"))
          ? valueRaw.slice(1, -1)
          : valueRaw;

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional if environment variables are already provided.
  }
}

function getPool() {
  const connectionString = process.env.DATABASE_URL?.trim();
  const sslEnabled = parseBooleanEnv(process.env.DB_SSL, false);
  const rejectUnauthorized = parseBooleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED, true);

  const sharedConfig = sslEnabled
    ? { ssl: { rejectUnauthorized } }
    : {};

  const poolConfig = connectionString
    ? {
      connectionString,
      options: "-c statement_timeout=12000",
      ...sharedConfig,
    }
    : {
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER ?? "postgres",
      password: process.env.DB_PASSWORD ?? "postgres",
      database: process.env.DB_NAME ?? "musicapp",
      options: "-c statement_timeout=12000",
      ...sharedConfig,
    };

  return new Pool({
    ...poolConfig,
    max: 5,
    idleTimeoutMillis: 25_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  });
}

function inferMediaType(mediaTypeFromDb, mediaUrl) {
  const normalized = typeof mediaTypeFromDb === "string" ? mediaTypeFromDb.trim().toLowerCase() : "";
  if (VALID_MEDIA_TYPES.has(normalized)) {
    return normalized;
  }

  const ext = path.extname(mediaUrl).toLowerCase();
  if ([".mp4", ".webm", ".mov", ".mkv", ".avi"].includes(ext)) return "video";
  if ([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"].includes(ext)) return "audio";

  return "image";
}

function resolveMimeType(mediaType, mediaUrl) {
  const ext = path.extname(mediaUrl).toLowerCase();

  const extToMime = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".ogg": "audio/ogg",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
  };

  if (extToMime[ext]) {
    return extToMime[ext];
  }

  if (mediaType === "image") return "image/jpeg";
  if (mediaType === "video") return "video/mp4";
  if (mediaType === "audio") return "audio/mpeg";

  return "application/octet-stream";
}

function resolveForumAbsolutePath(mediaUrl) {
  const relative = mediaUrl.replace(/^\/+/, "");
  const publicRoot = path.resolve(process.cwd(), "public");
  const forumRoot = path.resolve(publicRoot, "uploads", "forum");
  const absolutePath = path.resolve(publicRoot, relative);

  const safePrefix = `${forumRoot}${path.sep}`;
  if (absolutePath !== forumRoot && !absolutePath.startsWith(safePrefix)) {
    return null;
  }

  return absolutePath;
}

async function migrateForumMedia() {
  await loadDotEnvIfPresent();
  const pool = getPool();

  const summary = {
    scanned: 0,
    migrated: 0,
    missingFilesCleared: 0,
    skippedInvalidPath: 0,
    failed: 0,
    beforeLegacyCount: 0,
    afterLegacyCount: 0,
  };

  try {
    const legacyRows = await pool.query(
      `
        SELECT id, author_user_id, media_type, media_url
        FROM forum_posts
        WHERE media_url LIKE '/uploads/forum/%'
        ORDER BY created_at ASC
      `,
    );

    summary.beforeLegacyCount = legacyRows.rowCount ?? 0;
    summary.scanned = legacyRows.rowCount ?? 0;

    if ((legacyRows.rowCount ?? 0) === 0) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    const fallbackUserRow = await pool.query(
      `SELECT id FROM users ORDER BY created_at ASC LIMIT 1`,
    );
    const fallbackUserId = fallbackUserRow.rows[0]?.id ?? null;

    for (const row of legacyRows.rows) {
      const postId = row.id;
      const mediaUrl = typeof row.media_url === "string" ? row.media_url.trim() : "";

      if (!mediaUrl.startsWith("/uploads/forum/") || mediaUrl.includes("..")) {
        summary.skippedInvalidPath += 1;
        continue;
      }

      const absolutePath = resolveForumAbsolutePath(mediaUrl);
      if (!absolutePath) {
        summary.skippedInvalidPath += 1;
        continue;
      }

      const mediaType = inferMediaType(row.media_type, mediaUrl);
      const ownerUserId = row.author_user_id ?? fallbackUserId;

      try {
        const binary = await fs.readFile(absolutePath);

        if (!ownerUserId) {
          throw new Error("No hay usuario disponible para asociar el archivo migrado.");
        }

        const uploadId = randomUUID();
        const now = new Date().toISOString();

        await pool.query(
          `
            INSERT INTO media_uploads (id, user_id, kind, mime_type, size_bytes, data, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            uploadId,
            ownerUserId,
            `forum-${mediaType}`,
            resolveMimeType(mediaType, mediaUrl),
            binary.length,
            binary,
            now,
          ],
        );

        await pool.query(
          `
            UPDATE forum_posts
            SET media_type = $1,
                media_url = $2,
                updated_at = $3
            WHERE id = $4
          `,
          [mediaType, `/api/uploads/file/${uploadId}`, now, postId],
        );

        summary.migrated += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes("ENOENT")) {
          const now = new Date().toISOString();
          await pool.query(
            `
              UPDATE forum_posts
              SET media_type = 'none',
                  media_url = '',
                  updated_at = $2
              WHERE id = $1
            `,
            [postId, now],
          );
          summary.missingFilesCleared += 1;
          continue;
        }

        summary.failed += 1;
        console.error(`[migrate-forum-media] post ${postId} failed: ${message}`);
      }
    }

    const afterResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM forum_posts WHERE media_url LIKE '/uploads/forum/%'`,
    );
    summary.afterLegacyCount = Number(afterResult.rows[0]?.total ?? 0);

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await pool.end();
  }
}

migrateForumMedia().catch((error) => {
  console.error("[migrate-forum-media] fatal error", error);
  process.exit(1);
});
