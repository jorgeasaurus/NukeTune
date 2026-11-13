import assert from "node:assert/strict";
import test from "node:test";

import {
  getProtectionReason,
  isProtectedObject,
} from "../src/lib/intune/protection.js";
import {
  DELETION_ORDER,
  getDeletionRank,
  sortByDeletionOrder,
} from "../src/lib/intune/deletionOrder.js";
import { buildListEndpoint } from "../src/lib/intune/endpoints.js";
import {
  CancelledError,
  processBatch,
} from "../src/utils/batchProcessor.js";
import {
  selectAllSelectable,
  setObjectSelection,
  toggleObjectSelection,
} from "../src/utils/objectSelection.js";
import {
  applyDeletionEntry,
  beginRun,
  buildDeletionPlan,
  computeDeletionStats,
  countRetryableFailures,
  getRunProgress,
} from "../src/utils/deletionRun.js";

// --- protection -----------------------------------------------------------

test("default enrollment configurations are protected by id suffix and priority", () => {
  const tenant = "1b2c3d4e-0000-0000-0000-000000000000";
  for (const suffix of [
    "DefaultPlatformRestrictions",
    "DefaultLimit",
    "DefaultWindows10EnrollmentCompletionPageConfiguration",
    "DefaultWindowsHelloForBusiness",
  ]) {
    assert.equal(
      getProtectionReason("enrollment-configurations", {
        id: `${tenant}_${suffix}`,
        displayName: "All users and all devices",
        priority: 5,
      }),
      "Default enrollment configuration",
      suffix,
    );
  }

  assert.equal(
    getProtectionReason("enrollment-configurations", {
      id: "abc",
      displayName: "All users and all devices",
      priority: 0,
    }),
    "Default enrollment configuration",
  );

  assert.equal(
    getProtectionReason("enrollment-configurations", {
      id: `${tenant}_Windows10EnrollmentCompletionPageConfiguration`,
      displayName: "Kiosk ESP",
      priority: 1,
    }),
    null,
  );
});

test("built-ins, Default scope tag, synced groups and name patterns are protected", () => {
  assert.equal(
    getProtectionReason("role-definitions", { id: "r", displayName: "Help Desk Operator", isBuiltIn: true }),
    "Built-in object",
  );
  assert.equal(
    getProtectionReason("role-definitions", { id: "r", displayName: "Custom", isBuiltIn: false }),
    null,
  );
  assert.equal(getProtectionReason("scope-tags", { id: "0", displayName: "Default" }), "Default scope tag");
  assert.equal(getProtectionReason("scope-tags", { id: "4", displayName: "Region EU" }), null);
  assert.equal(
    getProtectionReason("entra-groups", { id: "g", displayName: "Sales", onPremisesSyncEnabled: true }),
    "Synced from on-premises AD",
  );
  assert.equal(
    getProtectionReason("entra-groups", { id: "g", displayName: "Sales", onPremisesSyncEnabled: null }),
    null,
  );
  assert.equal(
    getProtectionReason("device-configurations", { id: "x", displayName: "Default Profile" }),
    "Built-in or system-managed name",
  );
  assert.equal(getProtectionReason("device-categories", { id: "x", name: "All Devices" }), "Built-in or system-managed name");
  assert.equal(isProtectedObject(undefined), false);
  assert.equal(isProtectedObject("Corp Wi-Fi"), false);
});

// --- selection never includes protected objects --------------------------

test("protected objects can never become selected", () => {
  const objects = [
    { id: "a" },
    { id: "b", _protectedReason: "Built-in object" },
  ];

  const initial = selectAllSelectable(objects);
  assert.deepEqual(
    initial.map((o) => o.selected),
    [true, false],
  );

  assert.equal(toggleObjectSelection(initial, "b")[1].selected, false);
  assert.equal(toggleObjectSelection(initial, "a")[0].selected, false);
  assert.deepEqual(
    setObjectSelection(initial, ["a", "b"], true).map((o) => o.selected),
    [true, false],
  );
});

// --- list filter ---------------------------------------------------------

