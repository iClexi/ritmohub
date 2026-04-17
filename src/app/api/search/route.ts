import { NextRequest, NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { searchUsers, searchBands, searchForumPosts } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookie();

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ users: [], bands: [], posts: [] });
  }

  const excludeUserId = session?.session.user.id ?? "";

  const [users, bands, posts] = await Promise.all([
    searchUsers(q, excludeUserId, 5),
    searchBands(q, 5),
    searchForumPosts(q, 5),
  ]);

  return NextResponse.json({ users, bands, posts });
}
