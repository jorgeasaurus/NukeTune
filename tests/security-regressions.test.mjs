import assert from "node:assert/strict";
import test from "node:test";

import { encodeCsvCell, exportLogToCsv } from "../src/utils/csv.js";
import {
  COMMERCIAL_AUTHORITY_ORIGIN,
  COMMERCIAL_COMMON_AUTHORITY,
  COMMERCIAL_GRAPH_BASE_URL,
  isCommercialAuthorityEnvironment,
} from "../src/lib/msal/commercialCloud.js";
import {
  filterVisibleObjects,
  getObjectSelectionTargets,
  setObjectSelection,
} from "../src/utils/objectSelection.js";

test("Microsoft endpoints are fixed to the Global Commercial cloud", () => {
  assert.equal(
    COMMERCIAL_AUTHORITY_ORIGIN,
    "https://login.microsoftonline.com",
  );
  assert.equal(
    COMMERCIAL_COMMON_AUTHORITY,
    "https://login.microsoftonline.com/common",
  );
  assert.equal(COMMERCIAL_GRAPH_BASE_URL, "https://graph.microsoft.com");
  assert.equal(isCommercialAuthorityEnvironment("login.windows.net"), true);
  assert.equal(
    isCommercialAuthorityEnvironment("login.microsoftonline.us"),
    false,
  );
  assert.equal(
    isCommercialAuthorityEnvironment("login.chinacloudapi.cn"),
    false,
  );
});

test("selection targets contain only objects visible to search and category filters", () => {
  const visibleObjects = filterVisibleObjects(
    [
      { id: "visible", categoryId: "devices", displayName: "target device" },
      {
        id: "hidden-search",
        categoryId: "devices",
        displayName: "other device",
      },
      {
        id: "hidden-category",
        categoryId: "groups",
        displayName: "target group",
      },
    ],
    "target",
    "devices",
  );

  assert.deepEqual(getObjectSelectionTargets(visibleObjects), [
    { objectId: "visible", categoryId: "devices" },
  ]);
});

test("selection updates only the visible object IDs", () => {
  const objects = [
    { id: "visible", selected: false },
    { id: "hidden", selected: false },
  ];

  assert.deepEqual(setObjectSelection(objects, ["visible"], true), [
    { id: "visible", selected: true },
    { id: "hidden", selected: false },
  ]);
});

test("deselection preserves hidden selected objects", () => {
  const objects = [
    { id: "visible", selected: true },
    { id: "hidden", selected: true },
  ];

  assert.deepEqual(setObjectSelection(objects, ["visible"], false), [
    { id: "visible", selected: false },
    { id: "hidden", selected: true },
  ]);
});

test("CSV cells neutralize spreadsheet formula prefixes", () => {
  for (const value of [
    "=SUM(1,1)",
    "+cmd",
    "-2+3",
    "@SUM(1,1)",
    "\tformula",
    "\rformula",
    "\nformula",
    "  =SUM(1,1)",
    "\u00a0=SUM(1,1)",
    "\ufeff=SUM(1,1)",
  ]) {
    assert.equal(encodeCsvCell(value), `"'${value.replaceAll('"', '""')}"`);
  }
});

test("CSV cells preserve legitimate text and quoting", () => {
  assert.equal(encodeCsvCell("device, one"), '"device, one"');
  assert.equal(encodeCsvCell('device "one"'), '"device ""one"""');
  assert.equal(encodeCsvCell("1-2-3"), '"1-2-3"');
  assert.equal(encodeCsvCell(""), '""');
  assert.equal(encodeCsvCell("   "), '"   "');
  assert.equal(encodeCsvCell("'=SUM(1,1)"), '"\'=SUM(1,1)"');
});

test("deletion log export applies spreadsheet-safe encoding to dynamic fields", () => {
  const csv = exportLogToCsv([
    {
      timestamp: new Date("2026-01-01T00:00:00.000Z"),
      categoryId: "groups",
      categoryName: "=CATEGORY()",
      objectId: "+OBJECT",
      objectName: '  @HYPERLINK("https://attacker.invalid")',
      status: "error",
      message: "-MESSAGE",
    },
  ]);

  assert.equal(
    csv,
    [
      "Timestamp,Category,Object ID,Object Name,Status,Message",
      '"2026-01-01T00:00:00.000Z","\'=CATEGORY()","\'+OBJECT","\'  @HYPERLINK(""https://attacker.invalid"")","error","\'-MESSAGE"',
    ].join("\n"),
  );
});
