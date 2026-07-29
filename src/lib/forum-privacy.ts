import type { ForumPostRecord } from "@/lib/db";

const PUBLIC_BODY_PLACEHOLDER = "Contenido disponible al iniciar sesión.";

export function redactForumPostsForAnonymous(
  posts: ForumPostRecord[],
): ForumPostRecord[] {
  return posts.map((post) => ({
    ...post,
    body: post.body ? PUBLIC_BODY_PLACEHOLDER : "",
    linkUrl: "",
    mediaType: post.mediaType === "image" ? "image" : "none",
    mediaUrl: post.mediaType === "image" ? post.mediaUrl : "",
    comments: post.comments.map((comment) => ({
      ...comment,
      text: "",
    })),
  }));
}
