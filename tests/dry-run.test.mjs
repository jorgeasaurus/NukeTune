import assert from "node:assert/strict";
import test from "node:test";

import {
  DRY_RUN_MESSAGE,
  resolveDeleteFn,
  runCategoryDeletion,
  simulateDelete,
} from "../src/lib/intune/deletionPipeline.js";
import {
  applyDeletionEntry,
  beginRun,
  buildDeletionPlan,
  computeDeletionStats,
} from "../src/utils/deletionRun.js";
import { exportLogToCsv } from "../src/utils/csv.js";

const category = {
  id: "device-configurations",
  name: "Device Configurations",
  description: "",
  dangerLevel: "high",
  listEndpoint: "/deviceManagement/deviceConfigurations",
  deleteEndpoint: "/deviceManagement/deviceConfigurations",
  useBeta: true,
  icon: "settings",
};

const objects = [
  { id: "a", displayName: "Policy A", selected: true },
  { id: "b", displayName: "Policy B", selected: true },
  { id: "c", displayName: "Policy C", selected: true },
  { id: "d", displayName: "Policy D", selected: true },
  { id: "p", displayName: "Default Policy", selected: true, _protectedReason: "Built-in" },
];

const fast = { batchSize: 3, delayBetweenItems: 0, pausePollInterval: 1 };

function spyDelete() {
  /** @type {string[]} */
  const calls = [];
  const fn = async (_category, objectId) => {
    calls.push(objectId);
    return "deleted";
  };
  return { fn, calls };
}

test("dry run never invokes the delete function", async () => {
  const spy = spyDelete();
  const log = [];
  const result = await runCategoryDeletion(category, objects, {
    ...fast,
    deleteObject: spy.fn,
    dryRun: true,
    onItemComplete: (entry) => log.push(entry),
  });

  assert.deepEqual(spy.calls, []);
  assert.deepEqual(result, { deleted: 4, failed: 0, skipped: 1, cancelled: 0 });
  assert.equal(log.length, 5);
  assert.ok(log.every((entry) => entry.dryRun === true));
  const successes = log.filter((entry) => entry.status === "success");
  assert.equal(successes.length, 4);
  assert.ok(successes.every((entry) => entry.message === DRY_RUN_MESSAGE));
  // Protection re-check still runs in a dry run.
  assert.deepEqual(
    log.filter((entry) => entry.status === "skipped").map((entry) => entry.objectId),
    ["p"],
  );
});

test("a real run calls delete for every non-protected object and is not marked dryRun", async () => {
  const spy = spyDelete();
  const log = [];
  await runCategoryDeletion(category, objects, {
    ...fast,
    deleteObject: spy.fn,
    onItemComplete: (entry) => log.push(entry),
  });

  assert.deepEqual([...spy.calls].sort(), ["a", "b", "c", "d"]);
  assert.ok(log.every((entry) => !("dryRun" in entry)));
});

test("resolveDeleteFn is the only switch between real and simulated deletes", async () => {
  const spy = spyDelete();
  assert.equal(resolveDeleteFn(spy.fn, true), simulateDelete);
  assert.equal(resolveDeleteFn(spy.fn, false), spy.fn);
  assert.equal(await simulateDelete(category, "x"), "simulated");
});

test("dry run honours cancel exactly like a real run", async () => {
  const spy = spyDelete();
  let processed = 0;
  const result = await runCategoryDeletion(category, objects, {
    ...fast,
    batchSize: 1,
    deleteObject: spy.fn,
    dryRun: true,
    shouldContinue: () => processed < 2,
    onItemComplete: (entry) => {
      if (entry.status === "success") processed++;
    },
  });

  assert.deepEqual(spy.calls, []);
  assert.equal(result.deleted, 2);
  assert.equal(result.cancelled, 2);
});

test("dry run waits while paused", async () => {
  const spy = spyDelete();
  let paused = true;
  setTimeout(() => {
    paused = false;
  }, 20);
  const started = Date.now();
  const result = await runCategoryDeletion(category, objects.slice(0, 1), {
    ...fast,
    deleteObject: spy.fn,
    dryRun: true,
    isPaused: () => paused,
  });

  assert.ok(Date.now() - started >= 15);
  assert.equal(result.deleted, 1);
  assert.deepEqual(spy.calls, []);
});

test("delete errors are reported with the injected formatter", async () => {
  const log = [];
  const result = await runCategoryDeletion(category, objects.slice(0, 2), {
    ...fast,
    deleteObject: async (_cat, id) => {
      if (id === "b") throw new Error("boom");
      return "not-found";
    },
    formatError: (error) => `fmt:${error.message}`,
    onItemComplete: (entry) => log.push(entry),
  });

  assert.deepEqual(result, { deleted: 1, failed: 1, skipped: 0, cancelled: 0 });
  assert.equal(log.find((e) => e.objectId === "a")?.message, "Already removed (404)");
  assert.equal(log.find((e) => e.objectId === "b")?.message, "fmt:boom");
});

test("dry-run successes are counted but leave objects and selections in place", () => {
  const cats = beginRun(
    [
      {
        category,
        selected: true,
        objects: objects.slice(0, 2),
        loading: false,
        loaded: true,
        error: null,
        runTotal: 0,
        deletedCount: 0,
        failedCount: 0,
        skippedCount: 0,
        failedObjectIds: [],
      },
    ],
    [{ categoryId: category.id, objectIds: ["a", "b"] }],
  );
  const entry = (objectId) => ({
    timestamp: new Date(),
    categoryId: category.id,
    categoryName: category.name,
    objectId,
    objectName: objectId,
    status: "success",
    message: DRY_RUN_MESSAGE,
    dryRun: true,
  });

  const after = [applyDeletionEntry(applyDeletionEntry(cats[0], entry("a")), entry("b"))];
  assert.equal(after[0].objects.length, 2);
  assert.ok(after[0].objects.every((obj) => obj.selected === true));
  assert.equal(computeDeletionStats(after).totalDeleted, 2);
  assert.equal(computeDeletionStats(after).totalRemaining, 0);
  // The same plan can be built again afterwards.
  assert.deepEqual(buildDeletionPlan(after, "selected"), [
    { categoryId: category.id, objectIds: ["a", "b"] },
  ]);

  // A real success still removes the object.
  const real = applyDeletionEntry(cats[0], { ...entry("a"), dryRun: undefined, message: undefined });
  assert.deepEqual(real.objects.map((obj) => obj.id), ["b"]);

  // Leaving the dry run resets the counters without touching objects.
  const reset = beginRun(after, []);
  assert.equal(reset[0].deletedCount, 0);
  assert.equal(reset[0].runTotal, 0);
  assert.equal(reset[0].objects.length, 2);
});

test("deletion log CSV carries the dry-run flag", () => {
  const csv = exportLogToCsv([
    {
      timestamp: new Date("2026-01-01T00:00:00.000Z"),
      categoryId: "groups",
      categoryName: "Groups",
      objectId: "1",
      objectName: "G",
      status: "success",
      message: DRY_RUN_MESSAGE,
      dryRun: true,
    },
  ]);
  const [header, row] = csv.split("\n");
  assert.ok(header.endsWith(",Dry Run"));
  assert.ok(row.endsWith(`"${DRY_RUN_MESSAGE}","yes"`));
});
