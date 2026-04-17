import { NextResponse } from "next/server";

import { decrementForumPostVote, incrementForumPostVote } from "@/lib/db";
import { forumVoteSchema } from "@/lib/validations/workspace";

type VoteRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: VoteRouteProps) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = forumVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dirección de voto inválida." }, { status: 400 });
    }
    const direction = parsed.data.direction;

    const post = direction === "down"
      ? await decrementForumPostVote(id)
      : await incrementForumPostVote(id);

    if (!post) {
      return NextResponse.json({ message: "Post no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ message: "Voto registrado.", post });
  } catch (error) {
    console.error("forum vote error", error);
    return NextResponse.json({ message: "No pudimos registrar el voto." }, { status: 500 });
  }
}
