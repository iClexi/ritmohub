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
    // Optional file.
  }
}

function createPool() {
  const connectionString = process.env.DATABASE_URL?.trim();
  const sslEnabled = parseBooleanEnv(process.env.DB_SSL, false);
  const rejectUnauthorized = parseBooleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED, true);

  const sharedConfig = sslEnabled
    ? { ssl: { rejectUnauthorized } }
    : {};

  const poolConfig = connectionString
    ? {
      connectionString,
      ...sharedConfig,
    }
    : {
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER ?? "postgres",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME ?? "musicapp",
      ...sharedConfig,
    };

  if (!connectionString && !poolConfig.password) {
    throw new Error("DB_PASSWORD no esta definido. Configura las variables de DB antes de correr el smoke test.");
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function firstCookieValue(response) {
  if (typeof response.headers.getSetCookie === "function") {
    const setCookies = response.headers.getSetCookie();
    if (setCookies.length > 0) {
      return setCookies[0].split(";")[0] ?? "";
    }
  }

  const headerValue = response.headers.get("set-cookie");
  if (!headerValue) {
    return "";
  }

  return headerValue.split(";")[0] ?? "";
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function run() {
  await loadDotEnvIfPresent();

  const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:5155";
  const smokeUserPassword = process.env.SMOKE_USER_PASSWORD?.trim();
  if (!smokeUserPassword) {
    throw new Error("SMOKE_USER_PASSWORD no esta definido. Define una contrasena temporal antes de correr el smoke test.");
  }

  const results = [];
  let authCookie = "";
  let createdUserId = "";

  const pool = createPool();

  async function test(name, fn) {
    try {
      const details = await fn();
      results.push({ name, status: "PASS", details: details ?? "ok" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ name, status: "FAIL", details: message });
    }
  }

  await test("1. DB: legacy forum URLs count is 0", async () => {
    const result = await pool.query(
      "SELECT COUNT(*)::int AS total FROM forum_posts WHERE media_url LIKE '/uploads/forum/%'",
    );
    const total = Number(result.rows[0]?.total ?? 0);
    assert(total === 0, `Legacy forum URLs pendientes: ${total}`);
    return `legacyCount=${total}`;
  });

  await test("2. DB: forum media URLs point to existing media_uploads", async () => {
    const result = await pool.query(
      `
        SELECT COUNT(*)::int AS dangling
        FROM forum_posts fp
        WHERE fp.media_url LIKE '/api/uploads/file/%'
          AND NOT EXISTS (
            SELECT 1
            FROM media_uploads mu
            WHERE mu.id = split_part(fp.media_url, '/api/uploads/file/', 2)
          )
      `,
    );

    const dangling = Number(result.rows[0]?.dangling ?? 0);
    assert(dangling === 0, `Se encontraron ${dangling} referencias sin archivo en media_uploads`);
    return `dangling=${dangling}`;
  });

  await test("3. GET / returns 200", async () => {
    const response = await fetch(`${baseUrl}/`);
    assert(response.status === 200, `status=${response.status}`);
    return `status=${response.status}`;
  });

  await test("4. GET /login returns 200", async () => {
    const response = await fetch(`${baseUrl}/login`);
    assert(response.status === 200, `status=${response.status}`);
    return `status=${response.status}`;
  });

  await test("5. GET /register returns 200", async () => {
    const response = await fetch(`${baseUrl}/register`);
    assert(response.status === 200, `status=${response.status}`);
    return `status=${response.status}`;
  });

  await test("6. GET /academiax returns 200", async () => {
    const response = await fetch(`${baseUrl}/academiax`);
    assert(response.status === 200, `status=${response.status}`);
    return `status=${response.status}`;
  });

  await test("7. GET /academiax/catalog returns 200", async () => {
    const response = await fetch(`${baseUrl}/academiax/catalog`);
    assert(response.status === 200, `status=${response.status}`);
    return `status=${response.status}`;
  });

  await test("8. GET /api/forum/posts returns posts array", async () => {
    const response = await fetch(`${baseUrl}/api/forum/posts`);
    const payload = await parseJsonSafe(response);

    assert(response.status === 200, `status=${response.status}`);
    assert(payload && Array.isArray(payload.posts), "payload.posts no es un array");

    return `posts=${payload.posts.length}`;
  });

  await test("9. API forum posts no longer expose /uploads/forum/", async () => {
    const response = await fetch(`${baseUrl}/api/forum/posts`);
    const payload = await parseJsonSafe(response);
    assert(response.status === 200, `status=${response.status}`);

    const posts = Array.isArray(payload?.posts) ? payload.posts : [];
    const legacy = posts.filter((post) =>
      typeof post?.mediaUrl === "string" && post.mediaUrl.startsWith("/uploads/forum/"),
    );

    assert(legacy.length === 0, `Aun hay ${legacy.length} posts con mediaUrl legacy`);
    return `legacyPostsInApi=${legacy.length}`;
  });

  await test("10. GET invalid /api/uploads/file/:id returns 404", async () => {
    const response = await fetch(`${baseUrl}/api/uploads/file/not-a-real-file-id`);
    assert(response.status === 404, `status=${response.status}`);
    return `status=${response.status}`;
  });

  await test("11. POST /api/uploads/forum without auth returns 401", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([Buffer.from("migration-smoke")], { type: "image/png" }),
      "smoke.png",
    );

    const response = await fetch(`${baseUrl}/api/uploads/forum`, {
      method: "POST",
      body: formData,
    });

    assert(response.status === 401, `status=${response.status}`);
    return `status=${response.status}`;
  });

  await test("12. GET /api/auth/session-status without cookie is unauthenticated", async () => {
    const response = await fetch(`${baseUrl}/api/auth/session-status`);
    const payload = await parseJsonSafe(response);

    assert(response.status === 200, `status=${response.status}`);
    assert(payload?.authenticated === false, "authenticated deberia ser false");

    return `authenticated=${payload?.authenticated}`;
  });

  await test("13. POST /api/auth/register creates temp user and sets cookie", async () => {
    const suffix = randomUUID().slice(0, 8);
    const registerBody = {
      firstName: "Smoke",
      lastName: "Tester",
      username: `smoke_${suffix}`,
      email: `smoke.${suffix}@musisec.app`,
      password: smokeUserPassword,
      confirmPassword: smokeUserPassword,
    };

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerBody),
    });

    const payload = await parseJsonSafe(response);
    const cookie = firstCookieValue(response);

    assert(response.status === 200, `status=${response.status}`);
    assert(Boolean(payload?.user?.id), "No llego user.id en registro");
    assert(Boolean(cookie), "No llego Set-Cookie de sesion en registro");

    authCookie = cookie;
    createdUserId = payload.user.id;
    return `userId=${payload.user.id}`;
  });

  await test("14. GET /api/auth/session-status with cookie is authenticated", async () => {
    assert(Boolean(authCookie), "No hay cookie de sesion para esta prueba");

    const response = await fetch(`${baseUrl}/api/auth/session-status`, {
      headers: { Cookie: authCookie },
    });
    const payload = await parseJsonSafe(response);

    assert(response.status === 200, `status=${response.status}`);
    assert(payload?.authenticated === true, "authenticated deberia ser true");

    return `authenticated=${payload?.authenticated}`;
  });

  await test("15. GET /api/workspace and /api/chats/threads with auth succeed", async () => {
    assert(Boolean(authCookie), "No hay cookie de sesion para esta prueba");

    const workspaceResponse = await fetch(`${baseUrl}/api/workspace?sections=communities,jobs,courses,chats`, {
      headers: { Cookie: authCookie },
    });
    const workspacePayload = await parseJsonSafe(workspaceResponse);

    assert(workspaceResponse.status === 200, `workspace status=${workspaceResponse.status}`);
    assert(Array.isArray(workspacePayload?.forumPosts), "workspace.forumPosts no es array");

    const threadsResponse = await fetch(`${baseUrl}/api/chats/threads`, {
      headers: { Cookie: authCookie },
    });
    const threadsPayload = await parseJsonSafe(threadsResponse);

    assert(threadsResponse.status === 200, `threads status=${threadsResponse.status}`);
    assert(Array.isArray(threadsPayload?.threads), "threads no es array");

    return `forumPosts=${workspacePayload.forumPosts.length},threads=${threadsPayload.threads.length}`;
  });

  if (createdUserId) {
    await pool.query("DELETE FROM users WHERE id = $1", [createdUserId]);
  }

  await pool.end();

  const total = results.length;
  const passed = results.filter((item) => item.status === "PASS").length;
  const failed = total - passed;

  console.log("SMOKE_RESULTS_START");
  console.log(JSON.stringify({ total, passed, failed, results }, null, 2));
  console.log("SMOKE_RESULTS_END");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error("[smoke-forum-db-migration-checks] fatal", error);
  process.exit(1);
});
