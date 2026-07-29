import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createMediaUploadRecord } from "@/lib/db";
import { requestContentLengthExceeds } from "@/lib/security/request-limits";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { mimeMatchesFileSignature } from "@/lib/uploads/file-signatures";
import { forumUploadSchema } from "@/lib/validations/workspace";

function resolveMediaKind(mimeType: string): "image" | "video" | "audio" | null {
  const mime = mimeType.toLowerCase();

  if (mime.startsWith("image/")) {
    return "image";
  }
  if (mime.startsWith("video/")) {
    return "video";
  }
  if (mime.startsWith("audio/")) {
    return "audio";
  }

  return null;
}

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion para subir archivos." }, { status: 401 });
  }

  if (requestContentLengthExceeds(request, 82 * 1024 * 1024)) {
    return NextResponse.json({ message: "El archivo supera el limite permitido (80 MB)." }, { status: 413 });
  }

  const rateLimit = consumeRateLimit({
    key: `upload:forum:${sessionPayload.session.user.id}`,
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const formData = await request.formData();
    const parsed = forumUploadSchema.safeParse({
      file: formData.get("file"),
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          message: fieldErrors.file?.[0] ?? "No se recibio ningun archivo.",
          errors: fieldErrors,
        },
        { status: 400 },
      );
    }

    const fileEntry = parsed.data.file;

    const mediaType = resolveMediaKind(fileEntry.type);
    if (!mediaType) {
      return NextResponse.json(
        { message: "Formato no compatible. Usa imagen, video o audio." },
        { status: 400 },
      );
    }

    const mimeType = fileEntry.type.toLowerCase() || "application/octet-stream";
    const binary = Buffer.from(await fileEntry.arrayBuffer());
    if (!mimeMatchesFileSignature(binary, mimeType)) {
      return NextResponse.json(
        { message: "El contenido del archivo no coincide con el formato declarado." },
        { status: 400 },
      );
    }

    const stored = await createMediaUploadRecord({
      userId: sessionPayload.session.user.id,
      kind: `forum-${mediaType}`,
      mimeType,
      sizeBytes: binary.length,
      data: binary,
    });

    return NextResponse.json({
      message: "Archivo subido.",
      url: `/api/uploads/file/${stored.id}`,
      mediaType,
      fileName: fileEntry.name,
      size: binary.length,
    });
  } catch (error) {
    console.error("forum upload error", error);
    return NextResponse.json({ message: "No se pudo subir el archivo." }, { status: 500 });
  }
}
