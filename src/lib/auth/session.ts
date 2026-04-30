import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import {
  createSessionRecord,
  deleteExpiredSessions,
  deleteSessionById,
  deleteSessionByTokenHash,
  getSessionWithUserByTokenHash,
} from "@/lib/db";

export const SESSION_COOKIE_NAME = "musisec_session";

const SESSION_TTL_DAYS = 7;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createToken(): string {
  return randomBytes(48).toString("base64url");
}

export async function createSession(userId: string) {
  const token = createToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await createSessionRecord({
    tokenHash,
    userId,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    await deleteExpiredSessions();
  } catch {
    return null;
  }

  const session = await getSessionWithUserByTokenHash(hashToken(token));

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await deleteSessionById(session.id);
    return null;
  }

  return { token, session };
}

export async function deleteSessionByToken(token: string) {
  await deleteSessionByTokenHash(hashToken(token));
}

export async function invalidateCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await deleteSessionByToken(token);
  }

  await clearSessionCookie();
}

