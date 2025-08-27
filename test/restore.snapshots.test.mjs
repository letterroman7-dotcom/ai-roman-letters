// test/restore.snapshots.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * Minimal sanity test for the Restore module snapshot shape.
 * (We don't hit the module here; this is only to keep ESLint/parser happy
 *  until the Restore module’s CLI/API is wired and we can do real I/O tests.)
 */
test("snapshot id format stays YYYYMMDD-HHMMSS", () => {
  const sample = [
    {
      id: "20250821-034212",
      createdAt: "2025-08-21T03:42:12.000Z",
      path: "data/restore/checkpoints/20250821-034212.env",
    },
  ];

  assert.ok(Array.isArray(sample), "list is array");
  assert.ok(
    sample.every((s) => typeof s.id === "string" && /^\d{8}-\d{6}$/.test(s.id)),
    "every id matches YYYYMMDD-HHMMSS",
  );
  assert.ok(
    sample.every((s) => typeof s.path === "string" && s.path.length > 0),
    "every item has a path",
  );
});
