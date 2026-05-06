type RateLimitBucket = {
  count: number;
  windowStartAt: number;
  blockedUntil: number;
};

type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
  blockMs?: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

type RateLimitGlobalState = typeof globalThis & {
  __ritmohubRateLimitStore?: Map<string, RateLimitBucket>;
  __ritmohubRateLimitOps?: number;
};

const globalState = globalThis as RateLimitGlobalState;
const rateLimitStore = globalState.__ritmohubRateLimitStore ?? new Map<string, RateLimitBucket>();
globalState.__ritmohubRateLimitStore = rateLimitStore;
globalState.__ritmohubRateLimitOps ??= 0;

function cleanupRateLimitStore(now: number, windowMs: number) {
  globalState.__ritmohubRateLimitOps = (globalState.__ritmohubRateLimitOps ?? 0) + 1;

  if ((globalState.__ritmohubRateLimitOps ?? 0) % 200 !== 0) {
    return;
  }

  for (const [key, bucket] of rateLimitStore.entries()) {
    const isWindowExpired = now - bucket.windowStartAt > windowMs * 2;
    const isUnblocked = bucket.blockedUntil <= now;

    if (isWindowExpired && isUnblocked) {
      rateLimitStore.delete(key);
    }
  }
}

export function consumeRateLimit(input: RateLimitInput): RateLimitResult {
  if (input.limit < 1) {
    throw new Error("rate limit invalido: limit debe ser >= 1");
  }

  if (input.windowMs < 1000) {
    throw new Error("rate limit invalido: windowMs debe ser >= 1000");
  }

  const now = Date.now();
  cleanupRateLimitStore(now, input.windowMs);

  let bucket = rateLimitStore.get(input.key);

  if (!bucket || now - bucket.windowStartAt >= input.windowMs) {
    bucket = {
      count: 0,
      windowStartAt: now,
      blockedUntil: 0,
    };
  }

  if (bucket.blockedUntil > now) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.blockedUntil - now) / 1000));

    rateLimitStore.set(input.key, bucket);
    return {
      allowed: false,
      retryAfterSeconds,
      remaining: 0,
    };
  }

  bucket.count += 1;

  if (bucket.count > input.limit) {
    const blockMs = input.blockMs ?? input.windowMs;
    bucket.blockedUntil = now + blockMs;
    rateLimitStore.set(input.key, bucket);

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(blockMs / 1000)),
      remaining: 0,
    };
  }

  rateLimitStore.set(input.key, bucket);

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, input.limit - bucket.count),
  };
}

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) {
    return cfIp;
  }

  const xForwardedFor = request.headers.get("x-forwarded-for")?.trim();
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const xRealIp = request.headers.get("x-real-ip")?.trim();
  if (xRealIp) {
    return xRealIp;
  }

  return "unknown";
}
