import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  getValidAccountVerificationEmailToken,
  invalidateAccountVerificationSmsCodesForUser,
  markAccountVerificationAsVerified,
  markAccountVerificationEmailTokenUsed,
} from "@/lib/auth/account-verification-store";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token")?.trim();

    if (!token || token.length < 32) {
      return NextResponse.redirect(new URL("/verify-account?error=invalid", request.url));
    }

    const tokenRecord = await getValidAccountVerificationEmailToken(hashToken(token));

    if (!tokenRecord) {
      return NextResponse.redirect(new URL("/verify-account?error=invalid", request.url));
    }

    await markAccountVerificationEmailTokenUsed(tokenRecord.id);
    await invalidateAccountVerificationSmsCodesForUser(tokenRecord.userId);
    await markAccountVerificationAsVerified(tokenRecord.userId);

    return NextResponse.redirect(new URL("/dashboard?verified=1", request.url));
  } catch (error) {
    console.error("account verification email error", error);
    return NextResponse.redirect(new URL("/verify-account?error=server", request.url));
  }
}
