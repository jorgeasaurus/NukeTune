import assert from "node:assert/strict";
import test from "node:test";

import {
  INVENTORY_NOTICE,
  buildExportFilename,
  buildInventory,
  inventoryToCsv,
  inventoryToJson,
  stripAppFields,
} from "../src/utils/inventory.js";
import {
  EMPTY_QUICK_FILTERS,
  HYDRATION_KIT_MARKERS,
  applyQuickFilters,
  hasActiveQuickFilter,
  isHydrationKitObject,
  matchesName,
} from "../src/utils/quickFilters.js";
import { selectOnly } from "../src/utils/objectSelection.js";
import {
  DEFAULT_PAGE_SIZE,
  clampPage,
  getPageCount,
  paginate,
} from "../src/utils/pagination.js";

const deviceConfigs = {
  category: {
    id: "device-configurations",
    name: "Device Configurations",
    description: "",
    dangerLevel: "high",
    listEndpoint: "/deviceManagement/deviceConfigurations",
    deleteEndpoint: "/deviceManagement/deviceConfigurations",
    useBeta: true,
    icon: "settings",
  },
  selected: true,
  objects: [
    {
      id: "1",
      displayName: "=HYPERLINK(\"https://attacker.invalid\")",
      "@odata.type": "#microsoft.graph.windows10GeneralConfiguration",
      createdDateTime: "2026-01-01T00:00:00Z",
      lastModifiedDateTime: "2026-01-02T00:00:00Z",
      description: "Baseline",
      selected: true,
      _categoryId: "device-configurations",
      _categoryName: "Device Configurations",
    },
    {
      id: "2",
      displayName: "Default Policy",
      selected: false,
      _protectedReason: "Built-in",
      _categoryId: "device-configurations",
    },
    { id: "3", displayName: "Unticked", selected: false },
  ],
  loading: false,
  loaded: true,
  error: null,
  runTotal: 0,
  deletedCount: 0,
  failedCount: 0,
  skippedCount: 0,
  failedObjectIds: [],
};

const devices = {
  ...deviceConfigs,
  category: {
    ...deviceConfigs.category,
    id: "managed-devices",
    name: "Managed Devices",
    listEndpoint: "/deviceManagement/managedDevices",
    useBeta: false,
    filter: "operatingSystem eq 'Windows'",
  },
  objects: [{ id: "d1", deviceName: "LAPTOP-01", selected: true }],
};

const tenant = { id: "tid", name: "Contoso", domain: "contoso.com" };
const exportedAt = new Date("2026-03-04T05:06:07.890Z");

// --- inventory ------------------------------------------------------------

test("stripAppFields removes selected and underscore-prefixed fields only", () => {
  assert.deepEqual(
    stripAppFields({ id: "x", selected: true, _protectedReason: "r", _categoryId: "c", "@odata.type": "t", a: 1 }),
    { id: "x", "@odata.type": "t", a: 1 },
  );
});

test("inventory JSON keeps raw Graph fields and flags selection and protection", () => {
  const inventory = buildInventory({ categories: [deviceConfigs, devices], tenant, exportedAt });

  assert.equal(inventory.exportedAt, "2026-03-04T05:06:07.890Z");
  assert.equal(inventory.notice, INVENTORY_NOTICE);
  assert.match(inventory.notice, /not a restorable backup/);
  assert.deepEqual(inventory.tenant, tenant);

  const [configs, managed] = inventory.categories;
  assert.equal(configs.endpoint, "/deviceManagement/deviceConfigurations");
  assert.equal(configs.apiVersion, "beta");
  assert.equal(configs.filter, null);
  assert.equal(configs.objectCount, 3);
  assert.equal(configs.selectedCount, 1);
  assert.equal(managed.apiVersion, "v1.0");
  assert.equal(managed.filter, "operatingSystem eq 'Windows'");

  const [first, protectedObj, unticked] = configs.objects;
  assert.equal(first.description, "Baseline");
  assert.equal(first["@odata.type"], "#microsoft.graph.windows10GeneralConfiguration");
  assert.equal(first["@nuketune.selected"], true);
  assert.equal(first["@nuketune.protectedReason"], null);
  for (const obj of configs.objects) {
    assert.ok(!("selected" in obj));
    assert.ok(Object.keys(obj).every((key) => !key.startsWith("_")));
  }
  assert.equal(protectedObj["@nuketune.selected"], false);
  assert.equal(protectedObj["@nuketune.protectedReason"], "Built-in");
  assert.equal(unticked["@nuketune.selected"], false);

  // Round-trips through JSON.
  assert.deepEqual(JSON.parse(inventoryToJson(inventory)), inventory);
});

