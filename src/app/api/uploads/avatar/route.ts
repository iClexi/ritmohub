import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createMediaUploadRecord } from "@/lib/db";
import { avatarUploadSchema } from "@/lib/validations/workspace";

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
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

    const stored = await createMediaUploadRecord({
      userId: sessionPayload.session.user.id,
      kind,
      mimeType,
      sizeBytes: fileEntry.size,
      data: binary,
    });

    return NextResponse.json({ url: `/api/uploads/file/${stored.id}` });
  } catch (error) {
    console.error("avatar upload error", error);
    return NextResponse.json({ message: "No se pudo subir la imagen." }, { status: 500 });
  }
}
