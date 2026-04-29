import { randomUUID } from "node:crypto";

import { cached, invalidate, invalidatePrefix } from "@/lib/cache";

import { Pool, type PoolClient, type PoolConfig } from "pg";

const DEFAULT_DB_HOST = "127.0.0.1";
const DEFAULT_DB_PORT = 5432;
const DEFAULT_DB_NAME = "musicapp";
const DEFAULT_DB_SSL = false;
const DEFAULT_DB_SSL_REJECT_UNAUTHORIZED = true;
const DEFAULT_DB_INIT_SCHEMA = false;

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

const connectionString = envValue("DATABASE_URL");
const dbSslEnabled = (envValue("DB_SSL") ?? String(DEFAULT_DB_SSL)).toLowerCase() === "true";
const dbSslRejectUnauthorized =
  (envValue("DB_SSL_REJECT_UNAUTHORIZED") ?? String(DEFAULT_DB_SSL_REJECT_UNAUTHORIZED)).toLowerCase() === "true";
const dbInitSchema = (envValue("DB_INIT_SCHEMA") ?? String(DEFAULT_DB_INIT_SCHEMA)).toLowerCase() === "true";

const sharedPoolConfig: Pick<PoolConfig, "ssl"> = dbSslEnabled
  ? { ssl: { rejectUnauthorized: dbSslRejectUnauthorized } }
  : {};

const poolConfig: PoolConfig = connectionString
  ? {
    connectionString,
    options: "-c statement_timeout=12000",
    ...sharedPoolConfig,
  }
  : {
    host: envValue("DB_HOST") ?? DEFAULT_DB_HOST,
    port: Number(envValue("DB_PORT") ?? DEFAULT_DB_PORT),
    user: envValue("DB_USER"),
    password: envValue("DB_PASSWORD"),
    database: envValue("DB_NAME") ?? DEFAULT_DB_NAME,
    options: "-c statement_timeout=12000",
    ...sharedPoolConfig,
  };

// Pool optimizado para despliegue con PostgreSQL en el mismo servidor.
// max:5 limita conexiones simultaneas para no saturar un VPS pequeno.
// keepAlive mantiene estables las conexiones entre la app y PostgreSQL local.
const pool = new Pool({
  ...poolConfig,
  max: 5,
  idleTimeoutMillis: 25_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
});

// Captura errores de clientes inactivos sin dejar caer el proceso.
pool.on("error", (err: Error) => {
  console.error("[db] pool error:", err.message);
});


let schemaInitializationPromise: Promise<void> | null = null;
let forumMediaColumnsPromise: Promise<boolean> | null = null;
let coursesInstructorColumnPromise: Promise<boolean> | null = null;
let courseModulesTablePromise: Promise<boolean> | null = null;
let chatThreadColumnsPromise: Promise<boolean> | null = null;
let chatGroupMembersTablePromise: Promise<boolean> | null = null;
let uniqueUsernameIndexPromise: Promise<boolean> | null = null;
let mediaUploadsTablePromise: Promise<boolean> | null = null;

