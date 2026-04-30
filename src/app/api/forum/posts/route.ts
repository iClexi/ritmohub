import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createForumPost, listForumPostsWithComments } from "@/lib/db";
import { createForumPostSchema } from "@/lib/validations/workspace";

export async function GET() {
  return NextResponse.json({ posts: await listForumPostsWithComments() });
}

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createForumPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa los campos del post.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const post = await createForumPost({
      authorUserId: sessionPayload.session.user.id,
      authorName: sessionPayload.session.user.name,
      authorAvatarUrl: sessionPayload.session.user.avatarUrl,
      title: parsed.data.title,
      body: parsed.data.body,
      category: parsed.data.category,
      mediaType: parsed.data.mediaType,
      mediaUrl: parsed.data.mediaUrl ?? "",
      linkUrl: parsed.data.linkUrl ?? "",
    });

    return NextResponse.json({ message: "Post publicado.", post });
  } catch (error) {
    console.error("forum post error", error);
    return NextResponse.json({ message: "No pudimos publicar el post." }, { status: 500 });
  }
}
