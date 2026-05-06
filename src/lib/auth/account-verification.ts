import { createHash, randomBytes } from "node:crypto";

import { buildAccountVerificationUrl, sendAccountVerificationEmail } from "@/lib/email/account-verification";
import {
  createAccountVerificationEmailToken,
  createAccountVerificationSmsCode,
  deleteExpiredAccountVerificationEmailTokens,
  deleteExpiredAccountVerificationSmsCodes,
  getAccountVerificationByUserId,
  invalidateAccountVerificationEmailTokensForUser,
  invalidateAccountVerificationSmsCodesForUser,
} from "@/lib/auth/account-verification-store";
import { sendAccountVerificationSms } from "@/lib/sms/account-verification";

const EMAIL_TOKEN_TTL_MS = 15 * 60 * 1000;
const SMS_CODE_TTL_MS = 10 * 60 * 1000;
const SMS_CODE_MAX_ATTEMPTS = 5;

export type AccountVerificationChannel = "email" | "sms";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createToken(): string {
  return randomBytes(32).toString("base64url");
}

function createSmsCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashAccountVerificationSecret(value: string) {
  return hashToken(value);
}

export async function sendAccountVerificationChallenge(input: {
  userId: string;
  name: string;
  channel: AccountVerificationChannel;
}) {
  const record = await getAccountVerificationByUserId(input.userId);

  if (!record || record.status !== "pending") {
    return { delivered: false as const, reason: "not_pending" as const };
  }

  if (input.channel === "sms") {
    if (!record.phone) {
      throw new Error("Tu cuenta no tiene un numero de celular para verificacion SMS.");
    }

    await deleteExpiredAccountVerificationSmsCodes();
    await invalidateAccountVerificationSmsCodesForUser(input.userId);

    const code = createSmsCode();
    await createAccountVerificationSmsCode({
      userId: input.userId,
      phone: record.phone,
      codeHash: hashToken(code),
      maxAttempts: SMS_CODE_MAX_ATTEMPTS,
      expiresAt: new Date(Date.now() + SMS_CODE_TTL_MS),
    });

    await sendAccountVerificationSms({
      recipient: record.phone,
      code,
    });

    return { delivered: true as const, channel: "sms" as const };
  }

  await deleteExpiredAccountVerificationEmailTokens();
  await invalidateAccountVerificationEmailTokensForUser(input.userId);

  const token = createToken();
  await createAccountVerificationEmailToken({
    userId: input.userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
  });

  await sendAccountVerificationEmail({
    to: record.email,
    name: input.name,
    verificationUrl: buildAccountVerificationUrl(token),
  });

  return { delivered: true as const, channel: "email" as const };
}
