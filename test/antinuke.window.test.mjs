// test/antinuke.window.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const distPath = path.join(process.cwd(), "dist", "antinuke", "window.js");
assert.ok(fs.existsSync(distPath), `Missing build artifact: ${distPath}`);
const mod = await import(pathToFileURL(distPath).href);

test("sliding window: trips at or above threshold within window", () => {
  const { SlidingWindowCounter } = mod;
  const counter = new SlidingWindowCounter({
    windowMs: 1000,
    thresholds: { channelCreates: 3 },
  });
  const actor = "user:42";
  const t0 = 1_000_000;
  assert.equal(
    counter.recordAndEvaluate("channelCreates", actor, t0).length,
    0,
  );
  assert.equal(
    counter.recordAndEvaluate("channelCreates", actor, t0 + 100).length,
    0,
  );
  const trips = counter.recordAndEvaluate("channelCreates", actor, t0 + 200);
  assert.equal(trips.length, 1);
  assert.equal(trips[0].eventType, "channelCreates");
  assert.equal(trips[0].count, 3);
  assert.equal(trips[0].threshold, 3);
});

test("sliding window: events outside window are pruned", () => {
  const { SlidingWindowCounter } = mod;
  const counter = new SlidingWindowCounter({
    windowMs: 500,
    thresholds: { bans: 2 },
  });
  const actor = "user:77";
  const t0 = 2_000_000;
  counter.record("bans", actor, t0);
  counter.record("bans", actor, t0 + 100);
  const trips = counter.recordAndEvaluate("bans", actor, t0 + 600);
  assert.equal(trips.length, 1);
  assert.equal(trips[0].count, 2);
});

test("evaluate() aggregates per-event independently", () => {
  const { SlidingWindowCounter } = mod;
  const counter = new SlidingWindowCounter({
    windowMs: 1000,
    thresholds: { roleCreates: 2, roleDeletes: 2 },
  });
  const actor = "bot:9";
  const now = 3_000_000;
  counter.record("roleCreates", actor, now);
  counter.record("roleCreates", actor, now + 10);
  counter.record("roleDeletes", actor, now);
  const trips = counter.evaluate(actor, now + 20);
  assert.equal(trips.length, 1);
  assert.equal(trips[0].eventType, "roleCreates");
  assert.equal(trips[0].count, 2);
  assert.equal(trips[0].threshold, 2);
});

test("config validation: rejects invalid shapes", () => {
  const { validateConfig } = mod;
  assert.throws(() => validateConfig({}), /Required/);
  assert.throws(
    () =>
      validateConfig({
        enabled: true,
        windowMs: 0,
        thresholds: {},
        actionOnTrip: "ban",
        timeoutSeconds: 0,
      }),
    /greater than 0|positive/,
  );
  assert.throws(
    () =>
      validateConfig({
        enabled: true,
        windowMs: 1000,
        thresholds: { foo: -1 },
        actionOnTrip: "ban",
        timeoutSeconds: 0,
      }),
    /nonnegative/,
  );
});

test("factory: makeCounterFromConfig yields working counter", () => {
  const { makeCounterFromConfig } = mod;
  const cfg = {
    enabled: true,
    windowMs: 1000,
    thresholds: { webhookCreates: 2 },
    actionOnTrip: "quarantine",
    timeoutSeconds: 30,
  };
  const c = makeCounterFromConfig(cfg);
  const actor = "user:x";
  const trips0 = c.recordAndEvaluate("webhookCreates", actor, 10);
  assert.equal(trips0.length, 0);
  const trips1 = c.recordAndEvaluate("webhookCreates", actor, 20);
  assert.equal(trips1.length, 1);
  assert.equal(trips1[0].eventType, "webhookCreates");
});
