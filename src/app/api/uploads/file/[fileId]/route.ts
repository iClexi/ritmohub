import { NextResponse } from "next/server";

import { getMediaUploadById } from "@/lib/db";

type Props = { params: Promise<{ fileId: string }> };

const INLINE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
]);

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
  const mimeType = media.mimeType.toLowerCase();
  const contentDisposition = INLINE_MIME_TYPES.has(mimeType) ? "inline" : "attachment";

  return new NextResponse(binary, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(media.sizeBytes),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; script-src 'none'; sandbox",
      "Content-Disposition": contentDisposition,
    },
  });
}
