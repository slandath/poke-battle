import { computed, ref, type ComputedRef } from "vue";

/** PokeAPI allows ~100 anonymous requests/minute; leave a 40% safety buffer. */
export const RATE_LIMIT = 60;
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_WARNING_THRESHOLD = 10;

export interface RateLimitStatus {
  remaining: number;
  resetInSeconds: number;
  limited: boolean;
  warning: boolean;
}

/** Rolling-window limiter with a reactive status for the UI. */
export class RateLimiter {
  private timestamps: number[] = [];
  private now = ref(Date.now());
  private ticker: ReturnType<typeof setInterval> | undefined;

  readonly status: ComputedRef<RateLimitStatus> = computed(() => {
    const current = this.now.value;
    const active = this.timestamps.filter((time) => current - time < RATE_LIMIT_WINDOW_MS);
    const remaining = Math.max(0, RATE_LIMIT - active.length);
    const oldest = active[0];
    const resetInSeconds =
      remaining === RATE_LIMIT || oldest === undefined
        ? 0
        : Math.max(0, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - current) / 1000));

    return {
      remaining,
      resetInSeconds,
      limited: remaining === 0,
      warning: remaining > 0 && remaining < RATE_LIMIT_WARNING_THRESHOLD,
    };
  });

  /** Records a request if one is available in the current window. */
  tryRequest(at: number = Date.now()): boolean {
    this.prune(at);
    this.now.value = at;
    if (this.timestamps.length >= RATE_LIMIT) return false;
    this.timestamps.push(at);
    return true;
  }

  reset(): void {
    this.timestamps = [];
    this.now.value = Date.now();
  }

  /** Keeps the countdown fresh while a UI is mounted. Safe to call repeatedly. */
  startTicking(): void {
    if (this.ticker) return;
    this.ticker = setInterval(() => {
      this.now.value = Date.now();
    }, 1000);
  }

  stopTicking(): void {
    if (!this.ticker) return;
    clearInterval(this.ticker);
    this.ticker = undefined;
  }

  private prune(at: number): void {
    while (this.timestamps.length > 0 && at - this.timestamps[0]! >= RATE_LIMIT_WINDOW_MS) {
      this.timestamps.shift();
    }
  }
}

/** Single limiter for all PokeAPI traffic in this browser tab. */
export const pokeApiLimiter = new RateLimiter();
