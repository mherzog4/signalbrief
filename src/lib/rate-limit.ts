export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type Bucket = { count: number; resetAt: number };

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  consume(key: string, limit: number, windowMs = 60_000, now = Date.now()): RateLimitResult {
    const current = this.buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;

    bucket.count += 1;
    this.buckets.set(key, bucket);

    if (this.buckets.size > 1_000) {
      for (const [bucketKey, value] of this.buckets) {
        if (value.resetAt <= now) this.buckets.delete(bucketKey);
      }
    }

    return {
      allowed: bucket.count <= limit,
      limit,
      remaining: Math.max(0, limit - bucket.count),
      resetAt: bucket.resetAt,
    };
  }
}

export const demoRateLimiter = new FixedWindowRateLimiter();

export function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-vercel-forwarded-for")
    ?? request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

export function rateLimitHeaders(result: RateLimitResult) {
  const resetSeconds = Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1_000));
  return {
    "ratelimit-limit": String(result.limit),
    "ratelimit-remaining": String(result.remaining),
    "ratelimit-reset": String(resetSeconds),
  };
}