test("list filters are percent-encoded so the Graph client keeps them intact", () => {
  assert.equal(buildListEndpoint("/deviceManagement/roleDefinitions"), "/deviceManagement/roleDefinitions");
  const filter =
    "(microsoft.graph.managedApp/appAvailability eq null or microsoft.graph.managedApp/appAvailability eq 'lineOfBusiness' or isAssigned eq true)";
  const url = buildListEndpoint("/deviceAppManagement/mobileApps", filter);
  const [path, query] = url.split("?");
  assert.equal(path, "/deviceAppManagement/mobileApps");
  assert.ok(query?.startsWith("$filter="));
  const value = query.slice("$filter=".length);
  assert.ok(!value.includes("&") && !value.includes("=") && !value.includes(" "));
  assert.equal(decodeURIComponent(value), filter);
  assert.equal(buildListEndpoint("/x?$top=5", "a eq 1"), "/x?$top=5&$filter=a%20eq%201");
});

// --- deletion order ------------------------------------------------------

test("deletion order respects dependencies", () => {
  const before = (a, b) => assert.ok(getDeletionRank(a) < getDeletionRank(b), `${a} before ${b}`);

  before("managed-devices", "mobile-apps");
  before("autopilot-devices", "autopilot-profiles");
  before("role-assignments", "role-definitions");
  before("compliance-policies", "notification-templates");
  before("compliance-policies-v2", "notification-templates");
  before("app-configurations", "mobile-apps");
  for (const dependent of [
    "mobile-apps",
    "device-configurations",
    "configuration-policies",
    "powershell-scripts",
    "remediation-scripts",
    "autopilot-profiles",
    "conditional-access",
    "some-future-category",
  ]) {
    before(dependent, "assignment-filters");
    before(dependent, "scope-tags");
    before(dependent, "entra-groups");
  }
  assert.equal(DELETION_ORDER.at(-1), "scope-tags");
  assert.equal(new Set(DELETION_ORDER).size, DELETION_ORDER.length);
});

test("deletion order covers every category in the catalogue", async () => {
  // categories.ts is TypeScript; read the ids textually instead of importing it.
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../src/lib/intune/categories.ts", import.meta.url), "utf8");
  const ids = [...source.matchAll(/^\s{4}id: "([^"]+)"/gm)].map((m) => m[1]);
  assert.ok(ids.length > 20);
  assert.deepEqual(ids.filter((id) => !DELETION_ORDER.includes(id)), []);
});

test("sortByDeletionOrder is stable and independent of display order", () => {
  const sorted = sortByDeletionOrder(
    ["scope-tags", "role-definitions", "unknown-a", "role-assignments", "unknown-b", "managed-devices"],
    (id) => id,
  );
  assert.deepEqual(sorted, [
    "managed-devices",
    "role-assignments",
    "role-definitions",
    "unknown-a",
    "unknown-b",
    "scope-tags",
  ]);
});

// --- batch processor -----------------------------------------------------

test("processBatch passes the original error and does not count cancellations as failures", async () => {
  const graphError = Object.assign(new Error("Forbidden"), { statusCode: 403, code: "Forbidden" });
  const completions = [];
  let cancelled = false;

  const result = await processBatch(
    ["ok", "bad", "cancel", "later-1", "later-2"],
    async (item) => {
      if (item === "bad") throw graphError;
      if (item === "cancel") {
        cancelled = true;
        throw new CancelledError();
      }
    },
    {
      batchSize: 3,
      delayBetweenItems: 0,
      shouldContinue: () => !cancelled,
      onItemComplete: (item, success, error) => completions.push({ item, success, error }),
    },
  );

  assert.deepEqual(result.successful, ["ok"]);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].error, graphError);
  assert.deepEqual(result.cancelled, ["cancel", "later-1", "later-2"]);
  assert.deepEqual(
    completions.map(({ item, success }) => [item, success]),
    [
      ["ok", true],
      ["bad", false],
    ],
  );
  assert.equal(completions[1].error, graphError);
});

// --- run accounting ------------------------------------------------------

const cat = (id, objects, extra = {}) => ({
  category: { id, name: id },
  selected: true,
  objects,
  loading: false,
  loaded: true,
  error: null,
  runTotal: 0,
  deletedCount: 0,
  failedCount: 0,
  skippedCount: 0,
  failedObjectIds: [],
  ...extra,
});

const entry = (categoryId, objectId, status) => ({
  timestamp: new Date(0),
  categoryId,
  categoryName: categoryId,
  objectId,
  objectName: objectId,
  status,
});

