// Lightweight in-memory KV with TTL + helpers used across the codebase.

export interface KV {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set<T = unknown>(key: string, value: T, ttlSec?: number): Promise<void>;
  delete(key: string): Promise<void>;

  // Additional helpers your code expects:
  incr(key: string, by?: number, ttlSec?: number): Promise<number>;
  scan(prefix: string): Promise<string[]>;
  resetPrefix(prefix: string): Promise<void>;
}

type Entry = { value: unknown; expiresAt?: number };

class InMemoryKV implements KV {
  private store = new Map<string, Entry>();

  private isExpired(e?: Entry): boolean {
    return !!(e && e.expiresAt && e.expiresAt <= Date.now());
  }

  private getEntry(key: string): Entry | undefined {
    const e = this.store.get(key);
    if (this.isExpired(e)) {
      this.store.delete(key);
      return undefined;
    }
    return e;
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.getEntry(key)?.value as T | undefined;
  }

  async set<T>(key: string, value: T, ttlSec?: number): Promise<void> {
    const entry: Entry = { value };
    if (ttlSec && ttlSec > 0) {
      entry.expiresAt = Date.now() + ttlSec * 1000;
    }
    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string, by = 1, ttlSec?: number): Promise<number> {
    const existing = this.getEntry(key);
    const current =
      typeof existing?.value === "number" ? (existing!.value as number) : 0;
    const next = current + by;

    const entry: Entry = { value: next };
    if (ttlSec && ttlSec > 0) {
      entry.expiresAt = Date.now() + ttlSec * 1000;
    } else if (existing?.expiresAt) {
      // preserve existing TTL if no new TTL provided
      entry.expiresAt = existing.expiresAt;
    }

    this.store.set(key, entry);
    return next;
  }

  async scan(prefix: string): Promise<string[]> {
    const out: string[] = [];
    for (const key of this.store.keys()) {
      const e = this.getEntry(key); // auto-expire
      if (!e) continue;
      if (key.startsWith(prefix)) out.push(key);
    }
    return out;
  }

  async resetPrefix(prefix: string): Promise<void> {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

export const kv: KV = new InMemoryKV();
export default kv;
