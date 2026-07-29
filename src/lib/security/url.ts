const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const INTERNAL_UPLOAD_PATH = /^\/api\/uploads\/file\/[A-Za-z0-9-]{8,80}$/;
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

type WebUrlOptions = {
  httpsOnly?: boolean;
};

export function isSafeWebUrl(value: string, options: WebUrlOptions = {}): boolean {
  const candidate = value.trim();
  if (!candidate || CONTROL_CHARACTERS.test(candidate)) {
    return false;
  }

  try {
    const url = new URL(candidate);
    const allowedProtocol = options.httpsOnly
      ? url.protocol === "https:"
      : url.protocol === "https:" || url.protocol === "http:";

    return (
      allowedProtocol &&
      Boolean(url.hostname) &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
}

export function isSafeHttpsUrl(value: string): boolean {
  return isSafeWebUrl(value, { httpsOnly: true });
}

export function isInternalUploadPath(value: string): boolean {
  return INTERNAL_UPLOAD_PATH.test(value.trim());
}

export function isSafeStoredImageUrl(value: string): boolean {
  return isInternalUploadPath(value) || isSafeHttpsUrl(value);
}

export function getSafeMediaSource(value: string | null | undefined): string | undefined {
  const candidate = value?.trim() ?? "";
  if (
    !candidate ||
    CONTROL_CHARACTERS.test(candidate) ||
    candidate.startsWith("//")
  ) {
    return undefined;
  }

  if (candidate.startsWith("/")) {
    return candidate;
  }

  return isSafeHttpsUrl(candidate) ? new URL(candidate).toString() : undefined;
}

export function getSafeExternalHref(value: string | null | undefined): string | undefined {
  if (!value || !isSafeWebUrl(value)) {
    return undefined;
  }

  return new URL(value.trim()).toString();
}

export function getYouTubeVideoId(value: string): string | null {
  if (!isSafeHttpsUrl(value)) {
    return null;
  }

  const url = new URL(value);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

  if (hostname === "youtu.be") {
    const videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return YOUTUBE_VIDEO_ID.test(videoId) ? videoId : null;
  }

  if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    if (url.pathname === "/watch") {
      const videoId = url.searchParams.get("v") ?? "";
      return YOUTUBE_VIDEO_ID.test(videoId) ? videoId : null;
    }

    const [kind, videoId] = url.pathname.split("/").filter(Boolean);
    return ["embed", "shorts", "live"].includes(kind ?? "") && YOUTUBE_VIDEO_ID.test(videoId ?? "")
      ? videoId ?? null
      : null;
  }

  if (hostname === "youtube-nocookie.com") {
    const [kind, videoId] = url.pathname.split("/").filter(Boolean);
    return kind === "embed" && YOUTUBE_VIDEO_ID.test(videoId ?? "") ? videoId ?? null : null;
  }

  return null;
}

export function isSafeYouTubeVideoUrl(value: string): boolean {
  return getYouTubeVideoId(value) !== null;
}