test("deletion plan includes only selected, unprotected objects in dependency order", () => {
  const categories = [
    cat("role-definitions", [
      { id: "d1", selected: true },
      { id: "d2", selected: true, _protectedReason: "Built-in object" },
    ]),
    cat("role-assignments", [
      { id: "a1", selected: true },
      { id: "a2", selected: false },
    ]),
    cat("scope-tags", [{ id: "s1", selected: false }]),
    cat("mobile-apps", [{ id: "m1", selected: true }], { selected: false }),
  ];

  assert.deepEqual(buildDeletionPlan(categories, "selected"), [
    { categoryId: "role-assignments", objectIds: ["a1"] },
    { categoryId: "role-definitions", objectIds: ["d1"] },
  ]);
});

test("run accounting: progress reaches 100% with deselected objects, deleted objects disappear, failures are retryable", () => {
  let categories = [
    cat("device-configurations", [
      { id: "c1", selected: true },
      { id: "c2", selected: true },
      { id: "c3", selected: false },
    ]),
    cat("scope-tags", [{ id: "s1", selected: false }]),
  ];

  const plan = buildDeletionPlan(categories, "selected");
  categories = beginRun(categories, plan);
  assert.deepEqual(
    categories.map((c) => c.runTotal),
    [2, 0],
  );

  for (const e of [entry("device-configurations", "c1", "success"), entry("device-configurations", "c2", "error")]) {
    categories = categories.map((c) => applyDeletionEntry(c, e));
  }

  const [configs] = categories;
  assert.equal(getRunProgress(configs), 100);
  assert.deepEqual(
    configs.objects.map((o) => o.id),
    ["c2", "c3"],
  );
  assert.deepEqual(configs.failedObjectIds, ["c2"]);
  assert.deepEqual(computeDeletionStats(categories), {
    totalDeleted: 1,
    totalFailed: 1,
    totalSkipped: 0,
    totalObjects: 2,
    totalRemaining: 0,
  });
  assert.equal(countRetryableFailures(categories), 1);

  // Retry: only the failed object is queued and counters restart.
  const retryPlan = buildDeletionPlan(categories, "failed");
  assert.deepEqual(retryPlan, [{ categoryId: "device-configurations", objectIds: ["c2"] }]);
  categories = beginRun(categories, retryPlan);
  assert.equal(categories[0].failedCount, 0);
  assert.equal(categories[0].runTotal, 1);
  categories = categories.map((c) => applyDeletionEntry(c, entry("device-configurations", "c2", "success")));
  assert.equal(countRetryableFailures(categories), 0);
  assert.deepEqual(
    categories[0].objects.map((o) => o.id),
    ["c3"],
  );
});

test("cancelled runs leave remaining items as remaining, not failed", () => {
  let categories = beginRun(
    [cat("device-configurations", [{ id: "c1", selected: true }, { id: "c2", selected: true }])],
    [{ categoryId: "device-configurations", objectIds: ["c1", "c2"] }],
  );
  categories = categories.map((c) => applyDeletionEntry(c, entry("device-configurations", "c1", "success")));
  const stats = computeDeletionStats(categories);
  assert.equal(stats.totalFailed, 0);
  assert.equal(stats.totalRemaining, 1);
});

test("skipped entries deselect the object", () => {
  const [c] = [cat("device-configurations", [{ id: "c1", selected: true }])].map((c) =>
    applyDeletionEntry(c, entry("device-configurations", "c1", "skipped")),
  );
  assert.equal(c.skippedCount, 1);
  assert.equal(c.objects[0].selected, false);
});

test("default enrollment configurations are protected by their documented type", () => {
  assert.equal(
    getProtectionReason("enrollment-configurations", {
      id: "11111111-2222-3333-4444-555555555555",
      displayName: "All users and all devices",
      priority: 3,
      deviceEnrollmentConfigurationType: "defaultWindowsHelloForBusiness",
    }),
    "Default enrollment configuration",
  );
  assert.equal(
    getProtectionReason("enrollment-configurations", {
      id: "11111111-2222-3333-4444-555555555555",
      displayName: "Custom ESP",
      priority: 3,
      deviceEnrollmentConfigurationType: "windows10EnrollmentCompletionPageConfiguration",
    }),
    null,
  );
});
