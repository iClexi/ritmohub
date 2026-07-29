import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { setForumPostVote } from "@/lib/db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { forumVoteSchema } from "@/lib/validations/workspace";

type VoteRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: VoteRouteProps) {
  try {
    const sessionPayload = await getSessionFromCookie();
    if (!sessionPayload) {
      return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
    }

    const rateLimit = consumeRateLimit({
      key: `forum:vote:${sessionPayload.session.user.id}`,
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = forumVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dirección de voto inválida." }, { status: 400 });
    }
    const direction = parsed.data.direction;

    const post = await setForumPostVote({
      postId: id,
      userId: sessionPayload.session.user.id,
      direction,
    });

    if (!post) {
      return NextResponse.json({ message: "Post no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ message: "Voto registrado.", post });
  } catch (error) {
    console.error("forum vote error", error);
    return NextResponse.json({ message: "No pudimos registrar el voto." }, { status: 500 });
  }
}
