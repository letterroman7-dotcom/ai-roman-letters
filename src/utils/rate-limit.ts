// src/utils/rate-limit.ts
type Bucket = { tokens: number; last: number };

export class TokenBucket {
  private buckets = new Map<string, Bucket>();

  constructor(
    private capacity: number,
    private refillPerSec: number,
  ) {}

  take(key: string, tokens = 1): boolean {
    const now = Date.now() / 1000;
    let b = this.buckets.get(key);
    if (!b) {
      b = { tokens: this.capacity, last: now };
      this.buckets.set(key, b);
    }
    // refill
    const elapsed = Math.max(0, now - b.last);
    b.tokens = Math.min(this.capacity, b.tokens + elapsed * this.refillPerSec);
    b.last = now;

    if (b.tokens < tokens) return false;
    b.tokens -= tokens;
    return true;
  }

  inspect(key: string): { tokens: number; capacity: number } {
    const b = this.buckets.get(key) ?? {
      tokens: this.capacity,
      last: Date.now() / 1000,
    };
    return { tokens: b.tokens, capacity: this.capacity };
  }
}
