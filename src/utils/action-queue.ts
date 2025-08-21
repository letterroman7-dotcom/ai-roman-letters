type Job = {
  run: () => Promise<unknown>;
  // With exactOptionalPropertyTypes, allow 'undefined' explicitly if present:
  name?: string | undefined;
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
};

export interface QueueOptions {
  concurrency?: number;
  rateLimit?: { max: number; intervalMs: number };
}

export interface Queue {
  add<T>(fn: () => Promise<T>, name?: string): Promise<T>;
  size(): number;
  pending(): number;
  idle(): Promise<void>;
}

export function createQueue(opts: QueueOptions = {}): Queue {
  const concurrency = Math.max(1, opts.concurrency ?? 4);
  const rate = opts.rateLimit ?? { max: 20, intervalMs: 1000 };

  const q: Job[] = [];
  let running = 0;

  const starts: number[] = [];
  let resolveIdle: (() => void) | null = null;

  function idle(): Promise<void> {
    if (running === 0 && q.length === 0) return Promise.resolve();
    return new Promise<void>((res) => (resolveIdle = res));
  }

  function maybeResolveIdle() {
    if (running === 0 && q.length === 0 && resolveIdle) {
      const r = resolveIdle;
      resolveIdle = null;
      r();
    }
  }

  function haveToken(now: number): boolean {
    const cutoff = now - rate.intervalMs;
    while (starts.length > 0 && (starts[0] ?? 0) < cutoff) starts.shift();
    return starts.length < rate.max;
  }

  function tryStart() {
    if (running >= concurrency) return;
    if (q.length === 0) return;

    const now = Date.now();
    if (!haveToken(now)) {
      const first = starts[0] ?? now;
      const wait = Math.max(0, first + rate.intervalMs - now);
      setTimeout(tryStart, wait + 1);
      return;
    }

    const job = q.shift()!;
    running++;
    starts.push(now);

    job
      .run()
      .then((v) => job.resolve(v))
      .catch((e) => job.reject(e))
      .finally(() => {
        running--;
        maybeResolveIdle();
        setImmediate(tryStart);
      });

    setImmediate(tryStart);
  }

  function add<T>(fn: () => Promise<T>, name?: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const base: Omit<Job, "name"> = {
        run: async () => fn(),
        resolve: (v) => resolve(v as T),
        reject
      };
      // Only include 'name' if defined to satisfy exactOptionalPropertyTypes
      const job: Job = name ? { ...base, name } : base as Job;
      q.push(job);
      tryStart();
    });
  }

  return {
    add,
    size: () => q.length,
    pending: () => running,
    idle
  };
}
