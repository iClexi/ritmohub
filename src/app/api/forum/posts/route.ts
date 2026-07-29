import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createForumPost, listForumPostsWithComments } from "@/lib/db";
import { redactForumPostsForAnonymous } from "@/lib/forum-privacy";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { createForumPostSchema } from "@/lib/validations/workspace";

export async function GET() {
  const sessionPayload = await getSessionFromCookie();
  const posts = await listForumPostsWithComments();
  const visiblePosts = sessionPayload
    ? posts
    : redactForumPostsForAnonymous(posts);

  return NextResponse.json({ posts: visiblePosts });
}

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  const rateLimit = consumeRateLimit({
    key: `forum:post:${sessionPayload.session.user.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
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
