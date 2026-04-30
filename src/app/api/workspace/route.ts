import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import {
  listChatThreadsWithMessagesByUser,
  listCoursePurchasesByUser,
  listCourses,
  listForumPostsWithComments,
  listJobApplicationsByUser,
  listJobs,
  listPublicConcerts,
} from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionsParam = searchParams.get("sections");
    const requested = sectionsParam ? new Set(sectionsParam.split(",")) : null;

    const wants = (key: string) => !requested || requested.has(key);

    const sessionPayload = await getSessionFromCookie();
    const userId = sessionPayload?.session.user.id ?? null;

    const [concerts, forumPosts, jobs, courses, coursePurchases, jobApplications, chatThreads] =
      await Promise.all([
        wants("band") || wants("shows")
          ? listPublicConcerts(200)
          : Promise.resolve(null),
        wants("communities") ? listForumPostsWithComments() : Promise.resolve(null),
        wants("jobs") ? listJobs() : Promise.resolve(null),
        wants("courses") ? listCourses() : Promise.resolve(null),
        wants("courses") && userId ? listCoursePurchasesByUser(userId) : Promise.resolve(null),
        wants("jobs") && userId ? listJobApplicationsByUser(userId) : Promise.resolve(null),
        wants("chats") && userId ? listChatThreadsWithMessagesByUser(userId) : Promise.resolve(null),
      ]);

    return NextResponse.json({
      isLoggedIn: !!sessionPayload,
      concerts,
      forumPosts,
      jobs,
      courses,
      coursePurchases,
      jobApplications,
      chatThreads,
    });
  } catch (error) {
    console.error("workspace fetch error", error);
    return NextResponse.json({ message: "No pudimos cargar el workspace." }, { status: 500 });
  }
}
