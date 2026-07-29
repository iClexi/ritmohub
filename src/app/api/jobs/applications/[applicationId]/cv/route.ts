import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { getJobApplicationCvForViewer, isAdminUserId } from "@/lib/db";

type Props = {
  params: Promise<{ applicationId: string }>;
};

const EXTENSION_BY_MIME = new Map([
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
]);

export async function GET(_request: Request, { params }: Props) {
  const sessionPayload = await getSessionFromCookie();
  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  const { applicationId } = await params;
  if (!applicationId || applicationId.length > 80) {
    return NextResponse.json({ message: "CV no encontrado." }, { status: 404 });
  }

  const viewerUserId = sessionPayload.session.user.id;
  const media = await getJobApplicationCvForViewer({
    applicationId,
    viewerUserId,
    viewerIsAdmin: await isAdminUserId(viewerUserId),
  });
  if (!media) {
    return NextResponse.json({ message: "CV no encontrado." }, { status: 404 });
  }

  const mimeType = media.mimeType.toLowerCase();
  const extension = EXTENSION_BY_MIME.get(mimeType);
  if (!extension) {
    return NextResponse.json({ message: "CV no encontrado." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(media.data), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(media.sizeBytes),
      "Content-Disposition": `attachment; filename="ritmohub-cv.${extension}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; object-src 'none'; sandbox",
    },
  });
}
