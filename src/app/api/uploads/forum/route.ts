import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createMediaUploadRecord } from "@/lib/db";
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

    const stored = await createMediaUploadRecord({
      userId: sessionPayload.session.user.id,
      kind: `forum-${mediaType}`,
      mimeType,
      sizeBytes: fileEntry.size,
      data: binary,
    });

    return NextResponse.json({
      message: "Archivo subido.",
      url: `/api/uploads/file/${stored.id}`,
      mediaType,
      fileName: fileEntry.name,
      size: fileEntry.size,
    });
  } catch (error) {
    console.error("forum upload error", error);
    return NextResponse.json({ message: "No se pudo subir el archivo." }, { status: 500 });
  }
}
