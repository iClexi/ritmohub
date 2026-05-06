import { randomUUID } from "node:crypto";

import { Pool, type PoolConfig } from "pg";

type AccountVerificationRow = {
  user_id: string;
  email: string;
  phone: string | null;
  status: "pending" | "verified";
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

type AccountVerificationEmailTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

type AccountVerificationSmsCodeRow = {
  id: string;
  user_id: string;
  phone: string;
  code_hash: string;
  attempt_count: number;
  max_attempts: number;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type AccountVerificationRecord = {
  userId: string;
  email: string;
  phone: string;
  status: "pending" | "verified";
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AccountVerificationEmailTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export type AccountVerificationSmsCodeRecord = {
  id: string;
  userId: string;
  phone: string;
  codeHash: string;
  attemptCount: number;
  maxAttempts: number;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

const connectionString = envValue("DATABASE_URL");
const dbSslEnabled = (envValue("DB_SSL") ?? "false").toLowerCase() === "true";
const dbSslRejectUnauthorized = (envValue("DB_SSL_REJECT_UNAUTHORIZED") ?? "true").toLowerCase() === "true";

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
    host: envValue("DB_HOST") ?? "127.0.0.1",
    port: Number(envValue("DB_PORT") ?? "5432"),
    user: envValue("DB_USER"),
    password: envValue("DB_PASSWORD"),
    database: envValue("DB_NAME") ?? "musicapp",
    options: "-c statement_timeout=12000",
    ...sharedPoolConfig,
  };

const verificationPool = new Pool({
  ...poolConfig,
  max: 3,
  idleTimeoutMillis: 25_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
});

let schemaPromise: Promise<void> | null = null;

function mapVerification(row: AccountVerificationRow): AccountVerificationRecord {
  return {
    userId: row.user_id,
    email: row.email,
    phone: row.phone ?? "",
    status: row.status,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapEmailToken(row: AccountVerificationEmailTokenRow): AccountVerificationEmailTokenRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: new Date(row.expires_at),
    usedAt: row.used_at ? new Date(row.used_at) : null,
    createdAt: new Date(row.created_at),
  };
}

function mapSmsCode(row: AccountVerificationSmsCodeRow): AccountVerificationSmsCodeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    phone: row.phone,
    codeHash: row.code_hash,
    attemptCount: Number(row.attempt_count),
    maxAttempts: Number(row.max_attempts),
    expiresAt: new Date(row.expires_at),
    usedAt: row.used_at ? new Date(row.used_at) : null,
    createdAt: new Date(row.created_at),
  };
}

async function ensureAccountVerificationSchema() {
  if (schemaPromise) {
    return schemaPromise;
  }

  schemaPromise = (async () => {
    await verificationPool.query(`
      CREATE TABLE IF NOT EXISTS account_verifications (
        user_id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        verified_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        CONSTRAINT fk_account_verifications_user
          FOREIGN KEY(user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,
        CONSTRAINT ck_account_verifications_status
          CHECK (status IN ('pending', 'verified'))
      );

      CREATE INDEX IF NOT EXISTS idx_account_verifications_status ON account_verifications(status);

      CREATE TABLE IF NOT EXISTS account_verification_email_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL,
        CONSTRAINT fk_account_verification_email_tokens_user
          FOREIGN KEY(user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_account_verification_email_tokens_user_id
        ON account_verification_email_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_account_verification_email_tokens_expires_at
        ON account_verification_email_tokens(expires_at);

      CREATE TABLE IF NOT EXISTS account_verification_sms_codes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        phone TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL,
        CONSTRAINT fk_account_verification_sms_codes_user
          FOREIGN KEY(user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_account_verification_sms_codes_user_id
        ON account_verification_sms_codes(user_id);
      CREATE INDEX IF NOT EXISTS idx_account_verification_sms_codes_expires_at
        ON account_verification_sms_codes(expires_at);
    `);
  })();

  try {
    await schemaPromise;
  } catch (error) {
    schemaPromise = null;
    throw error;
  }
}

export async function createPendingAccountVerification(input: { userId: string; email: string; phone: string }) {
  await ensureAccountVerificationSchema();

  const now = new Date().toISOString();
  await verificationPool.query(
    `
      INSERT INTO account_verifications (user_id, email, phone, status, verified_at, created_at, updated_at)
      VALUES ($1, $2, $3, 'pending', NULL, $4, $4)
      ON CONFLICT (user_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        status = 'pending',
        verified_at = NULL,
        updated_at = EXCLUDED.updated_at
    `,
    [input.userId, input.email.trim().toLowerCase(), input.phone.trim(), now],
  );
}

export async function getAccountVerificationByUserId(userId: string): Promise<AccountVerificationRecord | null> {
  await ensureAccountVerificationSchema();

  const result = await verificationPool.query<AccountVerificationRow>(
    `SELECT * FROM account_verifications WHERE user_id = $1 LIMIT 1`,
    [userId],
  );

  const row = result.rows[0];
  return row ? mapVerification(row) : null;
}

export async function isAccountVerificationPending(userId: string): Promise<boolean> {
  const record = await getAccountVerificationByUserId(userId);
  return record?.status === "pending";
}

export async function markAccountVerificationAsVerified(userId: string) {
  await ensureAccountVerificationSchema();

  const now = new Date().toISOString();
  await verificationPool.query(
    `
      UPDATE account_verifications
      SET status = 'verified',
          verified_at = COALESCE(verified_at, $1),
          updated_at = $1
      WHERE user_id = $2
    `,
    [now, userId],
  );
}

export async function createAccountVerificationEmailToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  await ensureAccountVerificationSchema();

  const now = new Date().toISOString();
  const result = await verificationPool.query<AccountVerificationEmailTokenRow>(
    `
      INSERT INTO account_verification_email_tokens (id, user_id, token_hash, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [randomUUID(), input.userId, input.tokenHash, input.expiresAt.toISOString(), now],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("No se pudo crear token de verificacion por correo.");
  }

  return mapEmailToken(row);
}

export async function getValidAccountVerificationEmailToken(tokenHash: string): Promise<AccountVerificationEmailTokenRecord | null> {
  await ensureAccountVerificationSchema();

  const result = await verificationPool.query<AccountVerificationEmailTokenRow>(
    `
      SELECT *
      FROM account_verification_email_tokens
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > $2
      LIMIT 1
    `,
    [tokenHash, new Date().toISOString()],
  );

  const row = result.rows[0];
  return row ? mapEmailToken(row) : null;
}

export async function markAccountVerificationEmailTokenUsed(tokenId: string) {
  await ensureAccountVerificationSchema();

  await verificationPool.query(
    `UPDATE account_verification_email_tokens SET used_at = $1 WHERE id = $2`,
    [new Date().toISOString(), tokenId],
  );
}

export async function invalidateAccountVerificationEmailTokensForUser(userId: string) {
  await ensureAccountVerificationSchema();

  await verificationPool.query(
    `
      UPDATE account_verification_email_tokens
      SET used_at = $1
      WHERE user_id = $2
        AND used_at IS NULL
    `,
    [new Date().toISOString(), userId],
  );
}

export async function deleteExpiredAccountVerificationEmailTokens() {
  await ensureAccountVerificationSchema();

  await verificationPool.query(
    `DELETE FROM account_verification_email_tokens WHERE expires_at <= $1 OR used_at IS NOT NULL`,
    [new Date().toISOString()],
  );
}

export async function createAccountVerificationSmsCode(input: {
  userId: string;
  phone: string;
  codeHash: string;
  maxAttempts: number;
  expiresAt: Date;
}) {
  await ensureAccountVerificationSchema();

  const now = new Date().toISOString();
  const result = await verificationPool.query<AccountVerificationSmsCodeRow>(
    `
      INSERT INTO account_verification_sms_codes (
        id,
        user_id,
        phone,
        code_hash,
        attempt_count,
        max_attempts,
        expires_at,
        created_at
      )
      VALUES ($1, $2, $3, $4, 0, $5, $6, $7)
      RETURNING *
    `,
    [randomUUID(), input.userId, input.phone.trim(), input.codeHash, input.maxAttempts, input.expiresAt.toISOString(), now],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("No se pudo crear codigo SMS de verificacion.");
  }

  return mapSmsCode(row);
}

export async function getValidAccountVerificationSmsCodeByUserId(userId: string): Promise<AccountVerificationSmsCodeRecord | null> {
  await ensureAccountVerificationSchema();

  const result = await verificationPool.query<AccountVerificationSmsCodeRow>(
    `
      SELECT *
      FROM account_verification_sms_codes
      WHERE user_id = $1
        AND used_at IS NULL
        AND expires_at > $2
        AND attempt_count < max_attempts
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId, new Date().toISOString()],
  );

  const row = result.rows[0];
  return row ? mapSmsCode(row) : null;
}

