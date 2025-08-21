type Job<T> = {
  run: () => Promise<T>;
  name?: string;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
};

export interface QueueOptions {
  concurrency?: number; // parallel workers
  rateLimit?: { max: number; intervalMs: number }; // X jobs per interval
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

  const q: Job<unknown>[] = [];
  let running = 0;

  // sliding window timestamps of "started" jobs
  const starts: number[] = [];

  let resolveIdle: (() => void) | null = null;
  const idlePromise = () =>
    new Promise<void>((res) => {
      if (running === 0 && q.length === 0) return res();
      resolveIdle = res;
    });

  function maybeResolveIdle() {
    if (running === 0 && q.length === 0 && resolveIdle) {
      const r = resolveIdle;
      resolveIdle = null;
      r();
    }
  }

  function haveToken(now: number): boolean {
    const cutoff = now - rate.intervalMs;
    while (starts.length && starts[0] < cutoff) starts.shift();
    return starts.length < rate.max;
  }

  function tryStart() {
    if (running >= concurrency) return;
    if (q.length === 0) return;

    const now = Date.now();
    if (!haveToken(now)) {
      const wait = Math.max(0, (starts[0] + rate.intervalMs) - now);
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
      q.push({ run: fn, name, resolve, reject });
      tryStart();
    });
  }

  return {
    add,
    size: () => q.length,
    pending: () => running,
    idle: idlePromise
  };
}
