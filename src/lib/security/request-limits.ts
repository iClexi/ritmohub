export function requestContentLengthExceeds(request: Request, maxBytes: number): boolean {
  const raw = request.headers.get("content-length")?.trim();
  if (!raw) {
    return false;
  }

  if (!/^\d+$/.test(raw)) {
    return true;
  }

  const contentLength = Number(raw);
  return !Number.isSafeInteger(contentLength) || contentLength > maxBytes;
}

export async function parseJsonBody(request: Request) {
  try {
    return {
      ok: true as const,
      data: await request.json() as unknown,
    };
  } catch {
    return {
      ok: false as const,
    };
  }
}