test("a protected object is never flagged selected even if its selected bit is set", () => {
  const cat = { ...deviceConfigs, objects: [{ id: "p", selected: true, _protectedReason: "Built-in" }] };
  const inventory = buildInventory({ categories: [cat], tenant, exportedAt });
  assert.equal(inventory.categories[0].objects[0]["@nuketune.selected"], false);
  assert.match(inventoryToCsv([cat]), /"no","Built-in"/);
});

test("inventory CSV has one encoded row per object", () => {
  const lines = inventoryToCsv([deviceConfigs, devices]).split("\n");
  assert.equal(lines[0], "Category,Object ID,Name,Type,Selected,Protected Reason,Created,Modified");
  assert.equal(lines.length, 1 + 3 + 1);
  // Formula-injection hardening from encodeCsvCell is applied.
  assert.equal(
    lines[1],
    '"Device Configurations","1","\'=HYPERLINK(""https://attacker.invalid"")","windows10GeneralConfiguration","yes","","2026-01-01T00:00:00Z","2026-01-02T00:00:00Z"',
  );
  assert.equal(lines[2], '"Device Configurations","2","Default Policy","","no","Built-in","",""');
  // Devices use the same display name as the preview table.
  assert.equal(lines[4], '"Managed Devices","d1","LAPTOP-01","","yes","","",""');
});

test("export file names include tenant domain and timestamp", () => {
  assert.equal(
    buildExportFilename("inventory", tenant, exportedAt, "json"),
    "nuketune-inventory-contoso.com-2026-03-04T05-06-07-890Z.json",
  );
  assert.equal(
    buildExportFilename("inventory", { id: "abc-123", domain: null }, exportedAt, "csv"),
    "nuketune-inventory-abc-123-2026-03-04T05-06-07-890Z.csv",
  );
  assert.equal(
    buildExportFilename("inventory", { id: null, domain: "../Evil Corp/\\x" }, exportedAt, "csv"),
    "nuketune-inventory-evil-corp-x-2026-03-04T05-06-07-890Z.csv",
  );
  assert.equal(
    buildExportFilename("inventory", { id: null, domain: null }, exportedAt, "csv"),
    "nuketune-inventory-unknown-tenant-2026-03-04T05-06-07-890Z.csv",
  );
});

// --- quick filters --------------------------------------------------------

test("Hydration Kit markers match what the kit writes, in description or notes", () => {
  assert.deepEqual([...HYDRATION_KIT_MARKERS], [
    "Imported by Intune Hydration Kit",
    "Imported by Intune-Hydration-Kit",
  ]);
  // New-HydrationDescription output shapes.
  assert.ok(isHydrationKitObject({ id: "1", description: "Imported by Intune Hydration Kit" }));
  assert.ok(isHydrationKitObject({ id: "2", description: "My policy - Imported by Intune Hydration Kit" }));
  assert.ok(isHydrationKitObject({ id: "3", description: "My profile Imported by Intune Hydration Kit" }));
  // Mobile apps carry it in notes; legacy hyphenated spelling; case-insensitive like -like.
  assert.ok(isHydrationKitObject({ id: "4", notes: "imported by intune-hydration-kit" }));
  assert.ok(!isHydrationKitObject({ id: "5", description: "Hydration Kit" }));
  assert.ok(!isHydrationKitObject({ id: "6", description: null, notes: 42 }));
  assert.ok(!isHydrationKitObject({ id: "7" }));
});

