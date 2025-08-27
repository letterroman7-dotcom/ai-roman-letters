// Validates structure & sane values of data/antinuke-config.json
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const cfgPath = path.join(process.cwd(), "data", "antinuke-config.json");

function isPosInt(n) {
  return Number.isInteger(n) && n >= 0;
}

test("antinuke config exists and is valid JSON", () => {
  assert.ok(fs.existsSync(cfgPath), `Missing config: ${cfgPath}`);
  const raw = fs.readFileSync(cfgPath, "utf8");
  assert.doesNotThrow(() => JSON.parse(raw), "Config should be valid JSON");
});

test("antinuke config has required fields and sane thresholds", () => {
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));

  assert.equal(typeof cfg.enabled, "boolean", "enabled must be boolean");
  assert.ok(
    Number.isFinite(cfg.windowMs) && cfg.windowMs > 0,
    "windowMs must be > 0",
  );

  const required = [
    "bans",
    "kicks",
    "channelCreates",
    "channelDeletes",
    "roleCreates",
    "roleDeletes",
    "webhookCreates",
    "webhookDeletes",
    "emojiCreates",
    "emojiDeletes",
  ];
  assert.equal(typeof cfg.thresholds, "object", "thresholds must be object");
  for (const k of required) {
    assert.ok(k in cfg.thresholds, `thresholds.${k} missing`);
    assert.ok(
      isPosInt(cfg.thresholds[k]),
      `thresholds.${k} must be a positive integer`,
    );
  }

  const allowedActions = new Set([
    "quarantine",
    "ban",
    "timeout",
    "mute",
    "warn",
    "delete",
    "log",
  ]);
  assert.equal(
    typeof cfg.actionOnTrip,
    "string",
    "actionOnTrip must be string",
  );
  assert.ok(
    allowedActions.has(cfg.actionOnTrip),
    "actionOnTrip is not an allowed action",
  );

  assert.ok(
    isPosInt(cfg.timeoutSeconds),
    "timeoutSeconds must be a non-negative integer",
  );
});
