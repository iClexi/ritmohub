import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createMediaUploadRecord } from "@/lib/db";
import { requestContentLengthExceeds } from "@/lib/security/request-limits";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { mimeMatchesFileSignature } from "@/lib/uploads/file-signatures";
import { avatarUploadSchema } from "@/lib/validations/workspace";

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  if (requestContentLengthExceeds(request, 6 * 1024 * 1024)) {
    return NextResponse.json({ message: "La imagen supera el limite de 5 MB." }, { status: 413 });
  }

  const rateLimit = consumeRateLimit({
    key: `upload:avatar:${sessionPayload.session.user.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const formData = await request.formData();
    const parsed = avatarUploadSchema.safeParse({
      file: formData.get("file"),
      kind: formData.get("kind") ?? "avatar",
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          message: fieldErrors.file?.[0] ?? fieldErrors.kind?.[0] ?? "No se recibio ninguna imagen.",
          errors: fieldErrors,
        },
        { status: 400 },
      );
    }

    const fileEntry = parsed.data.file;
    const kind = parsed.data.kind;
    const mimeType = fileEntry.type.toLowerCase() || "application/octet-stream";
    const binary = Buffer.from(await fileEntry.arrayBuffer());
    if (!mimeMatchesFileSignature(binary, mimeType)) {
      return NextResponse.json(
        { message: "El contenido del archivo no coincide con una imagen valida." },
        { status: 400 },
      );
    }

    const stored = await createMediaUploadRecord({
      userId: sessionPayload.session.user.id,
      kind,
      mimeType,
      sizeBytes: binary.length,
      data: binary,
    });

    return NextResponse.json({ url: `/api/uploads/file/${stored.id}` });
  } catch (error) {
    console.error("avatar upload error", error);
    return NextResponse.json({ message: "No se pudo subir la imagen." }, { status: 500 });
  }
}
