import { redirect } from "next/navigation";

import { getSessionFromCookie } from "@/lib/auth/session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  bio: string;
  musicianType: string;
  primaryInstrument: string;
  orientation: string;
  studies: string;
  avatarUrl: string;
  coverUrl: string;
  websiteUrl: string;
  location: string;
  socialInstagram: string;
  socialSpotify: string;
  socialYoutube: string;
  isSolo: boolean;
  stageName: string;
  genre: string;
  tagline: string;
  role: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const result = await getSessionFromCookie();

  if (!result) {
    return null;
  }

  return {
    id: result.session.user.id,
    name: result.session.user.name,
    email: result.session.user.email,
    bio: result.session.user.bio,
    musicianType: result.session.user.musicianType,
    primaryInstrument: result.session.user.primaryInstrument,
    orientation: result.session.user.orientation,
    studies: result.session.user.studies,
    avatarUrl: result.session.user.avatarUrl ?? "",
    coverUrl: result.session.user.coverUrl ?? "",
    websiteUrl: result.session.user.websiteUrl ?? "",
    location: result.session.user.location ?? "",
    socialInstagram: result.session.user.socialInstagram ?? "",
    socialSpotify: result.session.user.socialSpotify ?? "",
    socialYoutube: result.session.user.socialYoutube ?? "",
    isSolo: result.session.user.isSolo ?? false,
    stageName: result.session.user.stageName ?? "",
    genre: result.session.user.genre ?? "",
    tagline: result.session.user.tagline ?? "",
    role: result.session.user.role ?? "user",
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