test("name matcher supports prefix and contains, case-insensitively", () => {
  assert.ok(matchesName("Test-Policy", "test-", "prefix"));
  assert.ok(!matchesName("My Test-Policy", "test-", "prefix"));
  assert.ok(matchesName("My Test-Policy", "TEST-", "contains"));
  assert.ok(matchesName("anything", "   ", "prefix"));
  assert.ok(!hasActiveQuickFilter({ ...EMPTY_QUICK_FILTERS, nameQuery: "  " }));
  assert.ok(hasActiveQuickFilter({ ...EMPTY_QUICK_FILTERS, hydrationOnly: true }));
});

test("quick filters combine name and Hydration Kit preset", () => {
  const objects = [
    { id: "1", displayName: "HK - Baseline", description: "x - Imported by Intune Hydration Kit" },
    { id: "2", displayName: "HK - Manual", description: "made by hand" },
    { id: "3", displayName: "Other", notes: "Imported by Intune Hydration Kit" },
  ];
  const name = (obj) => obj.displayName;
  assert.deepEqual(
    applyQuickFilters(objects, EMPTY_QUICK_FILTERS, name).map((o) => o.id),
    ["1", "2", "3"],
  );
  assert.deepEqual(
    applyQuickFilters(objects, { ...EMPTY_QUICK_FILTERS, hydrationOnly: true }, name).map((o) => o.id),
    ["1", "3"],
  );
  assert.deepEqual(
    applyQuickFilters(
      objects,
      { nameQuery: "hk", nameMode: "prefix", hydrationOnly: true },
      name,
    ).map((o) => o.id),
    ["1"],
  );
});

test("selectOnly selects exactly the matches and keeps protected objects unselected", () => {
  const objects = [
    { id: "a", selected: false },
    { id: "b", selected: true },
    { id: "c", selected: true },
    { id: "p", selected: false, _protectedReason: "Built-in" },
  ];
  assert.deepEqual(
    selectOnly(objects, ["a", "p"]).map((o) => [o.id, o.selected]),
    [
      ["a", true],
      ["b", false],
      ["c", false],
      ["p", false],
    ],
  );
  assert.ok(selectOnly(objects, []).every((o) => o.selected === false));
});

// --- pagination -----------------------------------------------------------

test("pagination slices 100 rows per page by default", () => {
  const rows = Array.from({ length: 250 }, (_, i) => i);
  assert.equal(DEFAULT_PAGE_SIZE, 100);
  const first = paginate(rows, 0);
  assert.equal(first.items.length, 100);
  assert.equal(first.pageCount, 3);
  assert.deepEqual([first.firstIndex, first.lastIndex, first.total], [1, 100, 250]);
  const last = paginate(rows, 2);
  assert.deepEqual(last.items, rows.slice(200));
  assert.deepEqual([last.firstIndex, last.lastIndex], [201, 250]);
});

test("pagination clamps out-of-range pages so a shrinking filter never shows an empty page", () => {
  assert.equal(clampPage(9, 150, 100), 1);
  assert.equal(clampPage(-3, 150, 100), 0);
  assert.equal(clampPage(Number.NaN, 150, 100), 0);
  assert.equal(paginate([1, 2, 3], 5, 100).page, 0);
  const empty = paginate([], 4, 100);
  assert.deepEqual([empty.items.length, empty.page, empty.pageCount, empty.firstIndex, empty.lastIndex], [0, 0, 1, 0, 0]);
  assert.equal(getPageCount(0, 100), 1);
  assert.equal(getPageCount(100, 100), 1);
  assert.equal(getPageCount(101, 100), 2);
});