export async function incrementAccountVerificationSmsCodeAttempts(codeId: string): Promise<number> {
  await ensureAccountVerificationSchema();

  const result = await verificationPool.query<{ attempt_count: number }>(
    `
      UPDATE account_verification_sms_codes
      SET attempt_count = attempt_count + 1
      WHERE id = $1
      RETURNING attempt_count
    `,
    [codeId],
  );

  return Number(result.rows[0]?.attempt_count ?? 0);
}

export async function markAccountVerificationSmsCodeConsumed(codeId: string) {
  await ensureAccountVerificationSchema();

  await verificationPool.query(
    `UPDATE account_verification_sms_codes SET used_at = $1 WHERE id = $2`,
    [new Date().toISOString(), codeId],
  );
}

export async function invalidateAccountVerificationSmsCodesForUser(userId: string) {
  await ensureAccountVerificationSchema();

  await verificationPool.query(
    `
      UPDATE account_verification_sms_codes
      SET used_at = $1
      WHERE user_id = $2
        AND used_at IS NULL
    `,
    [new Date().toISOString(), userId],
  );
}

export async function deleteExpiredAccountVerificationSmsCodes() {
  await ensureAccountVerificationSchema();

  await verificationPool.query(
    `DELETE FROM account_verification_sms_codes WHERE expires_at <= $1 OR used_at IS NOT NULL`,
    [new Date().toISOString()],
  );
}