async function initializeSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS musician_type TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS primary_instrument TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS orientation TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS studies TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS cover_url TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS website_url TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS social_instagram TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS social_spotify TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS social_youtube TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS is_solo BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS stage_name TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

    DROP INDEX IF EXISTS idx_users_username_normalized_unique;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stage_name_normalized_unique
      ON users (LOWER(BTRIM(stage_name)))
      WHERE BTRIM(stage_name) <> '';

    CREATE TABLE IF NOT EXISTS media_uploads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      data BYTEA NOT NULL,
      created_at TEXT NOT NULL,
      CONSTRAINT fk_media_uploads_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_media_uploads_user_id ON media_uploads(user_id);
    CREATE INDEX IF NOT EXISTS idx_media_uploads_created_at ON media_uploads(created_at);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      CONSTRAINT fk_sessions_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      CONSTRAINT fk_posts_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      CONSTRAINT fk_likes_post
        FOREIGN KEY(post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_likes_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT uq_likes_post_user
        UNIQUE (post_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

    CREATE TABLE IF NOT EXISTS concerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      venue TEXT NOT NULL,
      city TEXT NOT NULL,
      flyer_url TEXT NOT NULL,
      ticket_url TEXT NOT NULL,
      capacity TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CONSTRAINT fk_concerts_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_concerts_user_id ON concerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_concerts_date ON concerts(date);

    CREATE TABLE IF NOT EXISTS forum_posts (
      id TEXT PRIMARY KEY,
      author_user_id TEXT,
      author_name TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      upvotes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CONSTRAINT fk_forum_posts_user
        FOREIGN KEY(author_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    ALTER TABLE forum_posts
      ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS media_url TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS link_url TEXT NOT NULL DEFAULT '';

    CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
    CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at);

    CREATE TABLE IF NOT EXISTS forum_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author_user_id TEXT,
      author_name TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      CONSTRAINT fk_forum_comments_post
        FOREIGN KEY(post_id)
        REFERENCES forum_posts(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_forum_comments_user
        FOREIGN KEY(author_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);

    CREATE TABLE IF NOT EXISTS chat_threads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_role TEXT NOT NULL,
      contact_avatar TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CONSTRAINT fk_chat_threads_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_chat_threads_user_id ON chat_threads(user_id);

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      text TEXT NOT NULL,
      is_unread BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TEXT NOT NULL,
      CONSTRAINT fk_chat_messages_thread
        FOREIGN KEY(thread_id)
        REFERENCES chat_threads(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);

    ALTER TABLE chat_threads
      ADD COLUMN IF NOT EXISTS contact_user_id TEXT,
      ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS group_name TEXT NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS chat_group_members (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      CONSTRAINT fk_chat_group_members_thread
        FOREIGN KEY(thread_id)
        REFERENCES chat_threads(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_chat_group_members_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT uq_chat_group_members_thread_user
        UNIQUE (thread_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_chat_group_members_thread_id ON chat_group_members(thread_id);
    CREATE INDEX IF NOT EXISTS idx_chat_group_members_user_id ON chat_group_members(user_id);


    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      city TEXT NOT NULL,
      image_url TEXT NOT NULL,
      pay TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    ALTER TABLE jobs
      ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS requires_cv BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS requester_name TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS requester_role TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS requirements TEXT NOT NULL DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS deadline TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS poster_user_id TEXT;

    CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
    CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);

    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      CONSTRAINT fk_job_applications_job
        FOREIGN KEY(job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_job_applications_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT uq_job_applications_job_user
        UNIQUE (job_id, user_id)
    );

    ALTER TABLE job_applications
      ADD COLUMN IF NOT EXISTS cv_url TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS portfolio_links TEXT NOT NULL DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS cover_note TEXT NOT NULL DEFAULT '';

    CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      instructor TEXT NOT NULL,
      level TEXT NOT NULL,
      image_url TEXT NOT NULL,
      summary TEXT NOT NULL,
      price_usd NUMERIC(10,2) NOT NULL,
      created_at TEXT NOT NULL
    );

    ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS instructor_user_id TEXT;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_courses_instructor_user'
      ) THEN
        ALTER TABLE courses
          ADD CONSTRAINT fk_courses_instructor_user
          FOREIGN KEY(instructor_user_id)
          REFERENCES users(id)
          ON DELETE SET NULL;
      END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);
    CREATE INDEX IF NOT EXISTS idx_courses_instructor_user_id ON courses(instructor_user_id);

    CREATE TABLE IF NOT EXISTS course_purchases (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      amount_usd NUMERIC(10,2) NOT NULL,
      currency TEXT NOT NULL,
      checkout_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CONSTRAINT fk_course_purchases_course
        FOREIGN KEY(course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_course_purchases_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_course_purchases_user_id ON course_purchases(user_id);
    CREATE INDEX IF NOT EXISTS idx_course_purchases_course_id ON course_purchases(course_id);

    CREATE TABLE IF NOT EXISTS course_modules (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      title TEXT NOT NULL,
      lesson_type TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      content TEXT NOT NULL,
      video_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      CONSTRAINT fk_course_modules_course
        FOREIGN KEY(course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,
      CONSTRAINT uq_course_modules_course_position
        UNIQUE (course_id, position)
    );

    CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);

    CREATE TABLE IF NOT EXISTS concert_publish_intents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      venue TEXT NOT NULL,
      city TEXT NOT NULL,
      flyer_url TEXT NOT NULL,
      ticket_url TEXT NOT NULL,
      capacity TEXT NOT NULL,
      requirements TEXT NOT NULL,
      estimated_cost_usd NUMERIC(10,2) NOT NULL,
      payment_provider TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      checkout_url TEXT NOT NULL,
      published_concert_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CONSTRAINT fk_concert_publish_intents_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_concert_publish_intents_concert
        FOREIGN KEY(published_concert_id)
        REFERENCES concerts(id)
        ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_concert_publish_intents_user_id ON concert_publish_intents(user_id);
    CREATE INDEX IF NOT EXISTS idx_concert_publish_intents_status ON concert_publish_intents(payment_status);

    CREATE TABLE IF NOT EXISTS bands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      creator_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      CONSTRAINT fk_bands_creator FOREIGN KEY(creator_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS band_members (
      id TEXT PRIMARY KEY,
      band_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL,
      UNIQUE(band_id, user_id),
      CONSTRAINT fk_band_members_band FOREIGN KEY(band_id) REFERENCES bands(id) ON DELETE CASCADE,
      CONSTRAINT fk_band_members_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS band_invitations (
      id TEXT PRIMARY KEY,
      band_id TEXT NOT NULL,
      inviter_user_id TEXT NOT NULL,
      invitee_user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      UNIQUE(band_id, invitee_user_id),
      CONSTRAINT fk_band_invitations_band FOREIGN KEY(band_id) REFERENCES bands(id) ON DELETE CASCADE,
      CONSTRAINT fk_band_invitations_invitee FOREIGN KEY(invitee_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_band_members_user_id ON band_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_band_members_band_id ON band_members(band_id);
    CREATE INDEX IF NOT EXISTS idx_band_invitations_invitee ON band_invitations(invitee_user_id);
    CREATE INDEX IF NOT EXISTS idx_band_invitations_band ON band_invitations(band_id);
  `);
}

let schemaInitialized = false;
async function ensureSchemaInitialized() {
  if (!dbInitSchema || schemaInitialized) {
    return;
  }

  if (!schemaInitializationPromise) {
    schemaInitializationPromise = initializeSchema().then(() => {
      schemaInitialized = true;
    });
  }

  await schemaInitializationPromise;
}

async function queryRows<T>(query: string, params: unknown[] = [], client?: PoolClient): Promise<T[]> {
  await ensureSchemaInitialized();
  const executor = client ?? pool;
  const result = await executor.query(query, params);
  return result.rows as T[];
}

async function queryOne<T>(query: string, params: unknown[] = [], client?: PoolClient): Promise<T | null> {
  const rows = await queryRows<T>(query, params, client);
  return rows[0] ?? null;
}

async function execute(query: string, params: unknown[] = [], client?: PoolClient) {
  await ensureSchemaInitialized();
  const executor = client ?? pool;
  await executor.query(query, params);
}

async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  await ensureSchemaInitialized();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function hasForumMediaColumns(client?: PoolClient): Promise<boolean> {
  if (!forumMediaColumnsPromise) {
    forumMediaColumnsPromise = (async () => {
      const executor = client ?? pool;
      const result = await executor.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'forum_posts'
            AND column_name = ANY($1::text[])
        `,
        [["media_type", "media_url", "link_url"]],
      );

      return Number(result.rows[0]?.total ?? "0") === 3;
    })();
  }

  return forumMediaColumnsPromise;
}

async function ensureForumMediaColumns(client?: PoolClient): Promise<boolean> {
  const hasColumns = await hasForumMediaColumns(client);
  if (hasColumns) {
    return true;
  }

  try {
    const executor = client ?? pool;
    await executor.query(`
      ALTER TABLE forum_posts
        ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS media_url TEXT NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS link_url TEXT NOT NULL DEFAULT '';
    `);
  } catch {
    // Si no se puede migrar por permisos, seguimos en modo compatible sin media.
  }

  forumMediaColumnsPromise = null;
  return hasForumMediaColumns(client);
}

async function hasCoursesInstructorColumn(client?: PoolClient): Promise<boolean> {
  if (!coursesInstructorColumnPromise) {
    coursesInstructorColumnPromise = (async () => {
      const executor = client ?? pool;
      const result = await executor.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'courses'
            AND column_name = 'instructor_user_id'
        `,
      );
      return Number(result.rows[0]?.total ?? "0") === 1;
    })();
  }

  return coursesInstructorColumnPromise;
}

async function ensureCoursesInstructorColumn(client?: PoolClient): Promise<boolean> {
  const hasColumn = await hasCoursesInstructorColumn(client);
  if (hasColumn) {
    return true;
  }

  try {
    const executor = client ?? pool;
    await executor.query(`
      ALTER TABLE courses
        ADD COLUMN IF NOT EXISTS instructor_user_id TEXT;
    `);
  } catch {
    // Si no hay permisos de alter, dejamos modo compatible sin instructor_user_id.
  }

  coursesInstructorColumnPromise = null;
  return hasCoursesInstructorColumn(client);
}

async function hasCourseModulesTable(client?: PoolClient): Promise<boolean> {
  if (!courseModulesTablePromise) {
    courseModulesTablePromise = (async () => {
      const executor = client ?? pool;
      const result = await executor.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'course_modules'
        `,
      );

      return Number(result.rows[0]?.total ?? "0") === 1;
    })();
  }

  return courseModulesTablePromise;
}

async function ensureCourseModulesTable(client?: PoolClient): Promise<boolean> {
  const hasTable = await hasCourseModulesTable(client);
  if (hasTable) {
    return true;
  }

  try {
    const executor = client ?? pool;
    await executor.query(`
      CREATE TABLE IF NOT EXISTS course_modules (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        title TEXT NOT NULL,
        lesson_type TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        content TEXT NOT NULL,
        video_url TEXT NOT NULL,
        created_at TEXT NOT NULL,
        CONSTRAINT fk_course_modules_course
          FOREIGN KEY(course_id)
          REFERENCES courses(id)
          ON DELETE CASCADE,
        CONSTRAINT uq_course_modules_course_position
          UNIQUE (course_id, position)
      );

      CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
    `);
  } catch {
    // Si no hay permisos de create/alter, mantenemos modo compatible sin módulos.
  }

  courseModulesTablePromise = null;
  return hasCourseModulesTable(client);
}

async function hasChatThreadColumns(client?: PoolClient): Promise<boolean> {
  if (!chatThreadColumnsPromise) {
    chatThreadColumnsPromise = (async () => {
      const executor = client ?? pool;
      const result = await executor.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'chat_threads'
            AND column_name = ANY($1::text[])
        `,
        [["contact_user_id", "is_group", "group_name"]],
      );

      return Number(result.rows[0]?.total ?? "0") === 3;
    })();
  }

  return chatThreadColumnsPromise;
}

async function ensureChatThreadColumns(client?: PoolClient): Promise<boolean> {
  const hasColumns = await hasChatThreadColumns(client);
  if (hasColumns) {
    return true;
  }

  try {
    const executor = client ?? pool;
    await executor.query(`
      ALTER TABLE chat_threads
        ADD COLUMN IF NOT EXISTS contact_user_id TEXT,
        ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS group_name TEXT NOT NULL DEFAULT '';
    `);
  } catch {
    // Si no hay permisos de alter, mantenemos compatibilidad parcial de chat.
  }

  chatThreadColumnsPromise = null;
  return hasChatThreadColumns(client);
}

async function hasChatGroupMembersTable(client?: PoolClient): Promise<boolean> {
  if (!chatGroupMembersTablePromise) {
    chatGroupMembersTablePromise = (async () => {
      const executor = client ?? pool;
      const result = await executor.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'chat_group_members'
        `,
      );

      return Number(result.rows[0]?.total ?? "0") === 1;
    })();
  }

  return chatGroupMembersTablePromise;
}

async function ensureChatGroupMembersTable(client?: PoolClient): Promise<boolean> {
  const hasTable = await hasChatGroupMembersTable(client);
  if (hasTable) {
    return true;
  }

  try {
    const executor = client ?? pool;
    await executor.query(`
      CREATE TABLE IF NOT EXISTS chat_group_members (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        CONSTRAINT fk_chat_group_members_thread
          FOREIGN KEY(thread_id)
          REFERENCES chat_threads(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_chat_group_members_user
          FOREIGN KEY(user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,
        CONSTRAINT uq_chat_group_members_thread_user
          UNIQUE (thread_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_chat_group_members_thread_id ON chat_group_members(thread_id);
      CREATE INDEX IF NOT EXISTS idx_chat_group_members_user_id ON chat_group_members(user_id);
    `);
  } catch {
    // Si no hay permisos de create/alter, no hay soporte para grupos.
  }

  chatGroupMembersTablePromise = null;
  return hasChatGroupMembersTable(client);
}

async function hasUniqueUsernameIndex(client?: PoolClient): Promise<boolean> {
  if (!uniqueUsernameIndexPromise) {
    uniqueUsernameIndexPromise = (async () => {
      const executor = client ?? pool;
      const result = await executor.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'users'
            AND indexname = 'idx_users_stage_name_normalized_unique'
        `,
      );

      return Number(result.rows[0]?.total ?? "0") === 1;
    })();
  }

  return uniqueUsernameIndexPromise;
}

async function ensureUniqueUsernameIndex(client?: PoolClient): Promise<boolean> {
  await ensureUserExtraColumnsExist();

  const hasIndex = await hasUniqueUsernameIndex(client);
  if (hasIndex) {
    return true;
  }

  try {
    const executor = client ?? pool;
    await executor.query(`
      DROP INDEX IF EXISTS idx_users_username_normalized_unique;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stage_name_normalized_unique
      ON users (LOWER(BTRIM(stage_name)))
      WHERE BTRIM(stage_name) <> '';
    `);
  } catch (error) {
    console.error("[db] ensureUniqueUsernameIndex migration error:", error);
  }

  uniqueUsernameIndexPromise = null;
  return hasUniqueUsernameIndex(client);
}

async function hasMediaUploadsTable(client?: PoolClient): Promise<boolean> {
  if (!mediaUploadsTablePromise) {
    mediaUploadsTablePromise = (async () => {
      const executor = client ?? pool;
      const result = await executor.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'media_uploads'
        `,
      );

      return Number(result.rows[0]?.total ?? "0") === 1;
    })();
  }

  return mediaUploadsTablePromise;
}

async function ensureMediaUploadsTable(client?: PoolClient): Promise<boolean> {
  const hasTable = await hasMediaUploadsTable(client);
  if (hasTable) {
    return true;
  }

  try {
    const executor = client ?? pool;
    await executor.query(`
      CREATE TABLE IF NOT EXISTS media_uploads (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        data BYTEA NOT NULL,
        created_at TEXT NOT NULL,
        CONSTRAINT fk_media_uploads_user
          FOREIGN KEY(user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_media_uploads_user_id ON media_uploads(user_id);
      CREATE INDEX IF NOT EXISTS idx_media_uploads_created_at ON media_uploads(created_at);
    `);
  } catch {
    // Si no hay permisos de create/alter, no hay soporte para almacenamiento binario en DB.
  }

  mediaUploadsTablePromise = null;
  return hasMediaUploadsTable(client);
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  musician_type: string;
  bio: string;
  primary_instrument: string;
  orientation: string;
  studies: string;
  avatar_url: string;
  cover_url: string;
  website_url: string;
  location: string;
  social_instagram: string;
  social_spotify: string;
  social_youtube: string;
  is_solo: boolean;
  stage_name: string;
  genre: string;
  tagline: string;
  role: string;
  created_at: string;
  updated_at: string;
};

type BandRow = {
  id: string;
  name: string;
  creator_user_id: string;
  created_at: string;
  genre: string;
  bio: string;
  logo_url: string;
  banner_url: string;
  banner_fit: string;
};

type BandMemberRow = {
  id: string;
  band_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  // joined via query
  member_name?: string;
  member_avatar?: string;
  member_instrument?: string;
  member_musician_type?: string;
};

type BandInvitationRow = {
  id: string;
  band_id: string;
  inviter_user_id: string;
  invitee_user_id: string;
  status: string;
  created_at: string;
  // joined via query
  band_name?: string;
  inviter_name?: string;
  invitee_name?: string;
};

type SessionRow = {
  id: string;
  token_hash: string;
  user_id: string;
  expires_at: string;
  created_at: string;
};

type SessionWithUserRow = SessionRow & {
  name: string;
  email: string;
  password_hash: string;
  musician_type: string;
  bio: string;
  primary_instrument: string;
  orientation: string;
  studies: string;
  avatar_url: string;
  cover_url: string;
  website_url: string;
  location: string;
  social_instagram: string;
  social_spotify: string;
  social_youtube: string;
  is_solo: boolean;
  stage_name: string;
  genre: string;
  tagline: string;
  role: string;
  user_created_at: string;
  user_updated_at: string;
};

type ConcertRow = {
  id: string;
  user_id: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  flyer_url: string;
  ticket_url: string;
  capacity: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ForumPostRow = {
  id: string;
  author_user_id: string | null;
  author_name: string;
  author_avatar_url?: string;
  title: string;
  body: string;
  category: string;
  media_type: string;
  media_url: string;
  link_url: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
};

type ForumCommentRow = {
  id: string;
  post_id: string;
  author_user_id: string | null;
  author_name: string;
  author_avatar_url?: string;
  text: string;
  created_at: string;
};

type ForumCommentWithPostTitleRow = {
  id: string;
  post_id: string;
  post_title: string;
  text: string;
  created_at: string;
};

type JobRow = {
  id: string;
  title: string;
  type: string;
  city: string;
  image_url: string;
  pay: string;
  summary: string;
  description: string;
  requires_cv: boolean;
  requester_name: string;
  requester_role: string;
  requirements: string;
  deadline: string;
  poster_user_id: string | null;
  created_at: string;
};

type JobApplicationRow = {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  cv_url: string;
  portfolio_links: string;
  cover_note: string;
  created_at: string;
};

type ChatThreadRow = {
  id: string;
  user_id: string;
  contact_name: string;
  contact_role: string;
  contact_avatar: string;
  contact_user_id: string | null;
  is_group: boolean;
  group_name: string;
  created_at: string;
  updated_at: string;
};

type ChatGroupMemberRow = {
  id: string;
  thread_id: string;
  user_id: string;
  joined_at: string;
};

type ChatMessageRow = {
  id: string;
  thread_id: string;
  sender_type: string;
  text: string;
  is_unread: boolean;
  created_at: string;
};

type CourseRow = {
  id: string;
  title: string;
  instructor: string;
  instructor_user_id: string | null;
  level: string;
  image_url: string;
  summary: string;
  price_usd: string;
  created_at: string;
};

type CoursePurchaseRow = {
  id: string;
  course_id: string;
  user_id: string;
  provider: string;
  status: string;
  amount_usd: string;
  currency: string;
  checkout_url: string;
  created_at: string;
  updated_at: string;
};

type CourseModuleRow = {
  id: string;
  course_id: string;
  position: number;
  title: string;
  lesson_type: string;
  duration_minutes: number;
  content: string;
  video_url: string;
  created_at: string;
};

type MediaUploadRow = {
  id: string;
  user_id: string;
  kind: string;
  mime_type: string;
  size_bytes: number;
  data: Buffer;
  created_at: string;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  musicianType: string;
  bio: string;
  primaryInstrument: string;
  orientation: string;
  studies: string;
  avatarUrl: string;
  coverUrl: string;
  websiteUrl: string;
  location: string;
  socialInstagram: string;
  socialSpotify: string;
  socialYoutube: string;
  isSolo: boolean;
  stageName: string;
  genre: string;
  tagline: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BandMemberRecord = {
  id: string;
  bandId: string;
  userId: string;
  role: string;
  joinedAt: string;
  memberName: string;
  memberAvatar: string;
  memberInstrument: string;
  memberMusicianType: string;
};

export type BandRecord = {
  id: string;
  name: string;
  creatorUserId: string;
  createdAt: string;
  genre: string;
  bio: string;
  logoUrl: string;
  bannerUrl: string;
  bannerFit: "cover" | "contain";
  members: BandMemberRecord[];
};

export type BandInvitationRecord = {
  id: string;
  bandId: string;
  bandName: string;
  inviterUserId: string;
  inviterName: string;
  inviteeUserId: string;
  inviteeName: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
};

export type SessionWithUserRecord = SessionRecord & {
  user: UserRecord;
};

export type ConcertRecord = {
  id: string;
  userId: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  flyerUrl: string;
  ticketUrl: string;
  capacity: string;
  status: "lead" | "negotiation" | "confirmed" | "post_show";
  createdAt: string;
  updatedAt: string;
};

export type ForumCommentRecord = {
  id: string;
  postId: string;
  authorUserId: string | null;
  authorName: string;
  authorAvatarUrl: string;
  text: string;
  createdAt: string;
};

export type ForumCommentActivityRecord = {
  id: string;
  postId: string;
  postTitle: string;
  text: string;
  createdAt: string;
};

export type ForumPostRecord = {
  id: string;
  authorUserId: string | null;
  authorName: string;
  authorAvatarUrl: string;
  title: string;
  body: string;
  category: string;
  mediaType: "none" | "image" | "video" | "audio";
  mediaUrl: string;
  linkUrl: string;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
  comments: ForumCommentRecord[];
};

export type JobRecord = {
  id: string;
  title: string;
  type: string;
  city: string;
  imageUrl: string;
  pay: string;
  summary: string;
  description: string;
  requiresCv: boolean;
  requesterName: string;
  requesterRole: string;
  requirements: string[];
  deadline: string;
  posterUserId: string | null;
  createdAt: string;
};

export type JobApplicationRecord = {
  id: string;
  jobId: string;
  userId: string;
  status: string;
  cvUrl: string;
  portfolioLinks: string[];
  coverNote: string;
  createdAt: string;
};

export type ChatMessageRecord = {
  id: string;
  threadId: string;
  senderType: "me" | "them";
  text: string;
  isUnread: boolean;
  createdAt: string;
};

export type ChatThreadRecord = {
  id: string;
  userId: string;
  contactName: string;
  contactRole: string;
  contactAvatar: string;
  contactUserId: string | null;
  isGroup: boolean;
  groupName: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageRecord[];
};

export type UserSearchRecord = {
  id: string;
  name: string;
  email: string;
  musicianType: string;
  bio: string;
  primaryInstrument: string;
  avatarUrl: string;
};

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  stageName: string;
  role: "user" | "admin";
  musicianType: string;
  primaryInstrument: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
};

export type ConcertPublishIntentRecord = {
  id: string;
  userId: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  flyerUrl: string;
  ticketUrl: string;
  capacity: string;
  requirements: string;
  estimatedCostUsd: number;
  paymentProvider: "paypal" | "stripe";
  paymentStatus: "pending" | "paid" | "failed";
  checkoutUrl: string;
  publishedConcertId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CourseRecord = {
  id: string;
  title: string;
  instructor: string;
  instructorUserId: string | null;
  level: string;
  imageUrl: string;
  summary: string;
  priceUsd: number;
  createdAt: string;
};

export type CoursePurchaseRecord = {
  id: string;
  courseId: string;
  userId: string;
  provider: "paypal" | "stripe";
  status: "pending" | "paid" | "failed";
  amountUsd: number;
  currency: string;
  checkoutUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type CourseModuleRecord = {
  id: string;
  courseId: string;
  position: number;
  title: string;
  lessonType: "video" | "reading" | "practice";
  durationMinutes: number;
  content: string;
  videoUrl: string;
  createdAt: string;
};

export type MediaUploadRecord = {
  id: string;
  userId: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  data: Buffer;
  createdAt: string;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    musicianType: row.musician_type ?? "",
    bio: row.bio ?? "",
    primaryInstrument: row.primary_instrument ?? "",
    orientation: row.orientation ?? "",
    studies: row.studies ?? "",
    avatarUrl: row.avatar_url ?? "",
    coverUrl: row.cover_url ?? "",
    websiteUrl: row.website_url ?? "",
    location: row.location ?? "",
    socialInstagram: row.social_instagram ?? "",
    socialSpotify: row.social_spotify ?? "",
    socialYoutube: row.social_youtube ?? "",
    isSolo: row.is_solo ?? false,
    stageName: row.stage_name ?? "",
    genre: row.genre ?? "",
    tagline: row.tagline ?? "",
    role: row.role ?? "user",
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    tokenHash: row.token_hash,
    userId: row.user_id,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
  };
}

const concertFlyerFallbackPool = [
  "/flyers/Flyer%201.jpg",
  "/flyers/Flyer%202.jpg",
  "/flyers/Flyer%203.jpg",
  "/flyers/Flyer%204.jpg",
  "/flyers/Flyer%205.jpg",
] as const;

function getConcertFallbackFlyer(seed: string): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const safeIndex = Math.abs(hash) % concertFlyerFallbackPool.length;
  return concertFlyerFallbackPool[safeIndex] ?? concertFlyerFallbackPool[0];
}

function normalizeConcertFlyerUrl(value: string | null | undefined, seed: string): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  const normalized = trimmed.toLowerCase();
  const usesRitmoHubBackupVisual =
    (normalized.startsWith("/flyers/") && normalized.endsWith(".svg")) ||
    normalized === "/placeholders/media-fallback.svg";

  if (
    trimmed &&
    trimmed !== "undefined" &&
    trimmed !== "null" &&
    !usesRitmoHubBackupVisual
  ) {
    return trimmed;
  }

  return getConcertFallbackFlyer(seed);
}

function mapConcert(row: ConcertRow): ConcertRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    date: row.date,
    venue: row.venue,
    city: row.city,
    flyerUrl: normalizeConcertFlyerUrl(row.flyer_url, row.id),
    ticketUrl: row.ticket_url,
    capacity: row.capacity,
    status: row.status as ConcertRecord["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapForumComment(row: ForumCommentRow): ForumCommentRecord {
  return {
    id: row.id,
    postId: row.post_id,
    authorUserId: row.author_user_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url ?? "",
    text: row.text,
    createdAt: row.created_at,
  };
}

function mapForumPost(row: ForumPostRow): Omit<ForumPostRecord, "comments"> {
  const mediaType =
    row.media_type === "image" || row.media_type === "video" || row.media_type === "audio"
      ? row.media_type
      : "none";
  return {
    id: row.id,
    authorUserId: row.author_user_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url ?? "",
    title: row.title,
    body: row.body,
    category: row.category,
    mediaType,
    mediaUrl: row.media_url ?? "",
    linkUrl: row.link_url ?? "",
    upvotes: row.upvotes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapJob(row: JobRow): JobRecord {
  let requirements: string[] = [];
  try {
    const parsed = JSON.parse(row.requirements ?? "[]");
    if (Array.isArray(parsed)) {
      requirements = parsed.filter((v): v is string => typeof v === "string");
    }
  } catch { /* ignore */ }

  return {
    id: row.id,
    title: row.title,
    type: row.type,
    city: row.city,
    imageUrl: row.image_url,
    pay: row.pay,
    summary: row.summary,
    description: row.description ?? "",
    requiresCv: row.requires_cv ?? false,
    requesterName: row.requester_name ?? "",
    requesterRole: row.requester_role ?? "",
    requirements,
    deadline: row.deadline ?? "",
    posterUserId: row.poster_user_id ?? null,
    createdAt: row.created_at,
  };
}

function mapJobApplication(row: JobApplicationRow): JobApplicationRecord {
  let parsedLinks: string[] = [];
  try {
    const parsed = JSON.parse(row.portfolio_links ?? "[]");
    if (Array.isArray(parsed)) {
      parsedLinks = parsed.filter((value): value is string => typeof value === "string");
    }
  } catch {
    parsedLinks = [];
  }

  return {
    id: row.id,
    jobId: row.job_id,
    userId: row.user_id,
    status: row.status,
    cvUrl: row.cv_url ?? "",
    portfolioLinks: parsedLinks,
    coverNote: row.cover_note ?? "",
    createdAt: row.created_at,
  };
}

function mapChatThread(row: ChatThreadRow): Omit<ChatThreadRecord, "messages" | "memberIds"> {
  return {
    id: row.id,
    userId: row.user_id,
    contactName: row.contact_name ?? "",
    contactRole: row.contact_role ?? "",
    contactAvatar: row.contact_avatar ?? "",
    contactUserId: row.contact_user_id ?? null,
    isGroup: Boolean(row.is_group),
    groupName: row.group_name ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChatMessage(row: ChatMessageRow): ChatMessageRecord {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderType: row.sender_type as ChatMessageRecord["senderType"],
    text: row.text,
    isUnread: Boolean(row.is_unread),
    createdAt: row.created_at,
  };
}

function mapCourse(row: CourseRow): CourseRecord {
  return {
    id: row.id,
    title: row.title,
    instructor: row.instructor,
    instructorUserId: row.instructor_user_id,
    level: row.level,
    imageUrl: row.image_url,
    summary: row.summary,
    priceUsd: Number(row.price_usd),
    createdAt: row.created_at,
  };
}

function mapCoursePurchase(row: CoursePurchaseRow): CoursePurchaseRecord {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    provider: row.provider as CoursePurchaseRecord["provider"],
    status: row.status as CoursePurchaseRecord["status"],
    amountUsd: Number(row.amount_usd),
    currency: row.currency,
    checkoutUrl: row.checkout_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCourseModule(row: CourseModuleRow): CourseModuleRecord {
  return {
    id: row.id,
    courseId: row.course_id,
    position: Number(row.position),
    title: row.title,
    lessonType: row.lesson_type as CourseModuleRecord["lessonType"],
    durationMinutes: Number(row.duration_minutes),
    content: row.content,
    videoUrl: row.video_url,
    createdAt: row.created_at,
  };
}

function mapMediaUpload(row: MediaUploadRow): MediaUploadRecord {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    data: row.data,
    createdAt: row.created_at,
  };
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const row = await queryOne<UserRow>("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
  return row ? mapUser(row) : null;
}

export async function getUserByName(name: string): Promise<UserRecord | null> {
  const row = await queryOne<UserRow>(
    "SELECT * FROM users WHERE LOWER(BTRIM(name)) = LOWER(BTRIM($1)) LIMIT 1",
    [name],
  );
  return row ? mapUser(row) : null;
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  await ensureUserExtraColumnsExist();
  const row = await queryOne<UserRow>(
    "SELECT * FROM users WHERE LOWER(BTRIM(stage_name)) = LOWER(BTRIM($1)) LIMIT 1",
    [username],
  );
  return row ? mapUser(row) : null;
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const row = await queryOne<UserRow>("SELECT * FROM users WHERE id = $1 LIMIT 1", [userId]);
  return row ? mapUser(row) : null;
}

export async function createUser(input: {
  name: string;
  username?: string;
  email: string;
  passwordHash: string;
  musicianType?: string;
  bio?: string;
  primaryInstrument?: string;
  orientation?: string;
  studies?: string;
  role?: string;
}): Promise<UserRecord> {
  const normalizedName = input.name.trim().replace(/\s+/g, " ");
  const rawUsername = input.username?.trim() || input.email.split("@")[0]?.trim() || normalizedName;
  const normalizedUsername = rawUsername.toLowerCase().replace(/\s+/g, "_");

  if (!normalizedName) {
    throw new Error("El nombre es obligatorio para crear la cuenta.");
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  await ensureUserExtraColumnsExist();
  await ensureUniqueUsernameIndex();

  if (normalizedUsername) {
    const existingUserWithSameUsername = await getUserByUsername(normalizedUsername);
    if (existingUserWithSameUsername) {
      const duplicateError = new Error("El username ya esta en uso.");
      (duplicateError as Error & { code?: string }).code = "23505";
      throw duplicateError;
    }
  }

  const row = await queryOne<UserRow>(
    `
      INSERT INTO users (
        id,
        name,
        email,
        password_hash,
        musician_type,
        bio,
        primary_instrument,
        orientation,
        studies,
        stage_name,
        role,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
    [
      id,
      normalizedName,
      input.email.trim().toLowerCase(),
      input.passwordHash,
      input.musicianType ?? "",
      input.bio ?? "",
      input.primaryInstrument ?? "",
      input.orientation ?? "",
      input.studies ?? "",
      normalizedUsername,
      input.role ?? "user",
      now,
      now,
    ],
  );

  if (!row) {
    throw new Error("No se pudo crear el usuario.");
  }

  return mapUser(row);
}

export async function updateUserNameById(userId: string, name: string): Promise<UserRecord | null> {
  const now = new Date().toISOString();
  const row = await queryOne<UserRow>(
    `
      UPDATE users
      SET name = $1, updated_at = $2
      WHERE id = $3
      RETURNING *
    `,
    [name, now, userId],
  );

  return row ? mapUser(row) : null;
}

export async function updateUserProfileById(input: {
  userId: string;
  name: string;
  musicianType: string;
  bio: string;
  primaryInstrument: string;
  orientation: string;
  studies: string;
  avatarUrl?: string;
  coverUrl?: string;
  websiteUrl?: string;
  location?: string;
  socialInstagram?: string;
  socialSpotify?: string;
  socialYoutube?: string;
  stageName?: string;
  genre?: string;
  tagline?: string;
}): Promise<UserRecord | null> {
  await ensureUserExtraColumnsExist();
  const now = new Date().toISOString();
  const row = await queryOne<UserRow>(
    `
      UPDATE users
      SET
        name = $1,
        musician_type = $2,
        bio = $3,
        primary_instrument = $4,
        orientation = $5,
        studies = $6,
        avatar_url = COALESCE(NULLIF($7, '@@keep'), avatar_url, ''),
        cover_url = COALESCE(NULLIF($8, '@@keep'), cover_url, ''),
        website_url = $9,
        location = $10,
        social_instagram = $11,
        social_spotify = $12,
        social_youtube = $13,
        stage_name = COALESCE(NULLIF($14, '@@keep'), stage_name, ''),
        genre = COALESCE(NULLIF($15, '@@keep'), genre, ''),
        tagline = COALESCE(NULLIF($16, '@@keep'), tagline, ''),
        updated_at = $17
      WHERE id = $18
      RETURNING *
    `,
    [
      input.name,
      input.musicianType,
      input.bio,
      input.primaryInstrument,
      input.orientation,
      input.studies,
      input.avatarUrl ?? "@@keep",
      input.coverUrl ?? "@@keep",
      input.websiteUrl ?? "",
      input.location ?? "",
      input.socialInstagram ?? "",
      input.socialSpotify ?? "",
      input.socialYoutube ?? "",
      input.stageName ?? "@@keep",
      input.genre ?? "@@keep",
      input.tagline ?? "@@keep",
      now,
      input.userId,
    ],
  );

  return row ? mapUser(row) : null;
}

export async function createSessionRecord(input: {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}): Promise<SessionRecord> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const row = await queryOne<SessionRow>(
    `
      INSERT INTO sessions (id, token_hash, user_id, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [id, input.tokenHash, input.userId, input.expiresAt.toISOString(), now],
  );

  if (!row) {
    throw new Error("No se pudo crear la sesion.");
  }

  return mapSession(row);
}

export async function getSessionWithUserByTokenHash(
  tokenHash: string,
): Promise<SessionWithUserRecord | null> {
  await ensureUserExtraColumnsExist();
  const row = await queryOne<SessionWithUserRow>(
    `
      SELECT
        s.id,
        s.token_hash,
        s.user_id,
        s.expires_at,
        s.created_at,
        u.name,
        u.email,
        u.password_hash,
        to_jsonb(u)->>'musician_type' AS musician_type,
        to_jsonb(u)->>'bio' AS bio,
        to_jsonb(u)->>'primary_instrument' AS primary_instrument,
        to_jsonb(u)->>'orientation' AS orientation,
        to_jsonb(u)->>'studies' AS studies,
        COALESCE(to_jsonb(u)->>'avatar_url', '') AS avatar_url,
        COALESCE(to_jsonb(u)->>'cover_url', '') AS cover_url,
        COALESCE(to_jsonb(u)->>'website_url', '') AS website_url,
        COALESCE(to_jsonb(u)->>'location', '') AS location,
        COALESCE(to_jsonb(u)->>'social_instagram', '') AS social_instagram,
        COALESCE(to_jsonb(u)->>'social_spotify', '') AS social_spotify,
        COALESCE(to_jsonb(u)->>'social_youtube', '') AS social_youtube,
        COALESCE((to_jsonb(u)->>'is_solo')::boolean, false) AS is_solo,
        COALESCE(to_jsonb(u)->>'stage_name', '') AS stage_name,
        COALESCE(to_jsonb(u)->>'genre', '') AS genre,
        COALESCE(to_jsonb(u)->>'tagline', '') AS tagline,
        COALESCE(to_jsonb(u)->>'role', 'user') AS role,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at
      FROM sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
      LIMIT 1
    `,
    [tokenHash],
  );

  if (!row) {
    return null;
  }

  return {
    ...mapSession(row),
    user: {
      id: row.user_id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      musicianType: row.musician_type ?? "",
      bio: row.bio ?? "",
      primaryInstrument: row.primary_instrument ?? "",
      orientation: row.orientation ?? "",
      studies: row.studies ?? "",
      avatarUrl: row.avatar_url ?? "",
      coverUrl: row.cover_url ?? "",
      websiteUrl: row.website_url ?? "",
      location: row.location ?? "",
      socialInstagram: row.social_instagram ?? "",
      socialSpotify: row.social_spotify ?? "",
      socialYoutube: row.social_youtube ?? "",
      isSolo: row.is_solo ?? false,
      stageName: row.stage_name ?? "",
      genre: row.genre ?? "",
      tagline: row.tagline ?? "",
      role: row.role ?? "user",
      createdAt: new Date(row.user_created_at),
      updatedAt: new Date(row.user_updated_at),
    },
  };
}

export async function deleteSessionById(id: string) {
  await execute("DELETE FROM sessions WHERE id = $1", [id]);
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  await execute("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
}

export async function deleteExpiredSessions() {
  await execute("DELETE FROM sessions WHERE expires_at <= $1", [new Date().toISOString()]);
}

// ─── Band functions ──────────────────────────────────────────────────────────

function isBenignDdlError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  // 23505 = unique_violation on pg_type catalog (race during parallel CREATE TABLE IF NOT EXISTS)
  // 42P07 = duplicate_table, 42701 = duplicate_column, 42710 = duplicate_object
  return code === "23505" || code === "42P07" || code === "42701" || code === "42710";
}

let userExtraColumnsPromise: Promise<void> | null = null;
async function ensureUserExtraColumnsExist() {
  if (userExtraColumnsPromise) return userExtraColumnsPromise;
  userExtraColumnsPromise = (async () => {
    const statements = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS musician_type TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_instrument TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS orientation TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS studies TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS social_instagram TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS social_spotify TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS social_youtube TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_solo BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS stage_name TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS genre TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`,
    ];
    for (const sql of statements) {
      try { await pool.query(sql); }
      catch (err) { if (!isBenignDdlError(err)) throw err; }
    }
  })();
  try { await userExtraColumnsPromise; }
  catch (err) { userExtraColumnsPromise = null; throw err; }
}

let bandTablesPromise: Promise<void> | null = null;
async function ensureBandTablesExist() {
  if (bandTablesPromise) return bandTablesPromise;
  bandTablesPromise = (async () => {
    await ensureUserExtraColumnsExist();
    const statements = [
      `CREATE TABLE IF NOT EXISTS bands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        creator_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `ALTER TABLE bands ADD COLUMN IF NOT EXISTS genre TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE bands ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE bands ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE bands ADD COLUMN IF NOT EXISTS banner_url TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE bands ADD COLUMN IF NOT EXISTS banner_fit TEXT NOT NULL DEFAULT 'cover'`,
      `CREATE TABLE IF NOT EXISTS band_members (
        id TEXT PRIMARY KEY,
        band_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TEXT NOT NULL,
        UNIQUE(band_id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS band_invitations (
        id TEXT PRIMARY KEY,
        band_id TEXT NOT NULL,
        inviter_user_id TEXT NOT NULL,
        invitee_user_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        UNIQUE(band_id, invitee_user_id)
      )`,
    ];
    for (const sql of statements) {
      try { await pool.query(sql); }
      catch (err) { if (!isBenignDdlError(err)) throw err; }
    }
  })();
  try { await bandTablesPromise; }
  catch (err) { bandTablesPromise = null; throw err; }
}

export async function getBandByUserId(userId: string): Promise<BandRecord | null> {
  await ensureBandTablesExist();
  const bandRow = await pool.query<BandRow>(
    `SELECT b.* FROM bands b
     INNER JOIN band_members bm ON bm.band_id = b.id
     WHERE bm.user_id = $1
     LIMIT 1`,
    [userId],
  );
  if (bandRow.rows.length === 0) return null;
  const band = bandRow.rows[0];

  const membersRes = await pool.query<BandMemberRow>(
    `SELECT bm.*, u.name AS member_name, u.avatar_url AS member_avatar,
            u.primary_instrument AS member_instrument, u.musician_type AS member_musician_type
     FROM band_members bm
     INNER JOIN users u ON u.id = bm.user_id
     WHERE bm.band_id = $1
     ORDER BY bm.joined_at ASC`,
    [band.id],
  );

  return {
    id: band.id,
    name: band.name,
    creatorUserId: band.creator_user_id,
    createdAt: band.created_at,
    genre: band.genre ?? "",
    bio: band.bio ?? "",
    logoUrl: band.logo_url ?? "",
    bannerUrl: band.banner_url ?? "",
    bannerFit: band.banner_fit === "contain" ? "contain" : "cover",
    members: membersRes.rows.map((m) => ({
      id: m.id,
      bandId: m.band_id,
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      memberName: m.member_name ?? "",
      memberAvatar: m.member_avatar ?? "",
      memberInstrument: m.member_instrument ?? "",
      memberMusicianType: m.member_musician_type ?? "",
    })),
  };
}

export async function getBandById(bandId: string): Promise<BandRecord | null> {
  await ensureBandTablesExist();
  const bandRow = await pool.query<BandRow>(
    `SELECT * FROM bands WHERE id = $1 LIMIT 1`,
    [bandId],
  );
  if (bandRow.rows.length === 0) return null;
  const band = bandRow.rows[0];

  const membersRes = await pool.query<BandMemberRow>(
    `SELECT bm.*, u.name AS member_name, u.avatar_url AS member_avatar,
            u.primary_instrument AS member_instrument, u.musician_type AS member_musician_type
     FROM band_members bm
     INNER JOIN users u ON u.id = bm.user_id
     WHERE bm.band_id = $1
     ORDER BY bm.joined_at ASC`,
    [band.id],
  );

  return {
    id: band.id,
    name: band.name,
    creatorUserId: band.creator_user_id,
    createdAt: band.created_at,
    genre: band.genre ?? "",
    bio: band.bio ?? "",
    logoUrl: band.logo_url ?? "",
    bannerUrl: band.banner_url ?? "",
    bannerFit: band.banner_fit === "contain" ? "contain" : "cover",
    members: membersRes.rows.map((m) => ({
      id: m.id,
      bandId: m.band_id,
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      memberName: m.member_name ?? "",
      memberAvatar: m.member_avatar ?? "",
      memberInstrument: m.member_instrument ?? "",
      memberMusicianType: m.member_musician_type ?? "",
    })),
  };
}

export async function createBand(name: string, creatorUserId: string): Promise<BandRecord> {
  await ensureBandTablesExist();
  const id = `band-${randomUUID()}`;
  const now = new Date().toISOString();
  await pool.query(`INSERT INTO bands (id, name, creator_user_id, created_at) VALUES ($1, $2, $3, $4)`, [id, name, creatorUserId, now]);
  await pool.query(`INSERT INTO band_members (id, band_id, user_id, role, joined_at) VALUES ($1, $2, $3, 'admin', $4)`, [`bm-${randomUUID()}`, id, creatorUserId, now]);
  return {
    id,
    name,
    creatorUserId,
    createdAt: now,
    genre: "",
    bio: "",
    logoUrl: "",
    bannerUrl: "",
    bannerFit: "cover",
    members: [{
      id: `bm-${randomUUID()}`,
      bandId: id,
      userId: creatorUserId,
      role: "admin",
      joinedAt: now,
      memberName: "",
      memberAvatar: "",
      memberInstrument: "",
      memberMusicianType: "",
    }],
  };
}

export async function disbandBand(bandId: string, userId: string): Promise<boolean> {
  await ensureBandTablesExist();
  const res = await pool.query(`DELETE FROM bands WHERE id = $1 AND creator_user_id = $2`, [bandId, userId]);
  return (res.rowCount ?? 0) > 0;
}

export async function updateBandBranding(
  bandId: string,
  userId: string,
  data: {
    name?: string;
    genre?: string;
    bio?: string;
    logoUrl?: string;
    bannerUrl?: string;
    bannerFit?: "cover" | "contain";
  },
): Promise<boolean> {
  await ensureBandTablesExist();
  // Only admin/creator can update
  const memberCheck = await pool.query(
    `SELECT role FROM band_members WHERE band_id = $1 AND user_id = $2`,
    [bandId, userId],
  );
  if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== "admin") return false;

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
  if (data.genre !== undefined) { fields.push(`genre = $${idx++}`); values.push(data.genre); }
  if (data.bio !== undefined) { fields.push(`bio = $${idx++}`); values.push(data.bio); }
  if (data.logoUrl !== undefined) { fields.push(`logo_url = $${idx++}`); values.push(data.logoUrl); }
  if (data.bannerUrl !== undefined) { fields.push(`banner_url = $${idx++}`); values.push(data.bannerUrl); }
  if (data.bannerFit !== undefined) { fields.push(`banner_fit = $${idx++}`); values.push(data.bannerFit); }
  if (fields.length === 0) return true;

  values.push(bandId);
  await pool.query(`UPDATE bands SET ${fields.join(", ")} WHERE id = $${idx}`, values);
  return true;
}

export async function leaveBand(bandId: string, userId: string): Promise<void> {
  await ensureBandTablesExist();
  await pool.query(`DELETE FROM band_members WHERE band_id = $1 AND user_id = $2`, [bandId, userId]);
}

export async function sendBandInvitation(bandId: string, inviterUserId: string, inviteeUserId: string): Promise<BandInvitationRecord | null> {
  await ensureBandTablesExist();
  // Check invitee isn't already a member
  const existing = await pool.query(`SELECT id FROM band_members WHERE band_id = $1 AND user_id = $2`, [bandId, inviteeUserId]);
  if ((existing.rowCount ?? 0) > 0) return null;

  const id = `bi-${randomUUID()}`;
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO band_invitations (id, band_id, inviter_user_id, invitee_user_id, status, created_at)
     VALUES ($1, $2, $3, $4, 'pending', $5)
     ON CONFLICT (band_id, invitee_user_id) DO UPDATE SET status = 'pending', created_at = $5`,
    [id, bandId, inviterUserId, inviteeUserId, now],
  );
  const bandRes = await pool.query<{ name: string }>(`SELECT name FROM bands WHERE id = $1`, [bandId]);
  const inviterRes = await pool.query<{ name: string }>(`SELECT name FROM users WHERE id = $1`, [inviterUserId]);
  const inviteeRes = await pool.query<{ name: string }>(`SELECT name FROM users WHERE id = $1`, [inviteeUserId]);
  return {
    id,
    bandId,
    bandName: bandRes.rows[0]?.name ?? "",
    inviterUserId,
    inviterName: inviterRes.rows[0]?.name ?? "",
    inviteeUserId,
    inviteeName: inviteeRes.rows[0]?.name ?? "",
    status: "pending",
    createdAt: now,
  };
}

export async function getPendingInvitationsForUser(userId: string): Promise<BandInvitationRecord[]> {
  await ensureBandTablesExist();
  const res = await pool.query<BandInvitationRow>(
    `SELECT bi.*, b.name AS band_name, u1.name AS inviter_name, u2.name AS invitee_name
     FROM band_invitations bi
     INNER JOIN bands b ON b.id = bi.band_id
     INNER JOIN users u1 ON u1.id = bi.inviter_user_id
     INNER JOIN users u2 ON u2.id = bi.invitee_user_id
     WHERE bi.invitee_user_id = $1 AND bi.status = 'pending'
     ORDER BY bi.created_at DESC`,
    [userId],
  );
  return res.rows.map((row) => ({
    id: row.id,
    bandId: row.band_id,
    bandName: row.band_name ?? "",
    inviterUserId: row.inviter_user_id,
    inviterName: row.inviter_name ?? "",
    inviteeUserId: row.invitee_user_id,
    inviteeName: row.invitee_name ?? "",
    status: row.status as "pending" | "accepted" | "rejected",
    createdAt: row.created_at,
  }));
}

export async function respondToBandInvitation(invitationId: string, userId: string, accept: boolean): Promise<boolean> {
  await ensureBandTablesExist();
  const invRes = await pool.query<BandInvitationRow>(
    `UPDATE band_invitations SET status = $1 WHERE id = $2 AND invitee_user_id = $3 AND status = 'pending' RETURNING *`,
    [accept ? "accepted" : "rejected", invitationId, userId],
  );
  if ((invRes.rowCount ?? 0) === 0) return false;
  if (accept) {
    const inv = invRes.rows[0];
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO band_members (id, band_id, user_id, role, joined_at) VALUES ($1, $2, $3, 'member', $4) ON CONFLICT DO NOTHING`,
      [`bm-${randomUUID()}`, inv.band_id, inv.invitee_user_id, now],
    );
  }
  return true;
}

export async function setSoloMode(userId: string, isSolo: boolean): Promise<void> {
  await ensureBandTablesExist();
  await pool.query(`UPDATE users SET is_solo = $1 WHERE id = $2`, [isSolo, userId]);
}

export async function getBandPendingInvitations(bandId: string): Promise<BandInvitationRecord[]> {
  await ensureBandTablesExist();
  const res = await pool.query<BandInvitationRow>(
    `SELECT bi.*, b.name AS band_name, u1.name AS inviter_name, u2.name AS invitee_name
     FROM band_invitations bi
     INNER JOIN bands b ON b.id = bi.band_id
     INNER JOIN users u1 ON u1.id = bi.inviter_user_id
     INNER JOIN users u2 ON u2.id = bi.invitee_user_id
     WHERE bi.band_id = $1 AND bi.status = 'pending'
     ORDER BY bi.created_at DESC`,
    [bandId],
  );
  return res.rows.map((row) => ({
    id: row.id,
    bandId: row.band_id,
    bandName: row.band_name ?? "",
    inviterUserId: row.inviter_user_id,
    inviterName: row.inviter_name ?? "",
    inviteeUserId: row.invitee_user_id,
    inviteeName: row.invitee_name ?? "",
    status: row.status as "pending" | "accepted" | "rejected",
    createdAt: row.created_at,
  }));
}

const removedJobsSeedTitles = [
  "Guitarrista para gira regional",
  "Sesionista de bajo para estudio",
  "Director musical para showcase de debut",
  "Tecladista para residencia en venue",
  "Cantante para orquesta de salsa moderna",
  "DJ para club nocturno - residencia mensual",
];

const defaultJobsSeed: Array<Omit<JobRow, "created_at">> = [
  {
    id: "j-1",
    title: "Guitarrista para gira regional",
    type: "Evento",
    city: "Santiago",
    image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
    pay: "USD 450 / show",
    summary: "Proyecto de 6 fechas con repertorio pop-rock.",
    description: "Buscamos guitarrista electrico con experiencia en pop-rock para una gira de 6 fechas por el Cibao. Repertorio de 90 min ya definido. Se realizaran 2 ensayos presenciales antes del primer show. Transporte y alojamiento incluidos en fechas fuera de la ciudad.",
    requires_cv: true,
    requester_name: "Carlos Mendoza",
    requester_role: "Manager artistico",
    requirements: JSON.stringify(["Experiencia minima 2 anos en tarima", "Conocimiento de escala pentatonica y blues", "Disponibilidad fines de semana mayo-junio", "Equipo propio (guitarra + pedalera)"]),
    deadline: "2026-05-10",
    poster_user_id: "u-poster-carlos",
  },
  {
    id: "j-2",
    title: "Sesionista de bajo para estudio",
    type: "Estudio",
    city: "Santo Domingo",
    image_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=80",
    pay: "USD 320 / track pack",
    summary: "Grabacion de EP urbano alternativo.",
    description: "Produccion de EP de 6 temas con influencias de trap, R&B y rock alternativo. Se graba en estudio propio en Piantini. Se requiere bajista con feel ritmico solido y capacidad de improvisar sobre referencia.",
    requires_cv: false,
    requester_name: "Brayan Perez",
    requester_role: "Productor / Beatmaker",
    requirements: JSON.stringify(["Dominio de slap y fingerstyle", "Lectura de cifrado Nashville", "Disponibilidad diurna (lunes a viernes)"]),
    deadline: "2026-04-28",
    poster_user_id: "u-poster-brayan",
  },
  {
    id: "j-3",
    title: "Director musical para showcase de debut",
    type: "Proyecto",
    city: "La Vega",
    image_url: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=900&q=80",
    pay: "USD 1,200 / proyecto",
    summary: "Direccion de banda y montaje de show debut.",
    description: "Artista nueva con lanzamiento de album debut en junio. Necesitamos director musical que coordine a 5 musicos, defina arreglos en vivo y lidere los ensayos. El showcase es en un venue de 300 personas.",
    requires_cv: true,
    requester_name: "Lena Castillo",
    requester_role: "Artista independiente",
    requirements: JSON.stringify(["Experiencia dirigiendo bandas en vivo", "Conocimiento de in-ear monitors y click track", "Capacidad de leer y escribir partituras", "Disponible para 4 ensayos presenciales"]),
    deadline: "2026-05-20",
    poster_user_id: "u-poster-lena",
  },
  {
    id: "j-4",
    title: "Tecladista para residencia en venue",
    type: "Residencia",
    city: "Santo Domingo",
    image_url: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=80",
    pay: "USD 380 / show",
    summary: "Residencia mensual en venue del centro.",
    description: "Venue de musica en vivo en la Zona Colonial busca tecladista para residencia fija los viernes y sabados de cada mes. Set de 3 horas con generos variados: merengue, salsa, bachata, pop. Se proporciona keyboard del venue.",
    requires_cv: false,
    requester_name: "Bar El Compas",
    requester_role: "Venue / Productor de eventos",
    requirements: JSON.stringify(["Dominio de generos caribeños", "Puntualidad y profesionalismo", "Referencias de trabajos anteriores"]),
    deadline: "2026-04-30",
    poster_user_id: "u-poster-elcompas",
  },
  {
    id: "j-5",
    title: "Cantante para orquesta de salsa moderna",
    type: "Proyecto",
    city: "Santo Domingo",
    image_url: "https://images.unsplash.com/photo-1501386761578-eaa54b9cb69d?auto=format&fit=crop&w=900&q=80",
    pay: "USD 600 / mes",
    summary: "Proyecto musical con contrato de 6 meses y grabacion incluida.",
    description: "Orquesta de salsa contemporanea busca voz principal masculina o femenina. El proyecto tiene contrato, ensayos semanales y al menos 3 presentaciones mensuales. Grabacion de single incluida en los primeros 3 meses.",
    requires_cv: true,
    requester_name: "Orquesta La Nueva Ola",
    requester_role: "Director de orquesta",
    requirements: JSON.stringify(["Voz principal con extension de al menos 2 octavas", "Experiencia en orquesta o banda en vivo", "Disponibilidad para ensayos domingos", "Fotografia y redes sociales activas"]),
    deadline: "2026-05-05",
    poster_user_id: "u-poster-nuevaola",
  },
  {
    id: "j-6",
    title: "Baterista para banda de rock alternativo",
    type: "Proyecto",
    city: "Santiago",
    image_url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=900&q=80",
    pay: "USD 250 / show + porcentaje de merch",
    summary: "Banda en formacion busca baterista con energia y creatividad.",
    description: "Proyecto de rock alternativo con influencias de Arctic Monkeys, Interpol y Calle 13. Tenemos 8 temas propios y buscamos baterista que aporte ideas al arreglo. Estamos en proceso de buscar sello independiente.",
    requires_cv: false,
    requester_name: "Banda Ruido Norte",
    requester_role: "Proyecto musical",
    requirements: JSON.stringify(["Dominio de ritmos en compas 4/4, 6/8 y 7/8", "Bateria propia o acceso a kit completo", "Disponibilidad para ensayar 2 veces por semana", "Abierto a retroalimentacion y composicion colectiva"]),
    deadline: "2026-05-15",
    poster_user_id: "u-poster-ruidonorte",
  },
  {
    id: "j-7",
    title: "Productor para EP de musica urbana",
    type: "Estudio",
    city: "Santo Domingo",
    image_url: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=900&q=80",
    pay: "USD 800 / EP completo",
    summary: "Artista urbana busca productor para EP de 5 temas.",
    description: "Artista femenina con 50K seguidores en Instagram busca productor para su EP debut. Referencias musicales: Rosalia, Bad Gyal, Tokischa. Se requiere productor con manejo de FL Studio o Ableton y que aporte vision artistica.",
    requires_cv: true,
    requester_name: "Valentina M.",
    requester_role: "Artista urbana independiente",
    requirements: JSON.stringify(["Portfolio de producciones propias", "Manejo de FL Studio 20 o Ableton 11+", "Disponibilidad para sesiones en estudio en Santo Domingo", "Referencia de al menos un lanzamiento en plataformas digitales"]),
    deadline: "2026-05-01",
    poster_user_id: "u-poster-valentina",
  },
  {
    id: "j-8",
    title: "Violinista para cuarteto de bodas y eventos",
    type: "Evento",
    city: "Santo Domingo",
    image_url: "https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?auto=format&fit=crop&w=900&q=80",
    pay: "USD 200 / evento (3 hrs)",
    summary: "Cuarteto de cuerdas busca violinista para eventos sociales.",
    description: "Cuarteto de cuerdas establecido con agenda activa de bodas, cocteles y eventos corporativos busca violinista para cubrir agenda de mayo y junio. Repertorio clasico, pop y crossover ya preparado. No se requiere ensayo para la mayoria de fechas.",
    requires_cv: false,
    requester_name: "Cuarteto Arco Iris",
    requester_role: "Ensamble musical",
    requirements: JSON.stringify(["Lectura de partitura fluida", "Vestuario formal propio", "Disponibilidad fines de semana", "Puntualidad estricta"]),
    deadline: "2026-04-25",
    poster_user_id: "u-poster-arcoiris",
  },
  {
    id: "j-9",
    title: "DJ para club nocturno - residencia mensual",
    type: "Residencia",
    city: "Punta Cana",
    image_url: "https://images.unsplash.com/photo-1571266028243-d220c6a7f1e6?auto=format&fit=crop&w=900&q=80",
    pay: "USD 700 / noche",
    summary: "Club premium busca DJ residente con manejo de musica electronica.",
    description: "Club de lujo en Punta Cana busca DJ residente para dos noches al mes (viernes o sabado). Capacidad 400 personas. Expectativa de manejo de house, afrobeats y reggaeton premium. Se requiere experiencia previa en clubes.",
    requires_cv: false,
    requester_name: "Club Zenith PC",
    requester_role: "Club / Booking manager",
    requirements: JSON.stringify(["Minimo 3 anos de experiencia en clubes", "Equipo propio (controlador + laptop)", "Mix de prueba de 30 min enviado antes de entrevista", "Disponibilidad para 2 noches al mes"]),
    deadline: "2026-05-08",
    poster_user_id: "u-poster-zenith",
  },
  {
    id: "j-10",
    title: "Trompetista para big band de jazz",
    type: "Proyecto",
    city: "Santo Domingo",
    image_url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=900&q=80",
    pay: "USD 180 / ensayo + 300 / show",
    summary: "Big band de 18 musicos busca trompetista de seccion.",
    description: "Big band de jazz dominicana con 10 anos de trayectoria abre espacio para trompetista de seccion (2do o 3er trompeta). Repertorio de Basie, Ellington y composiciones originales. Presentaciones en festivales y venues de jazz 4 veces al ano.",
    requires_cv: true,
    requester_name: "Big Band Quisqueya Jazz",
    requester_role: "Director artistico",
    requirements: JSON.stringify(["Lectura de particella a primera vista", "Experiencia en seccion de metales", "Trompeta propia en buen estado", "Asistencia obligatoria a ensayos semanales (miercoles 7pm)"]),
    deadline: "2026-05-25",
    poster_user_id: "u-poster-quisqueyajazz",
  },
  {
    id: "j-11",
    title: "Musico de sesion - Guitarra acustica para album",
    type: "Estudio",
    city: "Santiago",
    image_url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80",
    pay: "USD 150 / sesion de 4 hrs",
    summary: "Grabacion de partes de guitarra acustica para album de folk dominicano.",
    description: "Album de folk y musica rural dominicana en proceso de grabacion. Necesitamos guitarrista con conocimiento de palos, merengue tipico y musica campesina. Las sesiones son en Santiago, estudio con Pro Tools. Estimado 3 a 4 sesiones.",
    requires_cv: false,
    requester_name: "Rafael Duarte",
    requester_role: "Compositor e investigador musical",
    requirements: JSON.stringify(["Conocimiento de ritmos folkloricos dominicanos", "Guitarra de 12 cuerdas o clasica de nylon propia", "Disposicion para improvisar dentro de estructura", "Silencio de telefono durante grabacion"]),
    deadline: "2026-05-12",
    poster_user_id: "u-poster-rafael",
  },
  {
    id: "j-12",
    title: "Instructor de piano para academia de musica",
    type: "Docencia",
    city: "Santo Domingo",
    image_url: "https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=900&q=80",
    pay: "USD 25 / hora clase",
    summary: "Academia busca instructor de piano para ninos y adolescentes.",
    description: "Academia de musica en Bella Vista busca instructor de piano para clases individuales de ninos de 6 a 16 anos. Horario de tarde (3pm - 7pm). Metodo Suzuki o similar. Contrato de 6 meses renovable con posibilidad de tiempo completo.",
    requires_cv: true,
    requester_name: "Academia Notas y Solfeo",
    requester_role: "Directora academica",
    requirements: JSON.stringify(["Licenciatura o tecnico en musica (con piano como instrumento principal)", "Experiencia previa en docencia con menores", "Paciencia y habilidad pedagogica", "Disponibilidad de lunes a viernes de 3pm a 7pm"]),
    deadline: "2026-04-30",
    poster_user_id: "u-poster-notasysolfeo",
  },
  {
    id: "j-13",
    title: "Percusionista para proyecto afro-caribeño",
    type: "Proyecto",
    city: "Santo Domingo",
    image_url: "https://images.unsplash.com/photo-1543443258-92b04ad5ec6b?auto=format&fit=crop&w=900&q=80",
    pay: "USD 300 / show",
    summary: "Colectivo musical afro-caribeño busca percusionista con raices.",
    description: "Proyecto musical interdisciplinario que combina percusion afrodomincana, jazz y electronica experimental. Buscamos percusionista con conocimiento de tambora, palo y conga. El proyecto tiene presentaciones en festivales culturales y colaboraciones con danza.",
    requires_cv: false,
    requester_name: "Colectivo Raiz Viva",
    requester_role: "Colectivo artistico",
    requirements: JSON.stringify(["Dominio de tambora y/o palo dominicano", "Apertura a fusion e improvisacion", "Disponibilidad para ensayos los martes", "Compromiso con identidad cultural afrodominicana"]),
    deadline: "2026-05-18",
    poster_user_id: "u-poster-raizviva",
  },
  {
    id: "j-14",
    title: "Saxofonista para trio de jazz en restaurante",
    type: "Residencia",
    city: "Santo Domingo",
    image_url: "https://images.unsplash.com/photo-1619983081593-e2ba5b543168?auto=format&fit=crop&w=900&q=80",
    pay: "USD 120 / noche (3 sets)",
    summary: "Restaurante de cocina francesa busca trio de jazz con saxo.",
    description: "Restaurante Bon Appetit en Serralles busca saxofonista para trio de jazz (piano, contrabajo, saxo) los jueves y viernes de 7pm a 10pm. Repertorio de jazz estandar. Ambiente intimo y sofisticado. Contrato mensual renovable.",
    requires_cv: false,
    requester_name: "Restaurante Bon Appetit",
    requester_role: "Gerente de entretenimiento",
    requirements: JSON.stringify(["Saxo tenor o alto propio en buen estado", "Repertorio de jazz standards (Real Book)", "Presentacion impecable (traje formal)", "Disponibilidad jueves y viernes 6:30pm"]),
    deadline: "2026-04-27",
    poster_user_id: "u-poster-bonappetit",
  },
  {
    id: "j-15",
    title: "Tecnico de sonido para festival de musica",
    type: "Evento",
    city: "Puerto Plata",
    image_url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=900&q=80",
    pay: "USD 900 / festival (3 dias)",
    summary: "Festival de musica independiente busca tecnico de sonido principal.",
    description: "Festival de musica independiente 'Sonar RD' en Puerto Plata (2 al 4 de junio) busca tecnico de sonido principal para escenario principal con capacidad de 2000 personas. Incluye hospedaje, alimentacion y transporte.",
    requires_cv: true,
    requester_name: "Sonar RD Festival",
    requester_role: "Produccion ejecutiva",
    requirements: JSON.stringify(["Minimo 5 anos de experiencia en sonido en vivo", "Manejo de consola digital (SSL, DiGiCo o Yamaha CL)", "Experiencia en festivales o eventos de gran formato", "Portfolio con eventos anteriores"]),
    deadline: "2026-05-15",
    poster_user_id: "u-poster-sonarrd",
  },
].filter((job) => !removedJobsSeedTitles.includes(job.title));

const defaultInstructorPasswordHash = "$2b$12$4rRbdKDtwKkF23ADIWxzhOyrx/bMeN9nVOeax7uTyV2pfCUa1qsIm";

const defaultInstructorUsersSeed: Array<{
  id: string;
  name: string;
  email: string;
}> = [
    { id: "u-santi-diaz", name: "Santi Diaz", email: "santi@ritmohub.app" },
    { id: "u-nina-rosario", name: "Nina Rosario", email: "nina@ritmohub.app" },
    { id: "u-laura-perez", name: "Laura Perez", email: "laura@ritmohub.app" },
    { id: "u-diego-mora", name: "Diego Mora", email: "diego@ritmohub.app" },
    { id: "u-ariel-gomez", name: "Ariel Gomez", email: "ariel@ritmohub.app" },
    { id: "u-leo-martin", name: "Leo Martin", email: "leo@ritmohub.app" },
    { id: "u-ritmohub-labs", name: "RitmoHub Labs", email: "labs@ritmohub.app" },
    // Chat community users (can be written to)
    { id: "u-chat-sofia", name: "Sofia Reyes", email: "sofia.reyes@ritmohub.app" },
    { id: "u-chat-miguel", name: "Miguel Torres", email: "miguel.torres@ritmohub.app" },
    { id: "u-chat-camila", name: "Camila Vargas", email: "camila.vargas@ritmohub.app" },
    { id: "u-chat-andres", name: "Andres Morel", email: "andres.morel@ritmohub.app" },
    { id: "u-chat-isabella", name: "Isabella Cruz", email: "isabella.cruz@ritmohub.app" },
    { id: "u-chat-jose", name: "Jose Almonte", email: "jose.almonte@ritmohub.app" },
    { id: "u-chat-natalia", name: "Natalia Melo", email: "natalia.melo@ritmohub.app" },
    { id: "u-chat-david", name: "David Pena", email: "david.pena@ritmohub.app" },
    { id: "u-chat-lucia", name: "Lucia Soto", email: "lucia.soto@ritmohub.app" },
    { id: "u-chat-fernando", name: "Fernando Rojas", email: "fernando.rojas@ritmohub.app" },
    // Job poster users
    { id: "u-poster-carlos", name: "Carlos Mendoza", email: "carlos.mendoza@ritmohub.app" },
    { id: "u-poster-brayan", name: "Brayan Perez", email: "brayan.perez@ritmohub.app" },
    { id: "u-poster-lena", name: "Lena Castillo", email: "lena.castillo@ritmohub.app" },
    { id: "u-poster-elcompas", name: "Bar El Compas", email: "elcompas@ritmohub.app" },
    { id: "u-poster-nuevaola", name: "Orquesta La Nueva Ola", email: "nuevaola@ritmohub.app" },
    { id: "u-poster-ruidonorte", name: "Banda Ruido Norte", email: "ruidonorte@ritmohub.app" },
    { id: "u-poster-valentina", name: "Valentina M.", email: "valentina.m@ritmohub.app" },
    { id: "u-poster-arcoiris", name: "Cuarteto Arco Iris", email: "arcoiris@ritmohub.app" },
    { id: "u-poster-zenith", name: "Club Zenith PC", email: "zenith@ritmohub.app" },
    { id: "u-poster-quisqueyajazz", name: "Big Band Quisqueya Jazz", email: "quisqueyajazz@ritmohub.app" },
    { id: "u-poster-rafael", name: "Rafael Duarte", email: "rafael.duarte@ritmohub.app" },
    { id: "u-poster-notasysolfeo", name: "Academia Notas y Solfeo", email: "notasysolfeo@ritmohub.app" },
    { id: "u-poster-raizviva", name: "Colectivo Raiz Viva", email: "raizviva@ritmohub.app" },
    { id: "u-poster-bonappetit", name: "Restaurante Bon Appetit", email: "bonappetit@ritmohub.app" },
    { id: "u-poster-sonarrd", name: "Sonar RD Festival", email: "sonarrd@ritmohub.app" },
  ];

const defaultCoursesSeed: Array<{
  id: string;
  title: string;
  instructor: string;
  instructor_user_id: string | null;
  level: string;
  image_url: string;
  summary: string;
  price_usd: number;
}> = [
    {
      id: "course-1",
      title: "Produccion Urbana desde Cero",
      instructor: "Santi Diaz",
      instructor_user_id: "u-santi-diaz",
      level: "Intermedio",
      image_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80",
      summary: "Aprende a producir beats, arreglos y mezcla para lanzamientos urbanos modernos.",
      price_usd: 49,
    },
    {
      id: "course-2",
      title: "Voz en Vivo y Presencia Escenica",
      instructor: "Nina Rosario",
      instructor_user_id: "u-nina-rosario",
      level: "Basico",
      image_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
      summary: "Tecnica vocal, control de respiracion y performance para conciertos.",
      price_usd: 39,
    },
    {
      id: "course-3",
      title: "Marketing para Artistas Independientes",
      instructor: "Laura Perez",
      instructor_user_id: "u-laura-perez",
      level: "Todos",
      image_url: "https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?auto=format&fit=crop&w=900&q=80",
      summary: "Estrategias de contenido, branding y conversion para vender entradas y cursos.",
      price_usd: 59,
    },
    {
      id: "course-4",
      title: "Ableton Live: Produccion Rapida para Shows",
      instructor: "Diego Mora",
      instructor_user_id: "u-diego-mora",
      level: "Intermedio",
      image_url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80",
      summary: "Flujo de trabajo para crear sesiones live, stems y transiciones listas para escenario.",
      price_usd: 79,
    },
    {
      id: "course-5",
      title: "Mix y Master para Streaming",
      instructor: "Ariel Gomez",
      instructor_user_id: "u-ariel-gomez",
      level: "Avanzado",
      image_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=80",
      summary: "Estandares de loudness, control de dinamica y exportes optimos para Spotify y Apple Music.",
      price_usd: 89,
    },
    {
      id: "course-6",
      title: "Guitarra Ritmica Moderna",
      instructor: "Leo Martin",
      instructor_user_id: "u-leo-martin",
      level: "Basico",
      image_url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80",
      summary: "Patrones ritmicos, acentos y recursos practicos para tocar en banda con mayor groove.",
      price_usd: 29,
    },
    {
      id: "course-10",
      title: "Booking y Negocio Musical para Bandas",
      instructor: "Laura Perez",
      instructor_user_id: "u-laura-perez",
      level: "Intermedio",
      image_url: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
      summary: "Cierra fechas, negocia condiciones y crea una operacion profesional sostenible.",
      price_usd: 65,
    },
  ];

type ModuleSeed = {
  id: string;
  course_id: string;
  position: number;
  title: string;
  lesson_type: "video" | "reading" | "practice";
  duration_minutes: number;
  content: string;
  video_url: string;
};

const defaultCourseModulesSeed: ModuleSeed[] = [

  // ── COURSE 1: Produccion Urbana desde Cero ──────────────────────────────
  {
    id: "course-1-m1", course_id: "course-1", position: 1,
    title: "Bienvenida e instalacion de tu DAW",
    lesson_type: "video", duration_minutes: 15,
    content: "Conoce el flujo de trabajo completo del curso y configura tu DAW (FL Studio o Logic Pro) para produccion urbana. Aprenderemos a organizar el proyecto, configurar el buffer de audio para reducir latencia y establecer las carpetas de samples. Al terminar esta leccion tendras un template listo para trabajar desde el primer dia sin perder tiempo en configuraciones.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-1-m2", course_id: "course-1", position: 2,
    title: "Anatomia de un beat urbano moderno",
    lesson_type: "reading", duration_minutes: 20,
    content: "Analizamos la estructura de un hit urbano reciente: intro de 4 barras, verso, pre-coro, coro, puente y outro. Estudiaremos como se distribuyen kick, snare, hi-hats cerrados y abiertos, claps y percs en el patron ritmico de 16 pasos. Incluye tabla comparativa de BPM por genero: trap (130-160 BPM), reggaeton (90-100 BPM), R&B (70-90 BPM) y drill (140-150 BPM). Aprenderas a identificar el 'espacio' en el ritmo que distingue a los productores profesionales.",
    video_url: "",
  },
  {
    id: "course-1-m3", course_id: "course-1", position: 3,
    title: "Programacion de bateria: kick, snare y hi-hats",
    lesson_type: "video", duration_minutes: 28,
    content: "Programamos desde cero un patron de trap usando samples de bateria profesionales. Veremos como humanizar la velocidad (velocity) de los hi-hats para evitar el sonido robotico, como aplicar swing del 55-60% para darle groove y como crear fills de transicion. Tambien cubrimos tecnicas de layering: combinar dos o tres kicks para obtener el impacto y el sub deseados. Al final de la leccion tendras tres patrones distintos listos para usar.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-1-m4", course_id: "course-1", position: 4,
    title: "El 808: afinacion, sustain y sidechain",
    lesson_type: "video", duration_minutes: 32,
    content: "El 808 es el elemento mas critico del beat urbano moderno. Aprenderemos a afinar el 808 con la nota fundamental del sample o de la melodia usando un analizador de tono. Cubriremos el control del pitch automation para crear slides expresivos, el ajuste del sustain segun el BPM y la tecnica de sidechain con el kick para que ambos elementos convivan sin cancelarse en las bajas frecuencias. Tambien veremos distorsion suave en el 808 para que sea audible en reproductores pequenos.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-1-m5", course_id: "course-1", position: 5,
    title: "Melodias con synths y piano roll",
    lesson_type: "practice", duration_minutes: 35,
    content: "Ejercicio guiado: crea una melodia de 8 barras usando un sintetizador virtual (Serum, Vital o el que tengas). Trabajaremos en la escala menor natural y menor armonico, las mas comunes en musica urbana. Aprenderemos a seleccionar el tono y timbre del synth (pad suave vs lead brillante), a cuantizar parcialmente para mantener humanidad y a agregar ornamentos como vibratos y slides. La tarea es entregar una melodia de 8 barras que se repita dos veces con una variacion en la segunda repeticion.",
    video_url: "",
  },
  {
    id: "course-1-m6", course_id: "course-1", position: 6,
    title: "Sampling legal: crates digitales y flip",
    lesson_type: "reading", duration_minutes: 22,
    content: "El sampling es la base del hip-hop pero implica responsabilidad legal. Estudiaremos la diferencia entre sample clearance (licencia del master y de la composicion) y las alternativas libres de derechos: bancos como Splice, Looperman y sample packs royalty-free. Aprenderemos la tecnica del 'flip': transformar un sample original cambiando el tono, el tempo, filtrando frecuencias y re-armonizando para que sea irreconocible. Incluye checklist de lo que debes hacer antes de usar cualquier sample en un lanzamiento comercial.",
    video_url: "",
  },
  {
    id: "course-1-m7", course_id: "course-1", position: 7,
    title: "Mezcla del beat: EQ, compresion y espacio",
    lesson_type: "video", duration_minutes: 40,
    content: "En esta leccion hacemos una mezcla completa del beat. Comenzamos con gain staging: asegurar que ningun canal supere los -6 dBFS antes de procesamiento. Luego aplicamos EQ substractivo para limpiar frecuencias enmascaradas (entre 200-400 Hz suele haber barro), compresor de bus para cohesion y reverb de sala corta solo en el snare. Cubrimos el concepto de referencia de mezcla: compara tu beat con una produccion comercial cada 15 minutos para mantener perspectiva objetiva.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-1-m8", course_id: "course-1", position: 8,
    title: "Exportacion, stems y entrega al artista",
    lesson_type: "reading", duration_minutes: 18,
    content: "Un productor profesional entrega stems organizados, no solo el beat en stereo. Aprenderemos que son los stems (instrumentales separados: drums bus, 808 bus, melodia bus, extras bus), como exportarlos a 24 bit / 44.1 kHz WAV sin procesamiento en el master, y como nombrar archivos correctamente (BPM_Key_Title_v1). Tambien cubrimos los formatos de contratos de beat: non-exclusive (licencia), exclusive y work-for-hire, con sus implicaciones para derechos de autor.",
    video_url: "",
  },
  {
    id: "course-1-m9", course_id: "course-1", position: 9,
    title: "Estrategia de lanzamiento en plataformas digitales",
    lesson_type: "video", duration_minutes: 20,
    content: "Aprenderemos a subir beats a BeatStars y Airbit con precios correctos, tags SEO que atraen artistas y politica de licencias clara. Cubriremos YouTube beat promotion: como monetizar el canal con beats libres de derechos y usar las primeras 24 horas de un upload para maximizar el algoritmo. Tambien veremos como construir una lista de contacto de artistas y managers para enviar demos de forma profesional sin spam.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-1-m10", course_id: "course-1", position: 10,
    title: "Proyecto final: produce y entrega un beat completo",
    lesson_type: "practice", duration_minutes: 50,
    content: "Pon en practica todo lo del curso: produce un beat de 2:30 min con intro, verso, coro y outro. Requiere: patron de bateria personalizado, 808 afinado con sidechain, melodia original de 8 barras, mezcla con referencias y exportacion en stems + stereo WAV. La rubrica evalua coherencia ritmica, balance de frecuencias, creatividad melodica y orden de entrega. Sube tu beat a SoundCloud (unlisted) y comparte el link en la comunidad del curso para feedback de otros estudiantes.",
    video_url: "",
  },

  // ── COURSE 2: Voz en Vivo y Presencia Escenica ──────────────────────────
  {
    id: "course-2-m1", course_id: "course-2", position: 1,
    title: "Anatomia de la voz y salud vocal",
    lesson_type: "video", duration_minutes: 18,
    content: "Entendemos como funcionan las cuerdas vocales, los resonadores (pecho, mascara, cabeza) y el mecanismo de la respiracion diafragmatica. Aprenderemos los habitos que danan la voz: gritar en ambientes secos, no calentar, consumir lacteos antes de actuar y hablar susurrado cuando la voz esta cansada. Cubrimos la rutina de hidratacion (agua tibia, no fria) y como reconocer las senales de fatiga vocal antes de que se conviertan en una lesion seria.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-2-m2", course_id: "course-2", position: 2,
    title: "Calentamiento vocal: rutina de 15 minutos",
    lesson_type: "practice", duration_minutes: 25,
    content: "Esta leccion es un calentamiento guiado que debes hacer antes de cada ensayo o show. Comenzamos con masaje facial y de cuello, seguimos con humming (tarareo) en escala cromatica, lip trills para relajar la laringe, vocales abiertas con crescendo y luego octava jumps para activar el registro de cabeza. La regla de oro: nunca fuerces una nota que no sale con comodidad en el calentamiento; esa nota no saldra mejor en el show.",
    video_url: "",
  },
  {
    id: "course-2-m3", course_id: "course-2", position: 3,
    title: "Tecnica de respiracion diafragmatica",
    lesson_type: "video", duration_minutes: 22,
    content: "La respiracion es el motor de la voz. Veremos la diferencia entre respiracion clavicular (superficial, mala para cantar) y respiracion diafragmatica (profunda, sostenida). Practica el ejercicio del libro en el suelo: acostado boca arriba coloca un libro en el abdomen y observa como sube al inhalar. Luego trasladamos esa sensacion a la posicion de pie. Aprenderemos a gestionar el aire en frases largas y a usar el apoyo del diafragma para proyectar sin forzar la garganta.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-2-m4", course_id: "course-2", position: 4,
    title: "Proyeccion y resonadores naturales",
    lesson_type: "practice", duration_minutes: 30,
    content: "Ejercicio: canta la misma frase apuntando el sonido a la nariz (resonador de mascara) y luego al pecho. Escucha la diferencia en el timbre y la proyeccion. El resonador de mascara da brillo y corte para traversar el ruido de banda; el resonador de pecho da calidez y cuerpo. Aprenderemos a mezclar ambos segun el genero: un balad pop usa mas pecho, un rock or pop dance usa mas mascara. Al final habremos desarrollado consciencia sobre donde 'colocar' la voz segun el contexto.",
    video_url: "",
  },
  {
    id: "course-2-m5", course_id: "course-2", position: 5,
    title: "Tecnica de microfono en vivo",
    lesson_type: "video", duration_minutes: 18,
    content: "El manejo del microfono es una habilidad tecnica que pocos cantantes aprenden formalmente. Veremos la distancia correcta segun la dinamica de la frase (cerca para pasajes suaves, alejarse en notas agudas fuertes para evitar clipeo), el angulo para minimizar feedback, como sostener el microfono sin tapar la capsula y la diferencia entre micros dinamicos (SM58: robusto, live) y de condensador (para estudio). Tambien cubrimos monitor en vivo: como pedir el mix que necesitas al tecnico de sonido.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-2-m6", course_id: "course-2", position: 6,
    title: "Presencia escenica y lenguaje corporal",
    lesson_type: "reading", duration_minutes: 20,
    content: "Los estudios de comunicacion indican que el 55% del impacto de una presentacion viene del lenguaje corporal. Aprenderemos postura de poder (piernas separadas a la altura de hombros, hombros atras, pecho abierto), como hacer contacto visual genuino con el publico por sectores, movimiento natural vs movimiento ensayado y como usar el espacio del escenario. Incluye lista de errores comunes: mirar el suelo, dar la espalda al publico, tensionar los hombros y sostener el microfono con ambas manos nerviosamente.",
    video_url: "",
  },
  {
    id: "course-2-m7", course_id: "course-2", position: 7,
    title: "Armado de un setlist ganador",
    lesson_type: "reading", duration_minutes: 15,
    content: "El orden de las canciones en un show define la energia de toda la noche. Aprenderemos la estructura clasica: abrir con una cancion energetica conocida para engancharse con el publico, mantener tension con temas de mediana intensidad en el cuerpo del show, incluir una balada o momento intimo en el tercio final y cerrar con el hit o tema mas emocional. Cubrimos como calcular el tiempo de transicion entre canciones, la importancia de los momentos de silencio y como adaptar el setlist en tiempo real si algo no funciona.",
    video_url: "",
  },
  {
    id: "course-2-m8", course_id: "course-2", position: 8,
    title: "Manejo de los nervios y preparacion mental",
    lesson_type: "video", duration_minutes: 20,
    content: "Los nervios escenicos son energia mal gestionada, no una debilidad. Veremos tecnicas de reencuadre cognitivo (de 'tengo miedo' a 'estoy activado'), la tecnica de respiracion 4-7-8 para bajar el cortisol antes de salir al escenario, la importancia del ritual pre-show y como usar la visualizacion guiada para ensayar mentalmente el concierto 24 horas antes. Entrevistamos a artistas locales sobre sus rutinas de preparacion mental y que hacen cuando algo sale mal en escena.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-2-m9", course_id: "course-2", position: 9,
    title: "Simulacro de concierto y autoevaluacion",
    lesson_type: "practice", duration_minutes: 45,
    content: "Practica final: graba en video un performance de 3 canciones como si fuera un show real. Usa calentamiento completo antes, aplica todo lo aprendido (respiracion, proyeccion, presencia, microfono) y al terminar ve el video con la rubrica del curso. Evalua en escala 1-5: afinacion, proyeccion, presencia, manejo del microfono y conexion con la cancion. Identifica los dos puntos mas debiles y establece un plan de practica especifico para mejorarlos en las proximas 2 semanas.",
    video_url: "",
  },

  // ── COURSE 3: Marketing para Artistas Independientes ────────────────────
  {
    id: "course-3-m1", course_id: "course-3", position: 1,
    title: "Identidad de marca artistica",
    lesson_type: "video", duration_minutes: 22,
    content: "Tu marca artistica es la promesa que haces a tu audiencia antes de que suene la primera nota. Aprenderemos a definir el arquetipo de artista (el rebelde, el sabio, el heroe, el amante), a construir una propuesta de valor unica (UVP: que te diferencia de otros artistas de tu genero) y a plasmarla en moodboard visual de paleta de colores, tipografia y referencias fotograficas. Ejercicio: escribe en una oracion quien eres, para quien es tu musica y que emocion produces en tu oyente ideal.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-3-m2", course_id: "course-3", position: 2,
    title: "Redes sociales: que publicar y cuando",
    lesson_type: "reading", duration_minutes: 25,
    content: "Cada plataforma tiene su propia logica de contenido. Instagram (Reels: proceso creativo, behind the scenes, fragmentos de canciones), TikTok (tendencias de audio, humor musical, educacion en 60 segundos), YouTube (videos musicales completos, vlogs de gira, tutoriales), Twitter/X (opiniones, noticias del sector, conversacion directa) y Facebook (eventos, grupos de fans, transmisiones en vivo). Aprenderemos el principio 80/20: 80% contenido de valor o entretenimiento, 20% promocion directa de lanzamientos o shows.",
    video_url: "",
  },
  {
    id: "course-3-m3", course_id: "course-3", position: 3,
    title: "Calendario de contenido para 30 dias",
    lesson_type: "practice", duration_minutes: 30,
    content: "Ejercicio practico: construye un calendario de contenido de 30 dias en Notion o una hoja de calculo. Planifica 4 Reels, 12 historias, 2 posts estaticos en Instagram y 15 TikToks. Cada pieza debe tener: fecha, plataforma, formato, descripcion del contenido, llamada a la accion y metrica objetivo. Aprenderemos a reciclar contenido entre plataformas (un making-of en TikTok puede ser el tutorial corto de YouTube Shorts del dia siguiente). Incluye plantilla descargable con 60 ideas de contenido especificas para musicos.",
    video_url: "",
  },
  {
    id: "course-3-m4", course_id: "course-3", position: 4,
    title: "Como pitchear a Spotify Editorial",
    lesson_type: "reading", duration_minutes: 20,
    content: "Spotify for Artists permite pitchear canciones a los editores de playlists antes del lanzamiento. Aprenderemos a completar el pitch correctamente: descripcion del estado de animo (mood), instrumentacion principal, generos secundarios y contexto de la historia de la cancion. Los editores reciben miles de pitches; el tuyo debe ser especifico, autentico y sin hiperboles. Cubrimos los factores que Spotify valora para playlists editoriales: trayectoria de streams, save rate, skip rate y si el artista tiene momentum actual.",
    video_url: "",
  },
  {
    id: "course-3-m5", course_id: "course-3", position: 5,
    title: "Tu lista de email: el activo que nadie puede quitarte",
    lesson_type: "video", duration_minutes: 22,
    content: "Los algoritmos cambian, las plataformas caen, pero tu lista de email es tuya. Aprenderemos a configurar Mailchimp o ConvertKit de forma gratuita, a crear un lead magnet musical (descarga de un sample pack, acustico exclusivo o letra comentada) para capturar correos, y a escribir una secuencia de bienvenida de 3 correos que construye relacion antes de pedir algo. Estadistica clave: el email marketing tiene un ROI de $36 por cada $1 invertido, superando ampliamente a cualquier red social.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-3-m6", course_id: "course-3", position: 6,
    title: "Estrategia de lanzamiento de single",
    lesson_type: "video", duration_minutes: 28,
    content: "Un lanzamiento bien ejecutado en 4 semanas: Semana 1 (teaser: 15 segundos del hook en Reels y TikTok), Semana 2 (behind the scenes del video o sesion de fotos, press release a medios locales), Semana 3 (pre-save en DistroKid/TuneCore, colaboracion con un creador de contenido de tu genero), Semana 4 (lanzamiento + playlist pitching + direct message a fans principales). Cubrimos como medir el exito: Spotify monthly listeners, saves/streams ratio y engagement en el post de lanzamiento.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-3-m7", course_id: "course-3", position: 7,
    title: "Colaboraciones, features y splits",
    lesson_type: "reading", duration_minutes: 18,
    content: "Una colaboracion bien elegida puede duplicar tu audiencia overnight. Aprenderemos a identificar artistas con audiencias complementarias (no necesariamente del mismo genero), como proponer un feature de forma profesional y que incluir en un split sheet (documento que define quien posee que porcentaje de la cancion antes de grabar). Cubrimos la regla general de splits: si dos personas escriben igualmente la letra y la musica, 50/50; si uno hace la musica y otro la letra, se negocia segun contribucion. Siempre firma el split antes de lanzar.",
    video_url: "",
  },
  {
    id: "course-3-m8", course_id: "course-3", position: 8,
    title: "Monetizacion: sync, merch y cursos",
    lesson_type: "reading", duration_minutes: 25,
    content: "Los streams solos no dan de comer a un artista independiente. Aprenderemos tres fuentes de ingresos suplementarias: (1) Sync licensing: registrar tu catalogo en Musicbed, Artlist o Pond5 para que aparezca en videos de YouTube, publicidad y cine; (2) Merchandise: diseno de una primera linea con Printful (sin inventario), definir precio y margen; (3) Cursos y servicios: si tienes un skill ensenalo (produce, mezcla, produce beats, ensena canto). Hablaremos de diversificar ingreso para que no todo dependa de la plataforma de streaming.",
    video_url: "",
  },
  {
    id: "course-3-m9", course_id: "course-3", position: 9,
    title: "Plan de accion a 90 dias",
    lesson_type: "practice", duration_minutes: 35,
    content: "Cierre del curso con un plan personalizado de 90 dias. Definiras: un lanzamiento (single o EP), meta de seguidores por plataforma, numero de shows o colaboraciones, lista de email objetivo y una fuente de ingreso alternativa a activar. El plan se divide en sprints de 30 dias con metas SMART (especificas, medibles, alcanzables, relevantes y con tiempo definido). Presenta tu plan en la comunidad del curso y recibe feedback de otros artistas y del instructor.",
    video_url: "",
  },

  // ── COURSE 4: Ableton Live – Produccion Rapida para Shows ───────────────
  {
    id: "course-4-m1", course_id: "course-4", position: 1,
    title: "Ableton Live: interfaz, preferencias y proyecto",
    lesson_type: "video", duration_minutes: 18,
    content: "Tour completo de Ableton Live 11/12: Panel de pistas, Vista de Sesion, Vista de Arreglo, navegador de archivos y dispositivos. Configuramos las preferencias criticas para un show en vivo: driver de audio (ASIO en Windows, CoreAudio en Mac), buffer de 128 o 256 muestras para latencia minima, carpeta de samples en disco solido y activacion del modo CPU Throttling. Aprenderemos a crear plantillas de proyecto que carguen en menos de 10 segundos al encender el equipo.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-4-m2", course_id: "course-4", position: 2,
    title: "Session View vs Arrangement View: cuando usar cada una",
    lesson_type: "video", duration_minutes: 20,
    content: "La Vista de Sesion es el corazon de Ableton para actuaciones en vivo: clips que se pueden lanzar en cualquier orden, escenas que sincronizan multiples pistas y libertad total de improvisacion. La Vista de Arreglo es para produccion lineal. Aprenderemos a usar la Vista de Sesion como un instrumento: preparar escenas para cada seccion del show (intro, verso, coro, breakdown) y transicionar suavemente entre ellas sin silencio. Ejercicio: monta tres escenas de 8 barras y practica transicionarlas.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-4-m3", course_id: "course-4", position: 3,
    title: "Programacion de clips y escenas",
    lesson_type: "practice", duration_minutes: 32,
    content: "Practica guiada: crea 5 escenas completas para un show de 20 minutos. Cada escena contiene: pista de bateria (clips de audio o MIDI), bass, melodia principal, voz de referencia y efectos de ambiente. Aprenderemos a configurar el Follow Action (accion siguiente) de cada clip para que el show avance automaticamente o espere input del artista. Tambien cubrimos como usar el botpo de Record de la Vista de Sesion para capturar improvisaciones en tiempo real.",
    video_url: "",
  },
  {
    id: "course-4-m4", course_id: "course-4", position: 4,
    title: "Rack de efectos para voz en vivo",
    lesson_type: "video", duration_minutes: 26,
    content: "Configuramos una cadena de efectos profesional para voz en vivo dentro de Ableton: compresion (EQ Eight → Compressor con ratio 4:1 → Limiter para seguridad), reverb de sala con Hybrid Reverb, delay sincronizado al BPM del proyecto y un rack de efectos especiales (pitch shift, flanger, lofi) mapeados a botones del controlador para activar en momentos clave del show. Aprenderemos a enrutar el audio del microfono externo a Ableton con latencia compensada.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-4-m5", course_id: "course-4", position: 5,
    title: "Mapeo MIDI con controlador",
    lesson_type: "practice", duration_minutes: 38,
    content: "Ejercicio: conecta tu controlador MIDI (Launchpad, APC40, Push o cualquier teclado con MIDI) y mapea: botones de lanzamiento de clips a la cuadricula de la Vista de Sesion, knobs a los parametros de efecto mas usados (reverb send, filter cutoff, delay feedback), faders a volumenes de pistas criticas. Aprenderemos a usar el modo MIDI Map de Ableton (Cmd+M) y como guardar el mapeo en el proyecto. Un buen mapeo convierte el laptop en un instrumento, no en una computadora.",
    video_url: "",
  },
  {
    id: "course-4-m6", course_id: "course-4", position: 6,
    title: "Backing tracks y stems sincronizados",
    lesson_type: "video", duration_minutes: 28,
    content: "Los backing tracks son la columna vertebral de un show electronico o de un artista que actua solo. Aprenderemos a preparar stems de 24 bit / 48 kHz a partir de la mezcla del proyecto, como organizarlos en pistas de color codificado dentro de Ableton y a usar una pista Click Track (metronomo) enrutada solo al monitor del musico (in-ear) sin que llegue al PA. Cubrimos la diferencia entre shows con click (sincronizacion estricta con iluminacion o video) y shows sin click (mayor libertad expresiva).",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-4-m7", course_id: "course-4", position: 7,
    title: "Loops en vivo y grabacion sobre la marcha",
    lesson_type: "practice", duration_minutes: 30,
    content: "Una de las tecnicas mas poderosas de Ableton en vivo: el loopeo en tiempo real. Practica: configura una pista de audio vacı con overdub activado, conecta un instrumento o microfono y graba un loop de 4 barras. Luego apila capas encima (voz de armonia, percusion adicional) y construye una cancion desde cero en el escenario. Cubrimos como usar el boton de Clear para eliminar capas sin interrumpir el loop, y como preparar un escape de emergencia si algo sale mal.",
    video_url: "",
  },
  {
    id: "course-4-m8", course_id: "course-4", position: 8,
    title: "Checklist de ensayo tecnico y preparacion del show",
    lesson_type: "reading", duration_minutes: 18,
    content: "Antes de cada show hay 15 puntos tecnicos que debes verificar: laptop cargada al 100% + adaptador de corriente, proyecto abierto y en modo Performance, audio interface probada con el sistema de PA del venue, latencia medida y aceptable (< 10 ms round-trip), backup del proyecto en disco externo o cloud, cables de repuesto (XLR, USB, lightning/USB-C), controlador con bateria cargada, y plan B si falla el laptop. Incluye plantilla descargable de checklist en formato PDF.",
    video_url: "",
  },
  {
    id: "course-4-m9", course_id: "course-4", position: 9,
    title: "Configuracion de exportacion y stems para gira",
    lesson_type: "reading", duration_minutes: 16,
    content: "Cuando el show requiere tracks pre-grabados en formato fijo (como en un festival con tiempo limitado), necesitas exportar correctamente. Aprenderemos a exportar stems en formato consolidado desde la Vista de Arreglo, a nombrar archivos con timecode para sincronizacion con el tecnico de FOH, y a empaquetar el proyecto completo (proyecto + samples + exports) en una carpeta organizada por fecha y venue. Cubrimos los formatos mas comunes que aceptan los venues: WAV 24bit/48kHz en tracks numerados.",
    video_url: "",
  },
  {
    id: "course-4-m10", course_id: "course-4", position: 10,
    title: "Proyecto final: monta tu set completo de 20 minutos",
    lesson_type: "practice", duration_minutes: 55,
    content: "Entrega final del curso: monta un set de Ableton Live de 20 minutos con al menos 6 escenas diferentes, procesamiento de voz en vivo, un momento de loopeo espontaneo y mapeo MIDI completo. Graba el set en video usando la grabacion de pantalla de Ableton + audio del master. La rubrica evalua: organizacion del proyecto, calidad del procesamiento de audio, fluidez de las transiciones entre escenas, uso creativo del mapeo MIDI y capacidad de recuperacion ante un error (simularemos un fallo en la escena 4).",
    video_url: "",
  },

  // ── COURSE 5: Mix y Master para Streaming ───────────────────────────────
  {
    id: "course-5-m1", course_id: "course-5", position: 1,
    title: "Preparacion de sesion y gain staging",
    lesson_type: "video", duration_minutes: 25,
    content: "El gain staging es el fundamento de una buena mezcla: garantizar que cada senial pase por la cadena de plugins con el nivel correcto para evitar distorsion digital y saturacion indeseada. Aprenderemos a ajustar la ganancia de entrada de cada pista entre -18 y -12 dBFS RMS, a usar el VU meter para monitorear en analogico y a establecer el headroom del bus master en -6 dBFS antes del limitador. Ejercicio: analiza una sesion desordenada e identifica las pistas que estan 'hot' (sobreganadas).",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-5-m2", course_id: "course-5", position: 2,
    title: "Ecualizacion substractiva y aditiva",
    lesson_type: "video", duration_minutes: 32,
    content: "El EQ es la herramienta mas poderosa y peligrosa de la mezcla. Aprenderemos EQ substractivo primero: identificar y cortar las frecuencias problematicas de cada instrumento (barro entre 200-400 Hz, boxiness en 500 Hz, harsh en 2-5 kHz). Luego EQ aditivo: realzar el cuerpo del kick a 80 Hz con un bell suave, la presencia de la guitarra a 3 kHz y el aire de la voz a 12-16 kHz. Cubrimos el principio de complementariedad: si la voz ocupa 1-3 kHz, el snare no debe competir ahi.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-5-m3", course_id: "course-5", position: 3,
    title: "Compresion: parametros y flujo de senal",
    lesson_type: "video", duration_minutes: 30,
    content: "La compresion controla la dinamica reduciendo el rango entre las partes mas silenciosas y mas fuertes de una senal. Aprenderemos cada parametro: Threshold (donde empieza la compresion), Ratio (cuanto comprime), Attack (cuanto tarda en reaccionar), Release (cuanto tarda en soltar), Knee (transicion suave o dura) y Makeup Gain (compensar la ganancia perdida). Casos de uso especificos: compresion de voz (ratio 3:1, attack 10 ms, release 80 ms), bateria paralela (NY compression) y bus glue (2:1, attack lento, release automatico).",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-5-m4", course_id: "course-5", position: 4,
    title: "Saturacion armonica y caracter",
    lesson_type: "reading", duration_minutes: 20,
    content: "La saturacion agrega armonicos pares (2do, 4to) que el oido percibe como calor y fullness, o armonicos impares (3ro, 5to) que dan agresividad y brillo. Los tipos de saturacion: tape (suave, redondea transientes), tubo (calido, sutil), transistor (agresivo, clickeo) y transformer (cuerpo en bajas frecuencias). Aprenderemos como aplicar saturacion suave al bus de bateria para cohesion, al bass para que sea audible en reproductores pequeños y al bus master para caracter analogico. La regla: si puedes escuchar la saturacion, es demasiada.",
    video_url: "",
  },
  {
    id: "course-5-m5", course_id: "course-5", position: 5,
    title: "Campo estereo y analisis Mid/Side",
    lesson_type: "video", duration_minutes: 26,
    content: "Una mezcla profesional usa el campo estereo estrategicamente. Aprenderemos los tres niveles de profundidad: centro (kick, bajo, voz principal, bombo), campo medio (guitarras, synths de cuerpo, coros de respaldo) y extremos estereo (ambientes, efectos de textura, armonias lejanas). Usaremos el procesamiento M/S: EQ diferente para la senal Mid (centro) vs Side (lados), ancho estereo en el mastering sin crear problemas de compatibilidad mono. Herramienta: SPAN o Youlean para analizar el campo estereo en tiempo real.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-5-m6", course_id: "course-5", position: 6,
    title: "Reverb, delay y efectos de tiempo",
    lesson_type: "practice", duration_minutes: 35,
    content: "Practica guiada con tres configuraciones de reverb y delay. Reverb de sala corta (pre-delay 20 ms, decay 0.8 s) para bateria y snare, reverb de placa (pre-delay 35 ms, decay 1.8 s) para voz y cuerda, y reverb de iglesia o hall para pads de fondo. Delay: quarter note sincronizado al BPM para crear movimiento en la voz, dotted eighth note para el efecto de eco que llena el espacio sin saturar. Ejercicio: aplica send/return (no insert) para todos los efectos de tiempo y compara el uso de CPU.",
    video_url: "",
  },
  {
    id: "course-5-m7", course_id: "course-5", position: 7,
    title: "Automatizacion de volumen y filtros",
    lesson_type: "practice", duration_minutes: 32,
    content: "La automatizacion da vida a la mezcla. Ejercicio: automatiza el volumen de la voz en los momentos donde la letra cambia de intensidad emocional (+2 dB en el coro, -1 dB en el verso). Luego automatiza un filtro de paso-alto en la bateria durante el verso para que el coro 'explote' al abrir el filtro. Finalmente, automatiza el reverb send de la voz para que sea seco en versos y espacial en coros. La diferencia entre una mezcla estatica y una dinamica esta en la automatizacion.",
    video_url: "",
  },
  {
    id: "course-5-m8", course_id: "course-5", position: 8,
    title: "Estandares de loudness: LUFS, True Peak y plataformas",
    lesson_type: "reading", duration_minutes: 20,
    content: "Spotify normaliza a -14 LUFS integrado, Apple Music a -16 LUFS, YouTube a -14 LUFS. Si tu master supera estos niveles, la plataforma lo baja automaticamente; si queda muy bajo, sonara debil comparado con otros artistas. Aprenderemos a medir LUFS integrado con Youlean Loudness Meter, a establecer el True Peak maximo en -1 dBTP para evitar inter-sample distortion al convertir a MP3, y a exportar en los formatos que cada plataforma recomienda (WAV 24 bit para DistroKid, FLAC para Bandcamp).",
    video_url: "",
  },
  {
    id: "course-5-m9", course_id: "course-5", position: 9,
    title: "Cadena de mastering: limitador, clipper y analisis",
    lesson_type: "video", duration_minutes: 38,
    content: "La cadena de mastering tipica en 2024: EQ de mastering (pequeños ajustes, no el drama del mix), compresor multiband para cohesion de frecuencias, saturador de bus para caracter, limitador True Peak (FabFilter Pro-L 2, Ozone Maximizer o LIMITLESS). El debate clipper vs limitador: el clipper analogico suaviza los transientes antes del limitador permitiendo mas loudness sin bomba. Medimos el resultado con Span Free: el espectro debe tener una curva suave descendente de bajas a altas frecuencias sin picos agresivos.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-5-m10", course_id: "course-5", position: 10,
    title: "Formatos de entrega: WAV, FLAC y distribuidores",
    lesson_type: "reading", duration_minutes: 16,
    content: "Una vez dominado el master, hay que entregarlo correctamente. Aprenderemos los requerimientos de cada distribuidor: DistroKid y TuneCore aceptan WAV y FLAC, 16 o 24 bit, 44.1 kHz; Bandcamp permite hasta 48 kHz; la master para vinyl requiere RIAA curve especifica. Cubrimos como nombrar el archivo master final (Artista_Titulo_Master_24b44k_vFINAL.wav) y como crear un DDPi para entrega a fabricantes de CD. El archivo de mezcla sin limitar (mix minus limiter) debe archivarse siempre para remasterizaciones futuras.",
    video_url: "",
  },
  {
    id: "course-5-m11", course_id: "course-5", position: 11,
    title: "Proyecto final: mezcla y master de pista completa",
    lesson_type: "practice", duration_minutes: 65,
    content: "Descarga la sesion multi-pista del curso (8 pistas: kick, snare, bajo, guitarra, synth pad, voz principal, coro de respaldo, ambiente) y entrega una mezcla + master completo. Requisitos: LUFS integrado entre -13 y -15, True Peak maximo -1 dBTP, export WAV 24 bit / 44.1 kHz. La rubrica evalua balance de frecuencias, control de dinamica, uso del campo estereo, loudness final y cohesion del master. Sube tu archivo a la comunidad del curso para que el instructor y otros estudiantes den feedback comparativo.",
    video_url: "",
  },

  // ── COURSE 6: Guitarra Ritmica Moderna ──────────────────────────────────
  {
    id: "course-6-m1", course_id: "course-6", position: 1,
    title: "Postura, anatomia del instrumento y afinacion",
    lesson_type: "video", duration_minutes: 15,
    content: "Comenzamos con los fundamentos que determinan si vas a progresar rapido o luchar por anos. Postura sentada correcta (guitarra apoyada en el muslo izquierdo, codo derecho sobre el cuerpo, muneca izquierda recta), postura de pie con correa a la altura del ombligo, presion correcta de la pua (relajada, no agarrada). Anatomia: cabezal, clavijas, traste, cejuela, mango, cuerpo, pastillas y puente. Afinacion: usar afinador cromatico (clip-on o app) en lugar de oido hasta desarrollar oido absoluto relativo.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-6-m2", course_id: "course-6", position: 2,
    title: "Acordes abiertos y el sistema CAGED",
    lesson_type: "reading", duration_minutes: 26,
    content: "Los acordes abiertos (E, Em, A, Am, D, Dm, G, C) son la base de la guitarra acustica y electrica. Aprenderemos la digitacion correcta de cada uno con diagramas de mano izquierda, el cambio fluido entre pares de acordes (G-Cadd9, Am-F, D-A) y como evitar el buzz (ruido por presion insuficiente o posicion incorrecta del dedo). El sistema CAGED (C-A-G-E-D) explica como estos 5 formas de acorde se repiten a lo largo del mastil: dominar CAGED es entender la guitarra completa.",
    video_url: "",
  },
  {
    id: "course-6-m3", course_id: "course-6", position: 3,
    title: "Tecnicas de rasgueo: pua y fingerpicking",
    lesson_type: "video", duration_minutes: 24,
    content: "El rasgueo genera el ritmo y el caracter emocional de la guitarra. Aprenderemos tres tipos de movimiento de pua: rasgueo de muneca (el mas comun, flexible), rasgueo de codo (mas rigido, para metal) y rasgueo de pulgar (folk, blues). Patrones de rasgueo basicos: abajo-abajo-arriba-arriba-abajo-arriba (6/8), abajo-arriba-abajo-arriba (4/4 simple) y el patron flamenco de abajo-arriba-abajo con corte con la palma. Fingerpicking basico: pulgar en cuerdas 4-5-6, indice en 3a, medio en 2a, anular en 1a.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-6-m4", course_id: "course-6", position: 4,
    title: "Palm muting y tecnicas de apagado",
    lesson_type: "practice", duration_minutes: 28,
    content: "El palm muting (apagado con la palma) es la tecnica que mas caracter y groove da a la guitarra ritmica moderna. Practica: coloca el borde de la palma derecha justo sobre las cuerdas en el puente y rasguea; el sonido debe ser percusivo y oscuro, no completamente apagado. Luego alternamos palm mute y cuerdas abiertas para crear contrastes ritmicos. Ejercicio: aprende el riff de palm mute de 4 barras del curso y tocalo con metonomo a 80 BPM, luego a 100 BPM y finalmente a 120 BPM.",
    video_url: "",
  },
  {
    id: "course-6-m5", course_id: "course-6", position: 5,
    title: "Barre chords: primera y sexta posicion",
    lesson_type: "practice", duration_minutes: 32,
    content: "La cejilla (barre) es el obstaculo que hace que muchos principiantes abandonen la guitarra. La clave: el dedo indice no aprieta uniformemente, el lado del dedo (no la yema) es mas duro y eficiente. Aprenderemos barre en la sexta cuerda (forma E: F, G, A, B en el mastil) y en la quinta cuerda (forma A: Bb, C, D en el mastil). Ejercicio graduado: primero barre estatico (solo el dedo, sin sonar nota), luego con dos dedos, luego acorde completo. Practica el cambio entre barre F y acorde abierto G hasta que sea fluido.",
    video_url: "",
  },
  {
    id: "course-6-m6", course_id: "course-6", position: 6,
    title: "Sincopa, groove y anticipaciones ritmicas",
    lesson_type: "video", duration_minutes: 22,
    content: "El groove no esta solo en las notas que tocas sino en las que dejas sin tocar. Aprenderemos a identificar las subdivisiones del compas en corcheas (8 por compas 4/4) y semicorcheas (16 por compas), donde colocar los golpes acentuados para crear tension ritmica y como anticipar el tiempo 1 con una nota en el tiempo 4+ (corchea 'e' del 4). Cubrimos los patrones ritmicos especificos de reggaeton (dembow: acento en contravase), salsa (clave 3-2 y 2-3) y pop urbano (trap hi-hat con swing).",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-6-m7", course_id: "course-6", position: 7,
    title: "Patrones de guitarra funk y soul",
    lesson_type: "practice", duration_minutes: 36,
    content: "El funk exige precision ritmica milimetrica. Aprenderemos el patron de 16 notas de James Brown (cortas y staccato, en el '1' exacto), el wah-wah en el compas de 4 y los acordes de novena y decimotercera que definen el vocabulario funky. Practica: aprende la progresion Im7-IV7 a 96 BPM con patron de semicorcheas y apagados alternos. Funcion de cada cuerda: las cuerdas bajas anclan el groove, las medias dan cuerpo y las agudas dan el 'chicle' funky. Ejercicio de grabacion: toca sobre el loop del curso y compara.",
    video_url: "",
  },
  {
    id: "course-6-m8", course_id: "course-6", position: 8,
    title: "Ritmo en generos urbanos: reggaeton, trap y R&B",
    lesson_type: "video", duration_minutes: 26,
    content: "La guitarra ritmica en musica urbana contemporanea tiene un rol especifico y diferente al rock. En reggaeton: acordes cortos (staccato) en los contrabases del dembow con wah o chorus suave. En trap: arpegios de acordes extensos con delay sincronizado al BPM para textura, no ritmo directo. En R&B neosoul: acordes extendidos (maj9, 11, 13) con voicings altos en el mastil, strumming suave y mucho espacio. Aprenderemos a escuchar las referencias del genero e identificar exactamente que hace la guitarra en el mix.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-6-m9", course_id: "course-6", position: 9,
    title: "Performance final con banda de acompañamiento",
    lesson_type: "practice", duration_minutes: 42,
    content: "Entrega final: toca tres secciones de 32 barras cada una sobre las pistas de acompañamiento del curso (bateria + bajo): (1) pop/rock con acordes abiertos y rasgueo 4/4, (2) funk con patron de 16 notas y palm muting y (3) urban/reggaeton con accordes staccato sobre dembow. Graba en video con el audio de la pista mezclado. La rubrica evalua: afinacion (usa afinador antes de grabar), tiempo (usa metonomo), limpieza de acordes, dinamica y adecuacion al genero. Esta grabacion puede ser tu primera demo de guitarrista para enviar a bandas.",
    video_url: "",
  },

  // ── COURSE 7: Demo – Intro RitmoHub Academy ──────────────────────────────
  {
    id: "course-7-m1", course_id: "course-7", position: 1,
    title: "Bienvenida al entorno de prueba",
    lesson_type: "video", duration_minutes: 5,
    content: "Este es un curso de demostracion de USD 1 para validar el flujo completo de checkout, pago y acceso al contenido. Si llegaste aqui, el proceso funciono correctamente: compraste, se registro el pago en la base de datos y el sistema te dio acceso. Explora las lecciones siguientes para verificar que el reproductor de video, el rastreador de progreso y la navegacion entre modulos funcionan como se espera.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-7-m2", course_id: "course-7", position: 2,
    title: "Verificacion del sistema de pagos",
    lesson_type: "reading", duration_minutes: 5,
    content: "Si ves este contenido, el webhook de Stripe proceso correctamente el evento payment_intent.succeeded y el estado del pago cambio a 'paid' en la tabla course_purchases. Puntos de verificacion tecnicos: (1) El course_id coincide con este curso, (2) El user_id corresponde a tu cuenta, (3) El amount_usd registro USD 1.00, (4) El provider es 'stripe'. Estos datos pueden revisarse en el panel de Stripe > Payments y en la base de datos PostgreSQL del VPS.",
    video_url: "",
  },
  {
    id: "course-7-m3", course_id: "course-7", position: 3,
    title: "Test completado",
    lesson_type: "practice", duration_minutes: 5,
    content: "Marca esta leccion como completada para verificar que el sistema de seguimiento de progreso funciona. Si el porcentaje de progreso en la barra lateral llego al 100%, el estado de completado se registra correctamente en el cliente. En una version futura del curso, este estado se sincronizaria con la base de datos para persistir entre sesiones. Por ahora, el progreso es en memoria del navegador y se reinicia al recargar la pagina.",
    video_url: "",
  },

  // ── COURSE 8: Demo – Plantillas de Show ─────────────────────────────────
  {
    id: "course-8-m1", course_id: "course-8", position: 1,
    title: "Que son las plantillas de show",
    lesson_type: "video", duration_minutes: 8,
    content: "Las plantillas de show (show templates) son configuraciones pre-armadas de Ableton Live, FL Studio o cualquier DAW que permiten al artista cargar un proyecto listo para actuar en menos de 60 segundos. Una buena plantilla incluye: pistas de color codificado por instrumento, efectos configurados y mapeados, template de routing de audio y MIDI, y un set de clips de demo para ensayo inmediato. Este curso demo muestra el concepto con tres plantillas de muestra que puedes descargar y adaptar.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-8-m2", course_id: "course-8", position: 2,
    title: "Estructura de una plantilla profesional",
    lesson_type: "reading", duration_minutes: 10,
    content: "Una plantilla de show profesional tiene cinco zonas: (1) Zona de monitores (click track, cue mix para in-ears), (2) Zona de bateria y ritmo (stems de bateria, loops de percussion), (3) Zona de armonia y melodia (synths, samples, pads), (4) Zona de voz y procesamiento (canal de microfono con todos los efectos ya configurados) y (5) Zona de efectos especiales (hits de DJ, risers, drops). Cada zona tiene su propio bus de mezcla con color especifico para navegacion rapida en oscuridad.",
    video_url: "",
  },
  {
    id: "course-8-m3", course_id: "course-8", position: 3,
    title: "Demo completado: pago y contenido verificados",
    lesson_type: "practice", duration_minutes: 5,
    content: "Has completado el curso demo de Plantillas de Show. Si llegaste hasta aqui, el sistema de pagos, acceso al contenido y reproduccion de lecciones funciona correctamente para este curso. Los proximos pasos reales: descarga las tres plantillas de show del Google Drive enlazado en la descripcion del curso, adaptalas a tu DAW y empieza a usarlas en tu proximo ensayo. Cualquier pregunta tecnica, publica en el foro de la comunidad de RitmoHub.",
    video_url: "",
  },

  // ── COURSE 9: Demo – Warmups Vocales Express ────────────────────────────
  {
    id: "course-9-m1", course_id: "course-9", position: 1,
    title: "Por que calentar la voz es innegociable",
    lesson_type: "video", duration_minutes: 8,
    content: "Las cuerdas vocales son musculos y tejido mucoso delicado. Intentar cantar sin calentar es equivalente a correr un sprint sin estirar: el riesgo de lesion es alto y la calidad del rendimiento es notablemente inferior. En esta leccion introductoria aprenderemos la fisiologia basica de la voz, por que las cuerdas vocales necesitan calor y flujo sanguineo antes de esforzarse y cuales son las lesiones mas comunes del cantante que no calienta (nodulos, quistes, edema de Reinke). Con solo 10-15 minutos de calentamiento correcto se previenen estas lesiones.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-9-m2", course_id: "course-9", position: 2,
    title: "Rutina express de 10 minutos",
    lesson_type: "practice", duration_minutes: 12,
    content: "Rutina guiada de calentamiento vocal en 10 minutos: (1) Masaje facial: maxilar, mejillas y frente (1 min), (2) Bostezos exagerados para abrir la garganta (30 seg), (3) Humming en escala de Do mayor ascendente y descendente (2 min), (4) Lip trills (vibrar los labios) subiendo y bajando por cuartas (2 min), (5) Staccato en vocales 'MA-ME-MI-MO-MU' subiendo semitono por semitono (2 min), (6) Vocalizacion de registro de pecho a registro de cabeza en glissando suave (2 min), (7) Dos frases de tu cancion a la mitad de la intensidad.",
    video_url: "",
  },
  {
    id: "course-9-m3", course_id: "course-9", position: 3,
    title: "Test completado y proximos pasos",
    lesson_type: "reading", duration_minutes: 5,
    content: "Has completado el mini-curso de Warmups Vocales Express. Este curso demo confirma que el sistema de acceso por pago funciona correctamente. Para continuar tu desarrollo vocal, te recomendamos el curso completo 'Voz en Vivo y Presencia Escenica' disponible en la Academia RitmoHub, que incluye 9 lecciones completas de tecnica vocal, presencia escenica y preparacion mental para shows. Usa el codigo de descuento WARMUP15 en el checkout para 15% de descuento.",
    video_url: "",
  },

  // ── COURSE 10: Booking y Negocio Musical para Bandas ────────────────────
  {
    id: "course-10-m1", course_id: "course-10", position: 1,
    title: "Como funciona la industria musical hoy",
    lesson_type: "video", duration_minutes: 22,
    content: "La industria musical en 2024 es un ecosistema radicalmente diferente al de hace 15 anos. Los tres modelos de negocio dominantes: streaming (ingresos por reproduccion, distribuidos por DSPs), shows en vivo (la fuente de ingreso mas importante para artistas independientes) y licensing (sync para publicidad, cine y videojuegos). Aprenderemos como se relacionan estos tres mundos, quienes son los actores clave (manager, booking agent, promoter, A&R, publisher) y como funciona la cadena de dinero desde un boleto vendido hasta el bolsillo del artista.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-10-m2", course_id: "course-10", position: 2,
    title: "Tu EPK: Electronic Press Kit profesional",
    lesson_type: "reading", duration_minutes: 25,
    content: "El EPK es tu tarjeta de presentacion digital con los medios, promotores y booking agents. Un EPK profesional incluye: foto de prensa en alta resolucion (1200x1200 px minimo, fondo neutro o de marca), bio de 100 palabras y 300 palabras, link al video musical mas visto, top 3 canciones en Spotify/Apple Music, lista de shows pasados con capacidad del venue, resenias de medios o citas de prensa, rider tecnico en PDF y datos de contacto actualizados. Herramientas gratuitas para crear tu EPK: Wix, Canva o Google Sites.",
    video_url: "",
  },
  {
    id: "course-10-m3", course_id: "course-10", position: 3,
    title: "Estrategia de contacto con venues",
    lesson_type: "practice", duration_minutes: 30,
    content: "Ejercicio: construye una lista de 20 venues locales y regionales con capacidad entre 100 y 800 personas. Para cada venue anota: nombre del contacto de booking, email de booking (nunca el general), capacidad, genero de musica que programan y fecha de ultimo show similar al tuyo. Luego escribe un email de pitch de 150 palabras: asunto especifico (no 'Propuesta de show'), intro de una oracion sobre quien eres, por que encajas en su venue, propuesta especifica (fecha tentativa, colaboracion de promocion) y link al EPK. Tasa de respuesta esperada: 10-15% si el pitch es relevante.",
    video_url: "",
  },
  {
    id: "course-10-m4", course_id: "course-10", position: 4,
    title: "Como leer y negociar un contrato de shows",
    lesson_type: "reading", duration_minutes: 24,
    content: "Nunca actues sin contrato firmado. Los elementos minimos de un contrato de shows: fecha, venue y horario exacto (incluyendo soundcheck y apertura de puertas), cachet o deal financiero (garantia fija vs porcentaje de taquilla vs split deal), terminos de cancelacion (fuerza mayor, anticipacion minima, penalidades), responsabilidades de produccion (quien paga el PA, iluminacion, seguridad) y clausula de exclusividad territorial (radio de km en que no puedes actuar X dias antes y despues). Si algo no esta en el contrato, no existe.",
    video_url: "",
  },
  {
    id: "course-10-m5", course_id: "course-10", position: 5,
    title: "El rider tecnico y hospitality rider",
    lesson_type: "reading", duration_minutes: 20,
    content: "El rider es el documento que le dice al promotor exactamente que necesitas para que el show funcione. El rider tecnico incluye: lista de instrumentos y backline necesario, numero de monitores y mezcla de cada uno, numero de entradas de microfono en el escenario (stage plot), requerimientos de iluminacion y tipo de sistema de PA minimo. El hospitality rider (a veces llamado el catering rider) incluye: necesidades de camerino (agua, comida, temperatura), numero de acreditaciones de acompañantes y logistica de carga/descarga. Un rider claro previene el 80% de los conflictos el dia del show.",
    video_url: "",
  },
  {
    id: "course-10-m6", course_id: "course-10", position: 6,
    title: "Negociacion: cachets, garantias y deals de puerta",
    lesson_type: "video", duration_minutes: 26,
    content: "Aprenderemos los tres modelos de compensacion mas comunes: (1) Garantia fija: el venue paga X dolares independientemente de cuantos asistan, ideal cuando tienes audiencia establecida; (2) Door deal: un porcentaje de la taquilla (tipicamente 70% artista / 30% venue) con o sin garantia minima; (3) Versus deal: el mayor entre la garantia y el porcentaje de taquilla, que protege al artista ante baja asistencia. Tacticas de negociacion: ancla alta (pide mas de lo que esperas), valida con datos (streams, shows pasados) y nunca aceptes 'exposicion' como pago.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "course-10-m7", course_id: "course-10", position: 7,
    title: "Promocion del show: medios, redes y ticketing",
    lesson_type: "video", duration_minutes: 28,
    content: "Un show que no se promueve bien no se llena. Plan de promocion de 3 semanas: Semana 3 antes: anuncio en redes con flyer profesional, evento de Facebook, pre-venta en plataforma (Eventbrite, TicketLeap o Tickeri para Latinoamerica). Semana 2: colaboracion con un medio local (blog, podcast, radio), email a tu lista, stories diarias de cuenta regresiva. Semana 1: reels de ensayo, testimonios de fans de shows anteriores, campana de publicidad pagada (Facebook/Instagram Ads segmentado por ciudad y genero musical) con presupuesto de USD 20-50.",
    video_url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  },
  {
    id: "course-10-m8", course_id: "course-10", position: 8,
    title: "Contabilidad basica para musicos independientes",
    lesson_type: "reading", duration_minutes: 22,
    content: "El dinero que entra de un show no es todo ganancia. Aprenderemos a calcular el break-even de un show: suma todos los costos (transporte, alojamiento, alimentacion, produccion, marketing) y compara con el ingreso esperado. Usaremos una hoja de calculo simple con columnas: ingreso bruto, gastos fijos, gastos variables, ingreso neto y margen porcentual. Temas fiscales basicos para musicos: en Republica Dominicana, los ingresos de espectaculos pueden estar sujetos a ITBIS y se recomienda factura fiscal para shows con empresas. Siempre separa la cuenta bancaria personal de la bancaria del proyecto musical.",
    video_url: "",
  },
  {
    id: "course-10-m9", course_id: "course-10", position: 9,
    title: "Plan de gira de 3 ciudades",
    lesson_type: "practice", duration_minutes: 42,
    content: "Proyecto final: planifica una mini-gira de 3 ciudades (por ejemplo Santo Domingo, Santiago y La Vega en Republica Dominicana). Para cada ciudad: (1) Lista de 5 venues investigados con contacto de booking, (2) Presupuesto detallado (transporte, alojamiento, alimentacion, produccion, marketing local), (3) Timeline de gestion (6 semanas antes: confirmar fechas, 4 semanas: contratos, 3 semanas: inicio de promocion, 1 semana: logistica final), (4) Plan de contingencia para cancelacion de un venue. Presenta el plan en la comunidad del curso en formato de Google Slides de maximo 10 diapositivas.",
    video_url: "",
  },
];

const defaultForumSeed: Array<{
  id: string;
  author_name: string;
  title: string;
  body: string;
  category: string;
  upvotes: number;
  comments: Array<{ id: string; author_name: string; text: string }>;
}> = [
    {
      id: "f-1",
      author_name: "Nina Rosario",
      title: "Que plugin recomiendan para voces indie limpias?",
      body: "Busco un chain rapido para voz principal en vivo, algo estable y con poco CPU.",
      category: "Produccion",
      upvotes: 24,
      comments: [
        {
          id: "fc-1",
          author_name: "Santi Diaz",
          text: "Prueba compresion suave + de-esser y un slapback corto.",
        },
        {
          id: "fc-2",
          author_name: "Ariel Gomez",
          text: "Con presets de voz pop te puede funcionar rapido para show.",
        },
      ],
    },
    {
      id: "f-2",
      author_name: "Laura Perez",
      title: "Venue nuevo en Santiago para 600 personas",
      body: "Abrieron un venue con buena iluminacion y buena politica para artistas locales.",
      category: "Conciertos",
      upvotes: 31,
      comments: [
        {
          id: "fc-3",
          author_name: "Diego Mora",
          text: "Ya lo vi, LED frontal decente para visuales.",
        },
      ],
    },
  ];

type ThreadSeed = {
  contactName: string;
  contactRole: string;
  contactAvatar: string;
  messages: Array<{ senderType: "me" | "them"; text: string; isUnread: boolean }>;
};

const defaultThreadSeeds: ThreadSeed[] = [
  // Intentionally empty: chats should start without seeded default contacts.
];

const defaultConcertSeeds: Array<{
  title: string;
  date: string;
  venue: string;
  city: string;
  flyerUrl: string;
  ticketUrl: string;
  capacity: string;
  status: ConcertRecord["status"];
}> = [
    {
      title: "Ritmo Nocturno Live",
      date: "2026-04-18T20:30",
      venue: "Sala Aurora",
      city: "Santo Domingo",
      flyerUrl: "/flyers/ritmo-nocturno.svg",
      ticketUrl: "https://tickets.ritmohub.app/ritmo-nocturno-live",
      capacity: "1250",
      status: "confirmed",
    },
    {
      title: "Acustico en Plaza Norte",
      date: "2026-04-26T18:00",
      venue: "Foro Plaza Norte",
      city: "Santiago",
      flyerUrl: "/flyers/sunset-acoustic.svg",
      ticketUrl: "https://tickets.ritmohub.app/acustico-plaza-norte",
      capacity: "900",
      status: "negotiation",
    },
    {
      title: "Festival Ritmo Urbano",
      date: "2026-05-04T21:00",
      venue: "Anfiteatro Central",
      city: "La Vega",
      flyerUrl: "/flyers/urban-echo.svg",
      ticketUrl: "https://tickets.ritmohub.app/festival-ritmo-urbano",
      capacity: "3000",
      status: "lead",
    },
    {
      title: "Indie Pulse Sessions",
      date: "2026-05-11T20:00",
      venue: "Terraza 34",
      city: "Santo Domingo",
      flyerUrl: "/flyers/indie-pulse.svg",
      ticketUrl: "https://tickets.ritmohub.app/indie-pulse-sessions",
      capacity: "800",
      status: "lead",
    },
    {
      title: "Beatline Tour Kickoff",
      date: "2026-05-19T19:30",
      venue: "Parque de la Musica",
      city: "Santiago",
      flyerUrl: "/flyers/beatline-kickoff.svg",
      ticketUrl: "https://tickets.ritmohub.app/beatline-tour-kickoff",
      capacity: "1600",
      status: "confirmed",
    },
    {
      title: "Neo Folk Skyline",
      date: "2026-05-27T20:45",
      venue: "Plaza Cielo",
      city: "Punta Cana",
      flyerUrl: "/flyers/neo-folk-skyline.svg",
      ticketUrl: "https://tickets.ritmohub.app/neo-folk-skyline",
      capacity: "1000",
      status: "post_show",
    },
  ];

async function ensureDefaultJobs() {
  const now = new Date().toISOString();
  await withTransaction(async (client) => {
    await execute(
      `DELETE FROM jobs WHERE title = ANY($1::text[])`,
      [removedJobsSeedTitles],
      client,
    );

    for (const job of defaultJobsSeed) {
      await execute(
        `
          INSERT INTO jobs (id, title, type, city, image_url, pay, summary, description, requires_cv, requester_name, requester_role, requirements, deadline, poster_user_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            requires_cv = EXCLUDED.requires_cv,
            requester_name = EXCLUDED.requester_name,
            requester_role = EXCLUDED.requester_role,
            requirements = EXCLUDED.requirements,
            deadline = EXCLUDED.deadline,
            poster_user_id = EXCLUDED.poster_user_id
        `,
        [
          job.id, job.title, job.type, job.city, job.image_url, job.pay, job.summary,
          job.description ?? "", job.requires_cv ?? false,
          job.requester_name ?? "", job.requester_role ?? "",
          job.requirements ?? "[]", job.deadline ?? "",
          job.poster_user_id ?? null, now,
        ],
        client,
      );
    }
  });
}

async function ensureDefaultInstructorUsers() {
  const now = new Date().toISOString();
  await withTransaction(async (client) => {
    for (const instructor of defaultInstructorUsersSeed) {
      await execute(
        `
          INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `,
        [
          instructor.id,
          instructor.name,
          instructor.email,
          defaultInstructorPasswordHash,
          now,
          now,
        ],
        client,
      );
    }
  });
}

async function ensureDeletedDefaultCoursesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deleted_default_courses (
      course_id TEXT PRIMARY KEY,
      deleted_at TEXT NOT NULL
    )
  `);
}

async function ensureDefaultCourses() {
  await ensureDefaultInstructorUsers();
  await ensureDeletedDefaultCoursesTable();
  const supportsInstructorUser = await ensureCoursesInstructorColumn();
  const existingRows = await queryRows<{ id: string }>("SELECT id FROM courses");
  const existingIds = new Set(existingRows.map((row) => row.id));
  const deletedDefaultRows = await queryRows<{ course_id: string }>(
    "SELECT course_id FROM deleted_default_courses",
  );
  const deletedDefaultCourseIds = new Set(deletedDefaultRows.map((row) => row.course_id));
  const activeDefaultCourses = defaultCoursesSeed.filter(
    (course) => !deletedDefaultCourseIds.has(course.id),
  );
  const now = new Date().toISOString();
  await withTransaction(async (client) => {
    for (const course of activeDefaultCourses) {
      if (!existingIds.has(course.id)) {
        if (supportsInstructorUser) {
          await execute(
            `
              INSERT INTO courses (
                id, title, instructor, instructor_user_id, level, image_url, summary, price_usd, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              ON CONFLICT (id) DO NOTHING
            `,
            [
              course.id,
              course.title,
              course.instructor,
              course.instructor_user_id,
              course.level,
              course.image_url,
              course.summary,
              course.price_usd,
              now,
            ],
            client,
          );
        } else {
          await execute(
            `
              INSERT INTO courses (
                id, title, instructor, level, image_url, summary, price_usd, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (id) DO NOTHING
            `,
            [
              course.id,
              course.title,
              course.instructor,
              course.level,
              course.image_url,
              course.summary,
              course.price_usd,
              now,
            ],
            client,
          );
        }
        continue;
      }

      if (supportsInstructorUser) {
        await execute(
          `
            UPDATE courses
            SET instructor = $1,
                instructor_user_id = $2
            WHERE id = $3
              AND (
                instructor IS DISTINCT FROM $1
                OR instructor_user_id IS DISTINCT FROM $2
              )
          `,
          [course.instructor, course.instructor_user_id, course.id],
          client,
        );
      } else {
        await execute(
          `
            UPDATE courses
            SET instructor = $1
            WHERE id = $2
              AND instructor IS DISTINCT FROM $1
          `,
          [course.instructor, course.id],
          client,
        );
      }
    }

    await execute(
      `
        DELETE FROM courses
        WHERE id = ANY($1::text[])
           OR title ILIKE 'Demo Stripe:%'
           OR (level = 'Test' AND price_usd <= 1)
      `,
      [["course-7", "course-8", "course-9"]],
      client,
    );
  });
}

async function ensureDefaultCourseModules() {
  await ensureDefaultCourses();
  const supportsCourseModules = await ensureCourseModulesTable();
  if (!supportsCourseModules) {
    return;
  }

  await ensureDeletedDefaultCoursesTable();
  const deletedDefaultRows = await queryRows<{ course_id: string }>(
    "SELECT course_id FROM deleted_default_courses",
  );
  const deletedDefaultCourseIds = new Set(deletedDefaultRows.map((row) => row.course_id));

  const activeCourseIds = new Set(
    defaultCoursesSeed
      .map((course) => course.id)
      .filter((courseId) => !deletedDefaultCourseIds.has(courseId)),
  );
  const modulesForActiveCourses = defaultCourseModulesSeed.filter((courseModule) =>
    activeCourseIds.has(courseModule.course_id),
  );

  // Si el numero de modulos en BD ya coincide con el seed completo, no hay nada
  // que hacer. Esto evita recorrer el loop en cada request tras la primera carga.
  const countRow = await queryOne<{ total: number }>(
    "SELECT COUNT(*)::int AS total FROM course_modules",
  );
  if ((countRow?.total ?? 0) >= modulesForActiveCourses.length) {
    return;
  }

  // UPSERT: inserta modulos nuevos Y actualiza el contenido de los existentes.
  // Esto permite que los modulos genericos iniciales se reemplacen con contenido
  // real sin borrar filas ni alterar IDs ni el historial de compras.
  const now = new Date().toISOString();
  await withTransaction(async (client) => {
    for (const courseModule of modulesForActiveCourses) {
      await execute(
        `
          INSERT INTO course_modules (
            id, course_id, position, title, lesson_type,
            duration_minutes, content, video_url, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            title            = EXCLUDED.title,
            lesson_type      = EXCLUDED.lesson_type,
            duration_minutes = EXCLUDED.duration_minutes,
            content          = EXCLUDED.content,
            video_url        = EXCLUDED.video_url
        `,
        [
          courseModule.id,
          courseModule.course_id,
          courseModule.position,
          courseModule.title,
          courseModule.lesson_type,
          courseModule.duration_minutes,
          courseModule.content,
          courseModule.video_url,
          now,
        ],
        client,
      );
    }
  });
}

async function ensureDefaultForumPosts() {
  const countRow = await queryOne<{ total: number }>("SELECT COUNT(*)::int AS total FROM forum_posts");
  if ((countRow?.total ?? 0) > 0) {
    return;
  }

  const now = new Date().toISOString();
  await withTransaction(async (client) => {
    for (const post of defaultForumSeed) {
      await execute(
        `
          INSERT INTO forum_posts (
            id, author_user_id, author_name, title, body, category, upvotes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `,
        [post.id, null, post.author_name, post.title, post.body, post.category, post.upvotes, now, now],
        client,
      );

      for (const comment of post.comments) {
        await execute(
          `
            INSERT INTO forum_comments (id, post_id, author_user_id, author_name, text, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO NOTHING
          `,
          [comment.id, post.id, null, comment.author_name, comment.text, now],
          client,
        );
      }
    }
  });
}

let legacyConcertPlaceholderCleanupPromise: Promise<void> | null = null;
async function ensureLegacyConcertPlaceholdersPurged() {
  if (legacyConcertPlaceholderCleanupPromise) {
    return legacyConcertPlaceholderCleanupPromise;
  }

  legacyConcertPlaceholderCleanupPromise = (async () => {
    await withTransaction(async (client) => {
      await execute(`DELETE FROM concerts WHERE user_id = 'preview'`, [], client);

      for (const concert of defaultConcertSeeds) {
        await execute(
          `
            DELETE FROM concerts
            WHERE title = $1
              AND date = $2
              AND venue = $3
              AND city = $4
              AND flyer_url = $5
              AND ticket_url = $6
              AND capacity = $7
              AND status = $8
          `,
          [
            concert.title,
            concert.date,
            concert.venue,
            concert.city,
            concert.flyerUrl,
            concert.ticketUrl,
            concert.capacity,
            concert.status,
          ],
          client,
        );
      }
    });

    invalidatePrefix("concerts:public:");
  })();

  try {
    await legacyConcertPlaceholderCleanupPromise;
  } catch (error) {
    legacyConcertPlaceholderCleanupPromise = null;
    throw error;
  }
}

async function ensureDefaultThreadsForUser(userId: string) {
  const countRow = await queryOne<{ total: number }>(
    "SELECT COUNT(*)::int AS total FROM chat_threads WHERE user_id = $1",
    [userId],
  );
  if ((countRow?.total ?? 0) > 0) {
    return;
  }

  const now = new Date().toISOString();
  await withTransaction(async (client) => {
    for (const seed of defaultThreadSeeds) {
      const threadId = randomUUID();
      await execute(
        `
          INSERT INTO chat_threads (
            id, user_id, contact_name, contact_role, contact_avatar, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [threadId, userId, seed.contactName, seed.contactRole, seed.contactAvatar, now, now],
        client,
      );

      for (const message of seed.messages) {
        await execute(
          `
            INSERT INTO chat_messages (id, thread_id, sender_type, text, is_unread, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [randomUUID(), threadId, message.senderType, message.text, message.isUnread, now],
          client,
        );
      }
    }
  });
}

let legacyDefaultThreadCleanupPromise: Promise<void> | null = null;
async function ensureLegacyDefaultThreadsPurged() {
  if (legacyDefaultThreadCleanupPromise) {
    return legacyDefaultThreadCleanupPromise;
  }

  legacyDefaultThreadCleanupPromise = (async () => {
    await execute(
      `
        DELETE FROM chat_threads
        WHERE (contact_name = $1 AND contact_role = $2)
           OR (contact_name = $3 AND contact_role = $4)
           OR (contact_name = $5 AND contact_role = $6)
      `,
      [
        "Laura Perez",
        "Manager",
        "Santi Diaz",
        "Productor",
        "Diego Mora",
        "Visuales",
      ],
    );
  })();

  try {
    await legacyDefaultThreadCleanupPromise;
  } catch (error) {
    legacyDefaultThreadCleanupPromise = null;
    throw error;
  }
}
export async function listConcertsByUser(userId: string): Promise<ConcertRecord[]> {
  await ensureLegacyConcertPlaceholdersPurged();
  const rows = await queryRows<ConcertRow>(
    "SELECT * FROM concerts WHERE user_id = $1 ORDER BY date ASC",
    [userId],
  );
  return rows.map(mapConcert);
}

export async function listRecentConcertsByUser(userId: string, limit = 6): Promise<ConcertRecord[]> {
  const rows = await queryRows<ConcertRow>(
    "SELECT * FROM concerts WHERE user_id = $1 ORDER BY created_at DESC, date ASC LIMIT $2",
    [userId, limit],
  );
  return rows.map(mapConcert);
}

export async function listRecentForumPostsByUser(userId: string, limit = 5): Promise<ForumPostRecord[]> {
  const supportsMedia = await ensureForumMediaColumns();
  const posts = await queryRows<ForumPostRow>(
    supportsMedia
      ? `
          SELECT *
          FROM forum_posts
          WHERE author_user_id = $1
          ORDER BY created_at DESC
          LIMIT $2
        `
      : `
          SELECT
            id,
            author_user_id,
            author_name,
            title,
            body,
            category,
            'none'::text AS media_type,
            ''::text AS media_url,
            ''::text AS link_url,
            upvotes,
            created_at,
            updated_at
          FROM forum_posts
          WHERE author_user_id = $1
          ORDER BY created_at DESC
          LIMIT $2
        `,
    [userId, limit],
  );

  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.id);
  const comments = await queryRows<ForumCommentRow>(
    "SELECT * FROM forum_comments WHERE post_id = ANY($1::text[]) ORDER BY created_at ASC",
    [postIds],
  );

  const commentsByPostId = new Map<string, ForumCommentRecord[]>();
  for (const comment of comments) {
    const mapped = mapForumComment(comment);
    const current = commentsByPostId.get(mapped.postId) ?? [];
    current.push(mapped);
    commentsByPostId.set(mapped.postId, current);
  }

  return posts.map((post) => {
    const mapped = mapForumPost(post);
    return {
      ...mapped,
      comments: commentsByPostId.get(mapped.id) ?? [],
    };
  });
}

export async function listRecentForumCommentsByUser(
  userId: string,
  limit = 8,
): Promise<ForumCommentActivityRecord[]> {
  const rows = await queryRows<ForumCommentWithPostTitleRow>(
    `
      SELECT
        c.id,
        c.post_id,
        p.title AS post_title,
        c.text,
        c.created_at
      FROM forum_comments c
      INNER JOIN forum_posts p ON p.id = c.post_id
      WHERE c.author_user_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2
    `,
    [userId, limit],
  );

  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    postTitle: row.post_title,
    text: row.text,
    createdAt: row.created_at,
  }));
}

export async function listPublicConcerts(limit = 12): Promise<ConcertRecord[]> {
  return cached(`concerts:public:${limit}`, 45_000, async () => {
    await ensureLegacyConcertPlaceholdersPurged();
    const rows = await queryRows<ConcertRow>(
      "SELECT * FROM concerts ORDER BY created_at DESC, date ASC LIMIT $1",
      [limit],
    );
    return rows.map(mapConcert);
  });
}

export async function createConcert(input: {
  userId: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  flyerUrl: string;
  ticketUrl: string;
  capacity: string;
  status: ConcertRecord["status"];
}): Promise<ConcertRecord> {
  const now = new Date().toISOString();
  const concertId = randomUUID();
  const flyerUrl = normalizeConcertFlyerUrl(input.flyerUrl, concertId);
  const row = await queryOne<ConcertRow>(
    `
      INSERT INTO concerts (
        id, user_id, title, date, venue, city, flyer_url, ticket_url, capacity, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING *
    `,
    [
      concertId,
      input.userId,
      input.title,
      input.date,
      input.venue,
      input.city,
      flyerUrl,
      input.ticketUrl,
      input.capacity,
      input.status,
      now,
      now,
    ],
  );

  if (!row) {
    throw new Error("No se pudo crear el concierto.");
  }

  invalidatePrefix("concerts:public:");
  return mapConcert(row);
}

export async function updateConcertStatusById(input: {
  concertId: string;
  userId: string;
  status: ConcertRecord["status"];
}): Promise<ConcertRecord | null> {
  const now = new Date().toISOString();
  const row = await queryOne<ConcertRow>(
    `
      UPDATE concerts
      SET status = $1, updated_at = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `,
    [input.status, now, input.concertId, input.userId],
  );

  if (row) {
    invalidatePrefix("concerts:public:");
  }
  return row ? mapConcert(row) : null;
}

export async function deleteConcertById(input: {
  concertId: string;
  userId: string;
}): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `
      DELETE FROM concerts
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `,
    [input.concertId, input.userId],
  );

  if (row) {
    invalidatePrefix("concerts:public:");
    return true;
  }

  return false;
}

export async function listForumPostsWithComments(): Promise<ForumPostRecord[]> {
  return cached("forum:posts", 30_000, async () => {
    await ensureDefaultForumPosts();
    const supportsMedia = await ensureForumMediaColumns();
    const [posts, comments] = await Promise.all([
      queryRows<ForumPostRow>(
        supportsMedia
          ? `
              SELECT
                p.*,
                COALESCE(u.avatar_url, '') AS author_avatar_url
              FROM forum_posts p
              LEFT JOIN users u ON u.id = p.author_user_id
              ORDER BY p.created_at DESC
            `
          : `
              SELECT
                p.id,
                p.author_user_id,
                p.author_name,
                COALESCE(u.avatar_url, '') AS author_avatar_url,
                p.title,
                p.body,
                p.category,
                'none'::text AS media_type,
                ''::text AS media_url,
                ''::text AS link_url,
                p.upvotes,
                p.created_at,
                p.updated_at
              FROM forum_posts p
              LEFT JOIN users u ON u.id = p.author_user_id
              ORDER BY p.created_at DESC
            `,
      ),
      queryRows<ForumCommentRow>(
        `
          SELECT
            c.*,
            COALESCE(u.avatar_url, '') AS author_avatar_url
          FROM forum_comments c
          LEFT JOIN users u ON u.id = c.author_user_id
          ORDER BY c.created_at ASC
        `,
      ),
    ]);

    const commentsByPostId = new Map<string, ForumCommentRecord[]>();
    for (const comment of comments) {
      const mapped = mapForumComment(comment);
      const current = commentsByPostId.get(mapped.postId) ?? [];
      current.push(mapped);
      commentsByPostId.set(mapped.postId, current);
    }

    return posts.map((post) => {
      const mapped = mapForumPost(post);
      return {
        ...mapped,
        comments: commentsByPostId.get(mapped.id) ?? [],
      };
    });
  });
}

export async function createForumPost(input: {
  authorUserId: string | null;
  authorName: string;
  authorAvatarUrl?: string;
  title: string;
  body: string;
  category: string;
  mediaType: "none" | "image" | "video" | "audio";
  mediaUrl: string;
  linkUrl: string;
}): Promise<ForumPostRecord> {
  const now = new Date().toISOString();
  const supportsMedia = await ensureForumMediaColumns();
  const row = supportsMedia
    ? await queryOne<ForumPostRow>(
      `
          INSERT INTO forum_posts (
            id, author_user_id, author_name, title, body, category, media_type, media_url, link_url, upvotes, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
          RETURNING *
        `,
      [
        randomUUID(),
        input.authorUserId,
        input.authorName,
        input.title,
        input.body,
        input.category,
        input.mediaType,
        input.mediaUrl,
        input.linkUrl,
        1,
        now,
        now,
      ],
    )
    : await queryOne<ForumPostRow>(
      `
          INSERT INTO forum_posts (
            id, author_user_id, author_name, title, body, category, upvotes, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          )
          RETURNING
            id,
            author_user_id,
            author_name,
            title,
            body,
            category,
            'none'::text AS media_type,
            ''::text AS media_url,
            ''::text AS link_url,
            upvotes,
            created_at,
            updated_at
        `,
      [
        randomUUID(),
        input.authorUserId,
        input.authorName,
        input.title,
        input.body,
        input.category,
        1,
        now,
        now,
      ],
    );

  if (!row) {
    throw new Error("No se pudo crear el post.");
  }

  invalidate("forum:posts");
  const mappedPost = mapForumPost(row);
  return {
    ...mappedPost,
    authorAvatarUrl: mappedPost.authorAvatarUrl || input.authorAvatarUrl || "",
    comments: [],
  };
}

export async function incrementForumPostVote(postId: string): Promise<ForumPostRecord | null> {
  const now = new Date().toISOString();
  const row = await queryOne<ForumPostRow>(
    `
      UPDATE forum_posts
      SET upvotes = upvotes + 1, updated_at = $1
      WHERE id = $2
      RETURNING *
    `,
    [now, postId],
  );

  if (!row) {
    return null;
  }

  const postWithAvatar = await queryOne<ForumPostRow>(
    `
      SELECT
        p.*,
        COALESCE(u.avatar_url, '') AS author_avatar_url
      FROM forum_posts p
      LEFT JOIN users u ON u.id = p.author_user_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [postId],
  );

  if (!postWithAvatar) {
    return null;
  }

  const comments = await queryRows<ForumCommentRow>(
    `
      SELECT
        c.*,
        COALESCE(u.avatar_url, '') AS author_avatar_url
      FROM forum_comments c
      LEFT JOIN users u ON u.id = c.author_user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `,
    [postId],
  );

  invalidate("forum:posts");
  return {
    ...mapForumPost(postWithAvatar),
    comments: comments.map(mapForumComment),
  };
}

export async function decrementForumPostVote(postId: string): Promise<ForumPostRecord | null> {
  const now = new Date().toISOString();
  const row = await queryOne<ForumPostRow>(
    `
      UPDATE forum_posts
      SET upvotes = GREATEST(0, upvotes - 1), updated_at = $1
      WHERE id = $2
      RETURNING *
    `,
    [now, postId],
  );

  if (!row) {
    return null;
  }

  const postWithAvatar = await queryOne<ForumPostRow>(
    `
      SELECT
        p.*,
        COALESCE(u.avatar_url, '') AS author_avatar_url
      FROM forum_posts p
      LEFT JOIN users u ON u.id = p.author_user_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [postId],
  );

  if (!postWithAvatar) {
    return null;
  }

  const comments = await queryRows<ForumCommentRow>(
    `
      SELECT
        c.*,
        COALESCE(u.avatar_url, '') AS author_avatar_url
      FROM forum_comments c
      LEFT JOIN users u ON u.id = c.author_user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `,
    [postId],
  );

  invalidate("forum:posts");
  return {
    ...mapForumPost(postWithAvatar),
    comments: comments.map(mapForumComment),
  };
}

export async function createForumComment(input: {
  postId: string;
  authorUserId: string | null;
  authorName: string;
  authorAvatarUrl?: string;
  text: string;
}): Promise<ForumCommentRecord | null> {
  const post = await queryOne<{ id: string }>("SELECT id FROM forum_posts WHERE id = $1 LIMIT 1", [input.postId]);
  if (!post) {
    return null;
  }

  const row = await queryOne<ForumCommentRow>(
    `
      INSERT INTO forum_comments (id, post_id, author_user_id, author_name, text, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [randomUUID(), input.postId, input.authorUserId, input.authorName, input.text, new Date().toISOString()],
  );

  if (row) {
    invalidate("forum:posts");
  }
  if (!row) {
    return null;
  }

  const mappedComment = mapForumComment(row);
  return {
    ...mappedComment,
    authorAvatarUrl: mappedComment.authorAvatarUrl || input.authorAvatarUrl || "",
  };
}

async function ensureJobsColumnsExist() {
  await pool.query(`
    ALTER TABLE jobs
      ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS requires_cv BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS requester_name TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS requester_role TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS requirements TEXT NOT NULL DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS deadline TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS poster_user_id TEXT;
  `);
}

export async function listJobs(): Promise<JobRecord[]> {
  return cached("jobs:list", 60_000, async () => {
    await ensureJobsColumnsExist();
    await ensureDefaultJobs();
    const rows = await queryRows<JobRow>("SELECT * FROM jobs ORDER BY created_at DESC");
    return rows.map(mapJob);
  });
}

export async function listJobApplicationsByUser(userId: string): Promise<JobApplicationRecord[]> {
  const rows = await queryRows<JobApplicationRow>(
    "SELECT * FROM job_applications WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return rows.map(mapJobApplication);
}

export async function createJobApplication(input: {
  jobId: string;
  userId: string;
  status: string;
}): Promise<JobApplicationRecord | null> {
  const job = await queryOne<{ id: string }>("SELECT id FROM jobs WHERE id = $1 LIMIT 1", [input.jobId]);
  if (!job) {
    return null;
  }

  const existing = await queryOne<JobApplicationRow>(
    "SELECT * FROM job_applications WHERE job_id = $1 AND user_id = $2 LIMIT 1",
    [input.jobId, input.userId],
  );
  if (existing) {
    return mapJobApplication(existing);
  }

  const row = await queryOne<JobApplicationRow>(
    `
      INSERT INTO job_applications (id, job_id, user_id, status, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [randomUUID(), input.jobId, input.userId, input.status, new Date().toISOString()],
  );

  return row ? mapJobApplication(row) : null;
}

let defaultsInitializedPromise: Promise<void> | null = null;
async function ensureDefaults() {
  if (!defaultsInitializedPromise) {
    defaultsInitializedPromise = (async () => {
      await ensureDefaultCourses();
      await ensureDefaultCourseModules();
    })();
  }
  return defaultsInitializedPromise;
}

const CACHE_TTL = 60_000;
let coursesCache: { data: CourseRecord[]; timestamp: number } | null = null;

export async function listCourses(): Promise<CourseRecord[]> {
  const now = Date.now();
  if (coursesCache && now - coursesCache.timestamp < CACHE_TTL) {
    return coursesCache.data;
  }

  await ensureDefaults();

  const rows = await queryRows<CourseRow>(`
    SELECT
      c.id,
      c.title,
      c.instructor,
      to_jsonb(c)->>'instructor_user_id' AS instructor_user_id,
      c.level,
      c.image_url,
      c.summary,
      c.price_usd,
      c.created_at
    FROM courses c
    ORDER BY c.created_at DESC
  `);
  const records = rows.map(mapCourse);
  coursesCache = { data: records, timestamp: now };
  return records;
}

export async function getCourseById(courseId: string): Promise<CourseRecord | null> {
  await ensureDefaultCourses();
  await ensureDefaultCourseModules();
  const row = await queryOne<CourseRow>(
    `
      SELECT
        c.id,
        c.title,
        c.instructor,
        to_jsonb(c)->>'instructor_user_id' AS instructor_user_id,
        c.level,
        c.image_url,
        c.summary,
        c.price_usd,
        c.created_at
      FROM courses c
      WHERE c.id = $1
      LIMIT 1
    `,
    [courseId],
  );
  return row ? mapCourse(row) : null;
}

export async function listCourseModulesByCourseId(courseId: string): Promise<CourseModuleRecord[]> {
  await ensureDefaultCourseModules();
  const supportsCourseModules = await ensureCourseModulesTable();
  if (!supportsCourseModules) {
    return [];
  }
  const rows = await queryRows<CourseModuleRow>(
    "SELECT * FROM course_modules WHERE course_id = $1 ORDER BY position ASC",
    [courseId],
  );
  return rows.map(mapCourseModule);
}

export async function listCoursePurchasesByUser(userId: string): Promise<CoursePurchaseRecord[]> {
  const rows = await queryRows<CoursePurchaseRow>(
    "SELECT * FROM course_purchases WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return rows.map(mapCoursePurchase);
}

export async function getCoursePurchaseByIdForUser(input: {
  purchaseId: string;
  userId: string;
}): Promise<CoursePurchaseRecord | null> {
  const row = await queryOne<CoursePurchaseRow>(
    "SELECT * FROM course_purchases WHERE id = $1 AND user_id = $2 LIMIT 1",
    [input.purchaseId, input.userId],
  );

  return row ? mapCoursePurchase(row) : null;
}

export async function createCoursePurchaseIntent(input: {
  courseId: string;
  userId: string;
  provider: CoursePurchaseRecord["provider"];
  status: CoursePurchaseRecord["status"];
  amountUsd: number;
  currency: string;
  checkoutUrl: string;
}): Promise<CoursePurchaseRecord> {
  const now = new Date().toISOString();
  const row = await queryOne<CoursePurchaseRow>(
    `
      INSERT INTO course_purchases (
        id,
        course_id,
        user_id,
        provider,
        status,
        amount_usd,
        currency,
        checkout_url,
        created_at,
        updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING *
    `,
    [
      randomUUID(),
      input.courseId,
      input.userId,
      input.provider,
      input.status,
      input.amountUsd,
      input.currency,
      input.checkoutUrl,
      now,
      now,
    ],
  );

  if (!row) {
    throw new Error("No se pudo registrar la compra del curso.");
  }

  return mapCoursePurchase(row);
}

export async function updateCoursePurchaseCheckoutUrl(input: {
  purchaseId: string;
  userId: string;
  checkoutUrl: string;
}) {
  const row = await queryOne<CoursePurchaseRow>(
    `
      UPDATE course_purchases
      SET checkout_url = $1, updated_at = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `,
    [input.checkoutUrl, new Date().toISOString(), input.purchaseId, input.userId],
  );

  return row ? mapCoursePurchase(row) : null;
}

export async function updateCoursePurchaseStatus(input: {
  purchaseId: string;
  userId: string;
  status: CoursePurchaseRecord["status"];
}) {
  const row = await queryOne<CoursePurchaseRow>(
    `
      UPDATE course_purchases
      SET status = $1, updated_at = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `,
    [input.status, new Date().toISOString(), input.purchaseId, input.userId],
  );

  return row ? mapCoursePurchase(row) : null;
}

export async function userHasPaidCourseAccess(input: { userId: string; courseId: string }) {
  const row = await queryOne<{ has_access: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM course_purchases
        WHERE user_id = $1
          AND course_id = $2
          AND status = 'paid'
      ) AS has_access
    `,
    [input.userId, input.courseId],
  );

  return Boolean(row?.has_access);
}
export async function listChatThreadsWithMessagesByUser(userId: string): Promise<ChatThreadRecord[]> {
  const supportsChatThreadColumns = await ensureChatThreadColumns();
  const supportsGroupMembersTable = await ensureChatGroupMembersTable();

  await ensureLegacyDefaultThreadsPurged();
  await ensureDefaultThreadsForUser(userId);

  const threads = await queryRows<ChatThreadRow>(
    `
      SELECT
        t.id,
        t.user_id,
        CASE
          WHEN COALESCE(t.is_group, FALSE) THEN t.contact_name
          WHEN t.contact_user_id IS NOT NULL THEN COALESCE(NULLIF(u.name, ''), t.contact_name)
          ELSE t.contact_name
        END AS contact_name,
        CASE
          WHEN COALESCE(t.is_group, FALSE) THEN t.contact_role
          WHEN t.contact_user_id IS NOT NULL THEN COALESCE(NULLIF(u.musician_type, ''), t.contact_role)
          ELSE t.contact_role
        END AS contact_role,
        CASE
          WHEN COALESCE(t.is_group, FALSE) THEN COALESCE(t.contact_avatar, '')
          WHEN t.contact_user_id IS NOT NULL THEN COALESCE(NULLIF(u.avatar_url, ''), '')
          ELSE COALESCE(t.contact_avatar, '')
        END AS contact_avatar,
        t.contact_user_id,
        t.is_group,
        t.group_name,
        t.created_at,
        t.updated_at
      FROM chat_threads t
      LEFT JOIN users u ON u.id = t.contact_user_id
      WHERE t.user_id = $1
      ORDER BY t.updated_at DESC
    `,
    [userId],
  );
  const messages = await queryRows<ChatMessageRow>(
    `
      SELECT m.*
      FROM chat_messages m
      INNER JOIN chat_threads t ON t.id = m.thread_id
      WHERE t.user_id = $1
      ORDER BY m.created_at ASC
    `,
    [userId],
  );

  // Load group members for group threads
  const groupThreadIds =
    supportsChatThreadColumns && supportsGroupMembersTable
      ? threads.filter((t) => Boolean(t.is_group)).map((t) => t.id)
      : [];
  const membersByThread = new Map<string, string[]>();
  if (groupThreadIds.length > 0) {
    const members = await queryRows<ChatGroupMemberRow>(
      `SELECT * FROM chat_group_members WHERE thread_id = ANY($1::text[])`,
      [groupThreadIds],
    );
    for (const member of members) {
      const current = membersByThread.get(member.thread_id) ?? [];
      current.push(member.user_id);
      membersByThread.set(member.thread_id, current);
    }
  }

  const messagesByThread = new Map<string, ChatMessageRecord[]>();
  for (const message of messages) {
    const mapped = mapChatMessage(message);
    const current = messagesByThread.get(mapped.threadId) ?? [];
    current.push(mapped);
    messagesByThread.set(mapped.threadId, current);
  }

  return threads.map((thread) => {
    const mapped = mapChatThread(thread);
    return {
      ...mapped,
      memberIds: membersByThread.get(mapped.id) ?? [],
      messages: messagesByThread.get(mapped.id) ?? [],
    };
  });
}

export async function markThreadMessagesReadByUser(input: { userId: string; threadId: string }) {
  await execute(
    `
      UPDATE chat_messages
      SET is_unread = FALSE
      WHERE thread_id = $1
        AND sender_type = 'them'
        AND EXISTS (
          SELECT 1
          FROM chat_threads t
          WHERE t.id = $1 AND t.user_id = $2
        )
    `,
    [input.threadId, input.userId],
  );
}

export async function createChatMessageForThread(input: {
  userId: string;
  threadId: string;
  senderType: "me" | "them";
  text: string;
  isUnread: boolean;
}): Promise<ChatMessageRecord | null> {
  await ensureChatThreadColumns();

  const thread = await queryOne<Pick<ChatThreadRow, "id" | "is_group" | "contact_user_id">>(
    "SELECT id, is_group, contact_user_id FROM chat_threads WHERE id = $1 AND user_id = $2 LIMIT 1",
    [input.threadId, input.userId],
  );
  if (!thread) {
    return null;
  }

  const now = new Date().toISOString();
  const row = await queryOne<ChatMessageRow>(
    `
      INSERT INTO chat_messages (id, thread_id, sender_type, text, is_unread, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [randomUUID(), input.threadId, input.senderType, input.text, input.isUnread, now],
  );

  await execute("UPDATE chat_threads SET updated_at = $1 WHERE id = $2", [now, input.threadId]);

  const isDirectMessageFromOwner = !thread.is_group && input.senderType === "me";
  const recipientUserId = thread.contact_user_id?.trim() || null;

  if (isDirectMessageFromOwner && recipientUserId) {
    try {
      const recipientThread = await createOrGetDirectThread(recipientUserId, input.userId);

      await queryOne<ChatMessageRow>(
        `
          INSERT INTO chat_messages (id, thread_id, sender_type, text, is_unread, created_at)
          VALUES ($1, $2, 'them', $3, TRUE, $4)
          RETURNING *
        `,
        [randomUUID(), recipientThread.id, input.text, now],
      );

      await execute("UPDATE chat_threads SET updated_at = $1 WHERE id = $2", [now, recipientThread.id]);
    } catch (mirrorError) {
      console.error("[chat] mirror direct message error", mirrorError);
    }
  }

  return row ? mapChatMessage(row) : null;
}

// ── User search ────────────────────────────────────────────────────────────────
export async function searchUsers(
  query: string,
  excludeUserId: string,
  limit = 20,
): Promise<UserSearchRecord[]> {
  const q = `%${query.toLowerCase()}%`;
  const rows = await queryRows<UserRow>(
    `SELECT * FROM users
     WHERE id <> $1
       AND (LOWER(name) LIKE $2 OR LOWER(email) LIKE $2)
     ORDER BY name ASC
     LIMIT $3`,
    [excludeUserId, q, limit],
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    musicianType: row.musician_type ?? "",
    bio: row.bio ?? "",
    primaryInstrument: row.primary_instrument ?? "",
    avatarUrl: row.avatar_url ?? "",
  }));
}

// ── Search bands ───────────────────────────────────────────────────────────────
export async function searchBands(query: string, limit = 5): Promise<Array<{ id: string; name: string; genre: string; memberCount: number }>> {
  const q = `%${query.toLowerCase()}%`;
  const rows = await queryRows<{ id: string; name: string; genre: string; member_count: number }>(
    `SELECT b.id, b.name, b.genre, COUNT(bm.id)::int AS member_count
     FROM bands b
     LEFT JOIN band_members bm ON bm.band_id = b.id
     WHERE LOWER(b.name) LIKE $1
     GROUP BY b.id
     ORDER BY b.name ASC
     LIMIT $2`,
    [q, limit],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, genre: r.genre ?? "", memberCount: r.member_count ?? 0 }));
}

// ── Search forum posts ─────────────────────────────────────────────────────────
export async function searchForumPosts(query: string, limit = 5): Promise<Array<{ id: string; title: string; category: string; authorName: string; authorUserId: string | null }>> {
  const q = `%${query.toLowerCase()}%`;
  const rows = await queryRows<{ id: string; title: string; category: string; author_name: string; author_user_id: string | null }>(
    `SELECT id, title, category, author_name, author_user_id
     FROM forum_posts
     WHERE LOWER(title) LIKE $1 OR LOWER(body) LIKE $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [q, limit],
  );
  return rows.map((r) => ({ id: r.id, title: r.title, category: r.category, authorName: r.author_name, authorUserId: r.author_user_id ?? null }));
}

// ── List all users ─────────────────────────────────────────────────────────────
export async function listAllUsers(limit = 100): Promise<UserSearchRecord[]> {
  const rows = await queryRows<UserRow>(
    `SELECT * FROM users ORDER BY name ASC LIMIT $1`,
    [limit],
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    musicianType: row.musician_type ?? "",
    bio: row.bio ?? "",
    primaryInstrument: row.primary_instrument ?? "",
    avatarUrl: row.avatar_url ?? "",
  }));
}

export async function listUsersForAdmin(input?: {
  query?: string;
  limit?: number;
}): Promise<AdminUserRecord[]> {
  await ensureUserExtraColumnsExist();
  const search = (input?.query ?? "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(300, Number(input?.limit ?? 200)));

  const values: unknown[] = [];
  let whereClause = "";

  if (search) {
    values.push(`%${search}%`);
    whereClause = `
      WHERE
        LOWER(name) LIKE $1
        OR LOWER(email) LIKE $1
        OR LOWER(COALESCE(stage_name, '')) LIKE $1
    `;
  }

  values.push(limit);
  const limitPlaceholder = `$${values.length}`;

  const rows = await queryRows<
    Pick<
      UserRow,
      | "id"
      | "name"
      | "email"
      | "stage_name"
      | "role"
      | "musician_type"
      | "primary_instrument"
      | "bio"
      | "created_at"
      | "updated_at"
    >
  >(
    `
      SELECT
        id,
        name,
        email,
        COALESCE(stage_name, '') AS stage_name,
        COALESCE(role, 'user') AS role,
        COALESCE(musician_type, '') AS musician_type,
        COALESCE(primary_instrument, '') AS primary_instrument,
        COALESCE(bio, '') AS bio,
        created_at,
        updated_at
      FROM users
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT ${limitPlaceholder}
    `,
    values,
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    stageName: row.stage_name ?? "",
    role: row.role === "admin" ? "admin" : "user",
    musicianType: row.musician_type ?? "",
    primaryInstrument: row.primary_instrument ?? "",
    bio: row.bio ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function updateUserForAdmin(input: {
  userId: string;
  name: string;
  email: string;
  stageName: string;
  role: "user" | "admin";
  musicianType: string;
  primaryInstrument: string;
  bio: string;
}): Promise<AdminUserRecord | null> {
  await ensureUserExtraColumnsExist();
  await ensureUniqueUsernameIndex();

  const now = new Date().toISOString();
  const row = await queryOne<
    Pick<
      UserRow,
      | "id"
      | "name"
      | "email"
      | "stage_name"
      | "role"
      | "musician_type"
      | "primary_instrument"
      | "bio"
      | "created_at"
      | "updated_at"
    >
  >(
    `
      UPDATE users
      SET
        name = $1,
        email = $2,
        stage_name = $3,
        role = $4,
        musician_type = $5,
        primary_instrument = $6,
        bio = $7,
        updated_at = $8
      WHERE id = $9
      RETURNING
        id,
        name,
        email,
        COALESCE(stage_name, '') AS stage_name,
        COALESCE(role, 'user') AS role,
        COALESCE(musician_type, '') AS musician_type,
        COALESCE(primary_instrument, '') AS primary_instrument,
        COALESCE(bio, '') AS bio,
        created_at,
        updated_at
    `,
    [
      input.name.trim().replace(/\s+/g, " "),
      input.email.trim().toLowerCase(),
      input.stageName.trim(),
      input.role,
      input.musicianType.trim(),
      input.primaryInstrument.trim(),
      input.bio.trim(),
      now,
      input.userId,
    ],
  );

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    stageName: row.stage_name ?? "",
    role: row.role === "admin" ? "admin" : "user",
    musicianType: row.musician_type ?? "",
    primaryInstrument: row.primary_instrument ?? "",
    bio: row.bio ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateUserPasswordHashById(userId: string, passwordHash: string): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await pool.query(
    `
      UPDATE users
      SET password_hash = $1, updated_at = $2
      WHERE id = $3
    `,
    [passwordHash, now, userId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function deleteUserById(userId: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  return (result.rowCount ?? 0) > 0;
}

export async function createMediaUploadRecord(input: {
  userId: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  data: Buffer;
}): Promise<MediaUploadRecord> {
  const supportsMediaUploads = await ensureMediaUploadsTable();
  if (!supportsMediaUploads) {
    throw new Error("No hay soporte para media_uploads en esta base de datos.");
  }

  const now = new Date().toISOString();
  const row = await queryOne<MediaUploadRow>(
    `
      INSERT INTO media_uploads (id, user_id, kind, mime_type, size_bytes, data, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      randomUUID(),
      input.userId,
      input.kind,
      input.mimeType,
      input.sizeBytes,
      input.data,
      now,
    ],
  );

  if (!row) {
    throw new Error("No se pudo guardar el archivo en la base de datos.");
  }

  return mapMediaUpload(row);
}

export async function getMediaUploadById(fileId: string): Promise<MediaUploadRecord | null> {
  const supportsMediaUploads = await ensureMediaUploadsTable();
  if (!supportsMediaUploads) {
    return null;
  }

  const row = await queryOne<MediaUploadRow>(
    "SELECT * FROM media_uploads WHERE id = $1 LIMIT 1",
    [fileId],
  );
  return row ? mapMediaUpload(row) : null;
}

// ── Create or get direct thread between two users ─────────────────────────────
export async function createOrGetDirectThread(
  userId: string,
  contactUserId: string,
): Promise<ChatThreadRecord> {
  const supportsChatThreadColumns = await ensureChatThreadColumns();

  const contactUser = await queryOne<UserRow>(
    `SELECT * FROM users WHERE id = $1`,
    [contactUserId],
  );

  if (!contactUser) {
    throw new Error("Contact user not found");
  }

  const existing = supportsChatThreadColumns
    ? await queryOne<ChatThreadRow>(
      `SELECT * FROM chat_threads
       WHERE is_group = FALSE
         AND user_id = $1
         AND contact_user_id = $2
       LIMIT 1`,
      [userId, contactUserId],
    )
    : await queryOne<ChatThreadRow>(
      `SELECT * FROM chat_threads
       WHERE user_id = $1
         AND contact_name = $2
       LIMIT 1`,
      [userId, contactUser.name],
    );

  if (existing) {
    const messages = await queryRows<ChatMessageRow>(
      `SELECT * FROM chat_messages WHERE thread_id = $1 ORDER BY created_at ASC`,
      [existing.id],
    );
    const mappedExisting = mapChatThread(existing);
    return {
      ...mappedExisting,
      contactName: contactUser.name,
      contactRole: contactUser.musician_type ?? "Musico",
      contactAvatar: contactUser.avatar_url ?? "",
      memberIds: [],
      messages: messages.map(mapChatMessage),
    };
  }

  const now = new Date().toISOString();
  const threadId = randomUUID();

  if (supportsChatThreadColumns) {
    await execute(
      `INSERT INTO chat_threads
         (id, user_id, contact_name, contact_role, contact_avatar, contact_user_id, is_group, group_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, '', $7, $8)`,
      [
        threadId,
        userId,
        contactUser.name,
        contactUser.musician_type ?? "Musico",
        contactUser.avatar_url ?? "",
        contactUserId,
        now,
        now,
      ],
    );
  } else {
    await execute(
      `INSERT INTO chat_threads
         (id, user_id, contact_name, contact_role, contact_avatar, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        threadId,
        userId,
        contactUser.name,
        contactUser.musician_type ?? "Musico",
        contactUser.avatar_url ?? "",
        now,
        now,
      ],
    );
  }

  const newThread = await queryOne<ChatThreadRow>(
    `SELECT * FROM chat_threads WHERE id = $1`,
    [threadId],
  );

  const mappedThread = mapChatThread(newThread!);

  return {
    ...mappedThread,
    contactName: contactUser.name,
    contactRole: contactUser.musician_type ?? "Musico",
    contactAvatar: contactUser.avatar_url ?? "",
    memberIds: [],
    messages: [],
  };
}

// ── Create a group chat thread ─────────────────────────────────────────────────
export async function createGroupChatThread(
  ownerUserId: string,
  groupName: string,
  memberUserIds: string[],
): Promise<ChatThreadRecord> {
  const supportsChatThreadColumns = await ensureChatThreadColumns();
  const supportsGroupMembersTable = await ensureChatGroupMembersTable();

  if (!supportsChatThreadColumns || !supportsGroupMembersTable) {
    throw new Error("Group chat schema not available");
  }

  const now = new Date().toISOString();
  const threadId = randomUUID();

  return withTransaction(async (client) => {
    await execute(
      `INSERT INTO chat_threads
         (id, user_id, contact_name, contact_role, contact_avatar, contact_user_id, is_group, group_name, created_at, updated_at)
       VALUES ($1, $2, '', '', '', NULL, TRUE, $3, $4, $5)`,
      [threadId, ownerUserId, groupName, now, now],
      client,
    );

    const allMembers = Array.from(new Set([ownerUserId, ...memberUserIds]));
    for (const memberId of allMembers) {
      await execute(
        `INSERT INTO chat_group_members (id, thread_id, user_id, joined_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (thread_id, user_id) DO NOTHING`,
        [randomUUID(), threadId, memberId, now],
        client,
      );
    }

    const newThread = await queryOne<ChatThreadRow>(
      `SELECT * FROM chat_threads WHERE id = $1`,
      [threadId],
      client,
    );

    return {
      ...mapChatThread(newThread!),
      memberIds: allMembers,
      messages: [],
    };
  });
}

// ─── Admin helpers ───────────────────────────────────────────────────────────

export async function deleteForumPost(postId: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM forum_posts WHERE id = $1", [postId]);
  invalidate("forum:posts");
  return (result.rowCount ?? 0) > 0;
}

export async function deleteForumComment(commentId: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM forum_comments WHERE id = $1", [commentId]);
  invalidate("forum:posts");
  return (result.rowCount ?? 0) > 0;
}

export async function createJobRecord(input: {
  title: string;
  type: string;
  city: string;
  imageUrl: string;
  pay: string;
  summary: string;
  description?: string;
  requiresCv?: boolean;
  requesterName?: string;
  requesterRole?: string;
  requirements?: string[];
  deadline?: string;
  posterUserId?: string | null;
}): Promise<JobRecord> {
  await ensureJobsColumnsExist();
  const now = new Date().toISOString();
  const row = await queryOne<JobRow>(
    `
      INSERT INTO jobs (
        id, title, type, city, image_url, pay, summary,
        description, requires_cv, requester_name, requester_role,
        requirements, deadline, poster_user_id, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *
    `,
    [
      randomUUID(),
      input.title,
      input.type,
      input.city,
      input.imageUrl,
      input.pay,
      input.summary,
      input.description ?? "",
      input.requiresCv ?? false,
      input.requesterName ?? "",
      input.requesterRole ?? "",
      JSON.stringify(input.requirements ?? []),
      input.deadline ?? "",
      input.posterUserId ?? null,
      now,
    ],
  );
  if (!row) throw new Error("No se pudo crear la oportunidad.");
  invalidate("jobs:list");
  return mapJob(row);
}

export async function deleteJobRecord(jobId: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM jobs WHERE id = $1", [jobId]);
  invalidate("jobs:list");
  return (result.rowCount ?? 0) > 0;
}

export async function createCourseRecord(input: {
  title: string;
  instructor: string;
  level: string;
  imageUrl: string;
  summary: string;
  priceUsd: number;
}): Promise<CourseRecord> {
  await ensureDefaults();
  const supportsInstructorUser = await ensureCoursesInstructorColumn();
  const now = new Date().toISOString();
  const row = supportsInstructorUser
    ? await queryOne<CourseRow>(
      `
        INSERT INTO courses (
          id, title, instructor, instructor_user_id, level, image_url, summary, price_usd, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
      `,
      [
        randomUUID(),
        input.title,
        input.instructor,
        null,
        input.level,
        input.imageUrl,
        input.summary,
        input.priceUsd,
        now,
      ],
    )
    : await queryOne<CourseRow>(
      `
        INSERT INTO courses (
          id, title, instructor, level, image_url, summary, price_usd, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *
      `,
      [
        randomUUID(),
        input.title,
        input.instructor,
        input.level,
        input.imageUrl,
        input.summary,
        input.priceUsd,
        now,
      ],
    );

  if (!row) {
    throw new Error("No se pudo crear el curso.");
  }

  coursesCache = null;
  return mapCourse(row);
}

export async function deleteCourseRecord(courseId: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM courses WHERE id = $1", [courseId]);

  if ((result.rowCount ?? 0) > 0) {
    await ensureDeletedDefaultCoursesTable();
    const isDefaultCourse = defaultCoursesSeed.some((course) => course.id === courseId);
    if (isDefaultCourse) {
      await pool.query(
        `
          INSERT INTO deleted_default_courses (course_id, deleted_at)
          VALUES ($1, $2)
          ON CONFLICT (course_id) DO NOTHING
        `,
        [courseId, new Date().toISOString()],
      );
    }
  }

  coursesCache = null;
  return (result.rowCount ?? 0) > 0;
}

export async function updateCourseRecord(
  courseId: string,
  input: {
    title?: string;
    instructor?: string;
    level?: string;
    imageUrl?: string;
    summary?: string;
    priceUsd?: number;
  },
): Promise<CourseRecord | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.title !== undefined) {
    fields.push(`title = $${index++}`);
    values.push(input.title);
  }

  if (input.instructor !== undefined) {
    fields.push(`instructor = $${index++}`);
    values.push(input.instructor);
  }

  if (input.level !== undefined) {
    fields.push(`level = $${index++}`);
    values.push(input.level);
  }

  if (input.imageUrl !== undefined) {
    fields.push(`image_url = $${index++}`);
    values.push(input.imageUrl);
  }

  if (input.summary !== undefined) {
    fields.push(`summary = $${index++}`);
    values.push(input.summary);
  }

  if (input.priceUsd !== undefined && Number.isFinite(input.priceUsd)) {
    fields.push(`price_usd = $${index++}`);
    values.push(input.priceUsd);
  }

  if (fields.length === 0) {
    const current = await queryOne<CourseRow>(
      "SELECT * FROM courses WHERE id = $1 LIMIT 1",
      [courseId],
    );
    return current ? mapCourse(current) : null;
  }

  const row = await queryOne<CourseRow>(
    `
      UPDATE courses
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING *
    `,
    [...values, courseId],
  );

  if (!row) {
    return null;
  }

  coursesCache = null;
  return mapCourse(row);
}

export async function createCourseModuleRecord(input: {
  courseId: string;
  title: string;
  lessonType: CourseModuleRecord["lessonType"];
  durationMinutes: number;
  content: string;
  videoUrl: string;
}): Promise<CourseModuleRecord | null> {
  await ensureDefaults();
  const supportsCourseModules = await ensureCourseModulesTable();
  if (!supportsCourseModules) {
    return null;
  }

  const now = new Date().toISOString();
  const inserted = await withTransaction(async (client) => {
    const course = await queryOne<{ id: string }>(
      "SELECT id FROM courses WHERE id = $1 LIMIT 1",
      [input.courseId],
      client,
    );
    if (!course) {
      return null;
    }

    const nextPositionRow = await queryOne<{ next_position: number }>(
      "SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM course_modules WHERE course_id = $1",
      [input.courseId],
      client,
    );
    const nextPosition = nextPositionRow?.next_position ?? 1;

    return queryOne<CourseModuleRow>(
      `
        INSERT INTO course_modules (
          id,
          course_id,
          position,
          title,
          lesson_type,
          duration_minutes,
          content,
          video_url,
          created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
      `,
      [
        randomUUID(),
        input.courseId,
        nextPosition,
        input.title,
        input.lessonType,
        input.durationMinutes,
        input.content,
        input.videoUrl,
        now,
      ],
      client,
    );
  });

  return inserted ? mapCourseModule(inserted) : null;
}

export async function updateCourseModuleRecord(input: {
  courseId: string;
  moduleId: string;
  title?: string;
  lessonType?: CourseModuleRecord["lessonType"];
  durationMinutes?: number;
  content?: string;
  videoUrl?: string;
}): Promise<CourseModuleRecord | null> {
  const supportsCourseModules = await ensureCourseModulesTable();
  if (!supportsCourseModules) {
    return null;
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.title !== undefined) {
    fields.push(`title = $${index++}`);
    values.push(input.title);
  }
  if (input.lessonType !== undefined) {
    fields.push(`lesson_type = $${index++}`);
    values.push(input.lessonType);
  }
  if (input.durationMinutes !== undefined) {
    fields.push(`duration_minutes = $${index++}`);
    values.push(input.durationMinutes);
  }
  if (input.content !== undefined) {
    fields.push(`content = $${index++}`);
    values.push(input.content);
  }
  if (input.videoUrl !== undefined) {
    fields.push(`video_url = $${index++}`);
    values.push(input.videoUrl);
  }

  if (fields.length === 0) {
    const current = await queryOne<CourseModuleRow>(
      "SELECT * FROM course_modules WHERE id = $1 AND course_id = $2 LIMIT 1",
      [input.moduleId, input.courseId],
    );
    return current ? mapCourseModule(current) : null;
  }

  const row = await queryOne<CourseModuleRow>(
    `
      UPDATE course_modules
      SET ${fields.join(", ")}
      WHERE id = $${index} AND course_id = $${index + 1}
      RETURNING *
    `,
    [...values, input.moduleId, input.courseId],
  );

  return row ? mapCourseModule(row) : null;
}

export async function deleteCourseModuleRecord(input: {
  courseId: string;
  moduleId: string;
}): Promise<boolean> {
  const supportsCourseModules = await ensureCourseModulesTable();
  if (!supportsCourseModules) {
    return false;
  }

  return withTransaction(async (client) => {
    const deleted = await queryOne<{ position: number }>(
      "DELETE FROM course_modules WHERE id = $1 AND course_id = $2 RETURNING position",
      [input.moduleId, input.courseId],
      client,
    );

    if (!deleted) {
      return false;
    }

    await execute(
      "UPDATE course_modules SET position = position - 1 WHERE course_id = $1 AND position > $2",
      [input.courseId, deleted.position],
      client,
    );

    return true;
  });
}

export async function isAdminUserId(userId: string): Promise<boolean> {
  await ensureUserExtraColumnsExist();
  const row = await queryOne<{ role: string | null }>(
    "SELECT COALESCE(role, 'user') AS role FROM users WHERE id = $1 LIMIT 1",
    [userId],
  );
  return row?.role === "admin";
}
