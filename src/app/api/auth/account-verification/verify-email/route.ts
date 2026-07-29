import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  getValidAccountVerificationEmailToken,
  invalidateAccountVerificationSmsCodesForUser,
  markAccountVerificationAsVerified,
  markAccountVerificationEmailTokenUsed,
} from "@/lib/auth/account-verification-store";
import { getAppUrl } from "@/lib/email/send-email";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function appRedirect(path: string) {
  return NextResponse.redirect(new URL(path, getAppUrl()));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token")?.trim();

    if (!token || token.length < 32) {
      return appRedirect("/verify-account?error=invalid");
    }

    const tokenRecord = await getValidAccountVerificationEmailToken(hashToken(token));

    if (!tokenRecord) {
      return appRedirect("/verify-account?error=invalid");
    }

    await markAccountVerificationEmailTokenUsed(tokenRecord.id);
    await invalidateAccountVerificationSmsCodesForUser(tokenRecord.userId);
    await markAccountVerificationAsVerified(tokenRecord.userId);

    return appRedirect("/dashboard?verified=1");
  } catch (error) {
    console.error("account verification email error", error);
    return appRedirect("/verify-account?error=server");
  }
}
