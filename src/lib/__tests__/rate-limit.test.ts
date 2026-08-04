import { describe, expect, it } from "vitest";

import { FixedWindowRateLimiter } from "@/lib/rate-limit";

describe("fixed-window demo rate limiting", () => {
  it("bounds a client and resets after the window", () => {
    const limiter = new FixedWindowRateLimiter();
    expect(limiter.consume("client", 2, 1_000, 0)).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.consume("client", 2, 1_000, 100)).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.consume("client", 2, 1_000, 200)).toMatchObject({ allowed: false, remaining: 0 });
    expect(limiter.consume("client", 2, 1_000, 1_000)).toMatchObject({ allowed: true, remaining: 1 });
  });

  it("isolates separate clients", () => {
    const limiter = new FixedWindowRateLimiter();
    expect(limiter.consume("a", 1, 1_000, 0).allowed).toBe(true);
    expect(limiter.consume("a", 1, 1_000, 1).allowed).toBe(false);
    expect(limiter.consume("b", 1, 1_000, 1).allowed).toBe(true);
  });
});
