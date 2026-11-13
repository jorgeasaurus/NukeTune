import assert from "node:assert/strict";
import test from "node:test";

import {
  getBulkToggleIds,
  groupBySeverity,
  matchesCategoryQuery,
  summarizeSelection,
} from "../src/components/categories/categoryFilter.js";
import {
  getLogWindow,
  isScrolledToBottom,
} from "../src/components/deletion/logWindow.js";
import {
  getRunSegments,
  summarizeRunCategories,
} from "../src/components/deletion/runSummary.js";

function cat(id, dangerLevel, { category = {}, ...rest } = {}) {
  return {
    category: {
      id,
      name: id.replace(/-/g, " "),
      description: `${id} description`,
      dangerLevel,
      ...category,
    },
    selected: false,
    loading: false,
    objects: [],
    ...rest,
  };
}

test("matchesCategoryQuery matches every term case-insensitively", () => {
  const c = cat("powershell-scripts", "high", {
    category: { name: "PowerShell Scripts", description: "Device management scripts" },
  });
  assert.equal(matchesCategoryQuery(c, ""), true);
  assert.equal(matchesCategoryQuery(c, "   "), true);
  assert.equal(matchesCategoryQuery(c, "POWERSHELL"), true);
  assert.equal(matchesCategoryQuery(c, "scripts device"), true);
  assert.equal(matchesCategoryQuery(c, "high"), true);
  assert.equal(matchesCategoryQuery(c, "scripts macos"), false);
});

test("groupBySeverity returns every level in danger order, keeping item order", () => {
  const groups = groupBySeverity([
    cat("a", "low"),
    cat("b", "critical"),
    cat("c", "high"),
    cat("d", "critical"),
  ]);
  assert.deepEqual(
    groups.map((g) => [g.level, g.items.map((i) => i.category.id)]),
    [
      ["critical", ["b", "d"]],
      ["high", ["c"]],
      ["medium", []],
      ["low", ["a"]],
    ],
  );
});

test("getBulkToggleIds flips only what differs and skips unsupported categories", () => {
  const cats = [
    cat("a", "high", { selected: true }),
    cat("b", "high"),
    cat("c", "high", { category: { requiresAppPermissions: true } }),
  ];
  assert.deepEqual(getBulkToggleIds(cats, true), ["b"]);
  assert.deepEqual(getBulkToggleIds(cats, false), ["a"]);
});

test("summarizeSelection counts selected categories, critical ones and selected objects", () => {
  const summary = summarizeSelection([
    cat("a", "critical", {
      selected: true,
      objects: [{ id: "1", selected: true }, { id: "2", selected: false }],
    }),
    cat("b", "high", { selected: true, loading: true, objects: [{ id: "3", selected: true }] }),
    cat("c", "critical", { objects: [{ id: "4", selected: true }] }),
    cat("d", "critical", { selected: true, category: { requiresAppPermissions: true } }),
  ]);
  assert.deepEqual(summary, { selectedCount: 2, criticalCount: 1, objectCount: 2, loadingCount: 1 });
});

function entry(i, status) {
  return { timestamp: new Date(0), categoryId: "c", categoryName: "C", objectId: `o${i}`, objectName: `O${i}`, status };
}

test("getLogWindow keeps the tail with stable full-log indices as keys", () => {
  const log = Array.from({ length: 10 }, (_, i) => entry(i, i % 3 === 0 ? "error" : "success"));
  const all = getLogWindow(log, { limit: 4 });
  assert.deepEqual(all.rows.map((r) => r.key), [6, 7, 8, 9]);
  assert.equal(all.matchingCount, 10);
  assert.equal(all.errorCount, 4);

  const errors = getLogWindow(log, { errorsOnly: true, limit: 3 });
  assert.deepEqual(errors.rows.map((r) => r.key), [3, 6, 9]);
  assert.equal(errors.matchingCount, 4);
  assert.ok(errors.rows.every((r) => r.entry === log[r.key]));
});

test("getLogWindow handles an empty log", () => {
  assert.deepEqual(getLogWindow([]), { rows: [], matchingCount: 0, errorCount: 0 });
});

test("isScrolledToBottom tolerates a small threshold", () => {
  assert.equal(isScrolledToBottom({ scrollTop: 800, scrollHeight: 1000, clientHeight: 200 }), true);
  assert.equal(isScrolledToBottom({ scrollTop: 780, scrollHeight: 1000, clientHeight: 200 }), true);
  assert.equal(isScrolledToBottom({ scrollTop: 500, scrollHeight: 1000, clientHeight: 200 }), false);
});

test("getRunSegments splits the bar and never exceeds 100%", () => {
  assert.deepEqual(
    getRunSegments({ runTotal: 10, deletedCount: 5, failedCount: 2, skippedCount: 1 }),
    { deleted: 50, failed: 20, skipped: 10 },
  );
  assert.deepEqual(
    getRunSegments({ runTotal: 0, deletedCount: 0, failedCount: 0, skippedCount: 0 }),
    { deleted: 0, failed: 0, skipped: 0 },
  );
  const over = getRunSegments({ runTotal: 2, deletedCount: 2, failedCount: 1, skippedCount: 1 });
  assert.equal(over.deleted + over.failed + over.skipped, 100);
});

test("summarizeRunCategories counts finished and failing categories", () => {
  assert.deepEqual(
    summarizeRunCategories([
      { runTotal: 2, deletedCount: 2, failedCount: 0, skippedCount: 0 },
      { runTotal: 3, deletedCount: 1, failedCount: 1, skippedCount: 1 },
      { runTotal: 5, deletedCount: 1, failedCount: 1, skippedCount: 0 },
    ]),
    { total: 3, finished: 2, withFailures: 2 },
  );
});
