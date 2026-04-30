import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { Pool } from "pg";

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
    // .env is optional.
  }
}

function createPool() {
  const connectionString = process.env.DATABASE_URL?.trim();
  const sslEnabled = parseBooleanEnv(process.env.DB_SSL, false);
  const rejectUnauthorized = parseBooleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED, true);

  const sharedConfig = sslEnabled ? { ssl: { rejectUnauthorized } } : {};

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
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME ?? "musicapp",
      options: "-c statement_timeout=12000",
      ...sharedConfig,
    };

  if (!connectionString && !poolConfig.password) {
    throw new Error("DB_PASSWORD no esta definido. Configura las variables de DB antes de correr la migracion.");
  }

  return new Pool({
    ...poolConfig,
    max: 5,
    idleTimeoutMillis: 25_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  });
}

function resolveMimeType(mediaUrl, fallbackType) {
  const ext = path.extname(mediaUrl).toLowerCase();
  const extToMime = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };

  return extToMime[ext] ?? fallbackType;
}

function resolveUploadsAbsolutePath(mediaUrl) {
  const relative = mediaUrl.replace(/^\/+/, "");
  const publicRoot = path.resolve(process.cwd(), "public");
  const uploadsRoot = path.resolve(publicRoot, "uploads");
  const absolutePath = path.resolve(publicRoot, relative);

  const safePrefix = `${uploadsRoot}${path.sep}`;
  if (absolutePath !== uploadsRoot && !absolutePath.startsWith(safePrefix)) {
    return null;
  }

  return absolutePath;
}

async function migrateUsers(pool, summary) {
  const userRows = await pool.query(
    `
      SELECT id, avatar_url, cover_url
      FROM users
      WHERE avatar_url LIKE '/uploads/%'
         OR cover_url LIKE '/uploads/%'
      ORDER BY created_at ASC
    `,
  );

  summary.usersScanned = userRows.rowCount ?? 0;

  for (const row of userRows.rows) {
    const candidateFields = [
      { column: "avatar_url", value: row.avatar_url, kind: "avatar", fallbackMime: "image/jpeg" },
      { column: "cover_url", value: row.cover_url, kind: "cover", fallbackMime: "image/jpeg" },
    ];

    for (const field of candidateFields) {
      const mediaUrl = typeof field.value === "string" ? field.value.trim() : "";
      if (!mediaUrl.startsWith("/uploads/")) {
        continue;
      }

      const absolutePath = resolveUploadsAbsolutePath(mediaUrl);
      if (!absolutePath) {
        summary.usersSkippedInvalidPath += 1;
        continue;
      }

      try {
        const binary = await fs.readFile(absolutePath);
        const uploadId = randomUUID();
        const now = new Date().toISOString();

        await pool.query(
          `
            INSERT INTO media_uploads (id, user_id, kind, mime_type, size_bytes, data, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            uploadId,
            row.id,
            field.kind,
            resolveMimeType(mediaUrl, field.fallbackMime),
            binary.length,
            binary,
            now,
          ],
        );

        await pool.query(
          `UPDATE users SET ${field.column} = $1, updated_at = $2 WHERE id = $3`,
          [`/api/uploads/file/${uploadId}`, now, row.id],
        );

        summary.usersMigrated += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes("ENOENT")) {
          const now = new Date().toISOString();
          await pool.query(
            `UPDATE users SET ${field.column} = '', updated_at = $2 WHERE id = $1`,
            [row.id, now],
          );
          summary.usersMissingFilesCleared += 1;
          continue;
        }

        summary.usersFailed += 1;
        console.error(`[migrate users] ${row.id} ${field.column} failed: ${message}`);
      }
    }
  }
}

async function migrateConcerts(pool, summary) {
  const concertRows = await pool.query(
    `
      SELECT id, user_id, flyer_url
      FROM concerts
      WHERE flyer_url LIKE '/uploads/%'
      ORDER BY created_at ASC
    `,
  );

  summary.concertsScanned = concertRows.rowCount ?? 0;

  for (const row of concertRows.rows) {
    const mediaUrl = typeof row.flyer_url === "string" ? row.flyer_url.trim() : "";
    if (!mediaUrl.startsWith("/uploads/")) {
      continue;
    }

    const absolutePath = resolveUploadsAbsolutePath(mediaUrl);
    if (!absolutePath) {
      summary.concertsSkippedInvalidPath += 1;
      continue;
    }

    try {
      const binary = await fs.readFile(absolutePath);
      const uploadId = randomUUID();
      const now = new Date().toISOString();

      await pool.query(
        `
          INSERT INTO media_uploads (id, user_id, kind, mime_type, size_bytes, data, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          uploadId,
          row.user_id,
          "concert-flyer",
          resolveMimeType(mediaUrl, "image/jpeg"),
          binary.length,
          binary,
          now,
        ],
      );

      await pool.query(
        `UPDATE concerts SET flyer_url = $1, updated_at = $2 WHERE id = $3`,
        [`/api/uploads/file/${uploadId}`, now, row.id],
      );

      summary.concertsMigrated += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("ENOENT")) {
        const now = new Date().toISOString();
        await pool.query(
          `UPDATE concerts SET flyer_url = '', updated_at = $2 WHERE id = $1`,
          [row.id, now],
        );
        summary.concertsMissingFilesCleared += 1;
        continue;
      }

      summary.concertsFailed += 1;
      console.error(`[migrate concerts] ${row.id} failed: ${message}`);
    }
  }
}

async function main() {
  await loadDotEnvIfPresent();
  const pool = createPool();

  const summary = {
    usersScanned: 0,
    usersMigrated: 0,
    usersMissingFilesCleared: 0,
    usersSkippedInvalidPath: 0,
    usersFailed: 0,
    concertsScanned: 0,
    concertsMigrated: 0,
    concertsMissingFilesCleared: 0,
    concertsSkippedInvalidPath: 0,
    concertsFailed: 0,
  };

  try {
    await migrateUsers(pool, summary);
    await migrateConcerts(pool, summary);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[migrate-legacy-user-concert-media-to-db] fatal", error);
  process.exit(1);
});
