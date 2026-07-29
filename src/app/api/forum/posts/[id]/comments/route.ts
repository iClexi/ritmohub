import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createForumComment } from "@/lib/db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { createForumCommentSchema } from "@/lib/validations/workspace";

type ForumCommentRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: ForumCommentRouteProps) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  const rateLimit = consumeRateLimit({
    key: `forum:comment:${sessionPayload.session.user.id}`,
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const parsed = createForumCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Comentario invalido.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id } = await params;
    const comment = await createForumComment({
      postId: id,
      authorUserId: sessionPayload.session.user.id,
      authorName: sessionPayload.session.user.name,
      authorAvatarUrl: sessionPayload.session.user.avatarUrl,
      text: parsed.data.text,
    });

    if (!comment) {
      return NextResponse.json({ message: "Post no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ message: "Comentario publicado.", comment });
  } catch (error) {
    console.error("forum comment error", error);
    return NextResponse.json({ message: "No pudimos publicar el comentario." }, { status: 500 });
  }
}
