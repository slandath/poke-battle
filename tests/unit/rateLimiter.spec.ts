import { afterEach, describe, expect, it, vi } from "vitest";

import { RATE_LIMIT, RateLimiter, RATE_LIMIT_WINDOW_MS } from "~/utils/rateLimiter";

const START = 1_000_000;

describe("RateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows 60 requests in a window and blocks the next one", () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < RATE_LIMIT; i++) {
      expect(limiter.tryRequest(START + i)).toBe(true);
    }

    expect(limiter.status.value).toMatchObject({ remaining: 0, limited: true });
    expect(limiter.tryRequest(START + RATE_LIMIT)).toBe(false);
  });

  it("frees a slot as the oldest request ages out", () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < RATE_LIMIT; i++) limiter.tryRequest(START + i);

    expect(limiter.tryRequest(START + RATE_LIMIT_WINDOW_MS - 1)).toBe(false);
    expect(limiter.tryRequest(START + RATE_LIMIT_WINDOW_MS)).toBe(true);
    expect(limiter.status.value.remaining).toBe(0);
  });

  it("warns below ten remaining without being limited", () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < RATE_LIMIT - 9; i++) limiter.tryRequest(START + i);

    expect(limiter.status.value).toMatchObject({ remaining: 9, warning: true, limited: false });
  });

  it("reports the wait until the window resets", () => {
    const limiter = new RateLimiter();
    limiter.tryRequest(START);

    expect(limiter.status.value.resetInSeconds).toBe(RATE_LIMIT_WINDOW_MS / 1000);
  });

  it("can be reset", () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < RATE_LIMIT; i++) limiter.tryRequest(START + i);
    limiter.reset();

    expect(limiter.status.value.remaining).toBe(RATE_LIMIT);
    expect(limiter.tryRequest(START)).toBe(true);
  });

  it("refreshes the countdown while ticking", () => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    const limiter = new RateLimiter();
    limiter.tryRequest();
    limiter.startTicking();
    expect(limiter.status.value.resetInSeconds).toBe(60);

    vi.advanceTimersByTime(30_000);
    expect(limiter.status.value.resetInSeconds).toBe(30);

    limiter.stopTicking();
  });
});
