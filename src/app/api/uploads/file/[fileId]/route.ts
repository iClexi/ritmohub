import { NextResponse } from "next/server";

import { getMediaUploadById } from "@/lib/db";

type Props = { params: Promise<{ fileId: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { fileId } = await params;

  if (!fileId || fileId.length < 8 || fileId.length > 80) {
    return NextResponse.json({ message: "Archivo no encontrado." }, { status: 404 });
  }

  const media = await getMediaUploadById(fileId);
  if (!media) {
    return NextResponse.json({ message: "Archivo no encontrado." }, { status: 404 });
  }

  const binary = new Uint8Array(media.data);

  return new NextResponse(binary, {
    status: 200,
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(media.sizeBytes),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
