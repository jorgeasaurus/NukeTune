import { encodeCsvCell } from "./csv.js";
import { getObjectDisplayName, getObjectType } from "./objectDisplay.js";
import { isSelectableObject } from "./objectSelection.js";

/**
 * Pre-deletion inventory export. This records the list properties Graph
 * returned for each object; it is NOT a restorable backup.
 *
 * @typedef {import("../types/intune").CategoryState} CategoryState
 * @typedef {import("../types/intune").IntuneObject} IntuneObject
 * @typedef {{ id: string | null, name: string | null, domain: string | null }} InventoryTenant
 * @typedef {Record<string, unknown> & {
 *   id: string,
 *   "@nuketune.selected": boolean,
 *   "@nuketune.protectedReason": string | null,
 * }} InventoryObject
 * @typedef {{
 *   id: string,
 *   name: string,
 *   endpoint: string,
 *   filter: string | null,
 *   apiVersion: "beta" | "v1.0",
 *   loaded: boolean,
 *   error: string | null,
 *   objectCount: number,
 *   selectedCount: number,
 *   objects: InventoryObject[],
 * }} InventoryCategory
 * @typedef {{
 *   exportedAt: string,
 *   notice: string,
 *   tenant: InventoryTenant,
 *   categories: InventoryCategory[],
 * }} Inventory
 */

export const INVENTORY_NOTICE =
  "Inventory of the list properties Graph returned for each object. This is not a restorable backup: " +
  "settings catalog settings, assignments, app content and script bodies are not included.";

/**
 * Drops the app's own bookkeeping (`selected` and `_`-prefixed fields) so
 * only what Graph returned remains.
 *
 * @param {IntuneObject} obj
 * @returns {Record<string, unknown>}
 */
export function stripAppFields(obj) {
  /** @type {Record<string, unknown>} */
  const raw = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "selected" || key.startsWith("_")) continue;
    raw[key] = value;
  }
  return raw;
}

/**
 * @param {IntuneObject} obj
 * @returns {boolean}
 */
function isSelectedForDeletion(obj) {
  return obj.selected === true && isSelectableObject(obj);
}

/**
 * @param {{ categories: readonly CategoryState[], tenant: InventoryTenant, exportedAt: Date }} input
 * @returns {Inventory}
 */
export function buildInventory({ categories, tenant, exportedAt }) {
  return {
    exportedAt: exportedAt.toISOString(),
    notice: INVENTORY_NOTICE,
    tenant: { id: tenant.id, name: tenant.name, domain: tenant.domain },
    categories: categories.map((cat) => ({
      id: cat.category.id,
      name: cat.category.name,
      endpoint: cat.category.listEndpoint,
      filter: cat.category.filter ?? null,
      apiVersion: cat.category.useBeta ? "beta" : "v1.0",
      loaded: cat.loaded,
      error: cat.error,
      objectCount: cat.objects.length,
      selectedCount: cat.objects.filter(isSelectedForDeletion).length,
      objects: cat.objects.map((obj) => ({
        ...stripAppFields(obj),
        id: obj.id,
        "@nuketune.selected": isSelectedForDeletion(obj),
        "@nuketune.protectedReason": obj._protectedReason ?? null,
      })),
    })),
  };
}

/**
 * @param {Inventory} inventory
 * @returns {string}
 */
export function inventoryToJson(inventory) {
  return JSON.stringify(inventory, null, 2);
}

/**
 * One row per object. Every cell goes through encodeCsvCell, which also
 * neutralises spreadsheet formulas in object names and descriptions.
 *
 * @param {readonly CategoryState[]} categories
 * @returns {string}
 */
export function inventoryToCsv(categories) {
  const headers = [
    "Category",
    "Object ID",
    "Name",
    "Type",
    "Selected",
    "Protected Reason",
    "Created",
    "Modified",
  ];
  const rows = categories.flatMap((cat) =>
    cat.objects.map((obj) => [
      cat.category.name,
      obj.id,
      getObjectDisplayName(obj, cat.category.id),
      getObjectType(obj),
      isSelectedForDeletion(obj) ? "yes" : "no",
      obj._protectedReason ?? "",
      typeof obj.createdDateTime === "string" ? obj.createdDateTime : "",
      typeof obj.lastModifiedDateTime === "string" ? obj.lastModifiedDateTime : "",
    ]),
  );

  return [headers.join(","), ...rows.map((row) => row.map(encodeCsvCell).join(","))].join("\n");
}

/**
 * e.g. `nuketune-inventory-contoso.com-2026-01-01T00-00-00-000Z.json`.
 * The tenant part is reduced to filename-safe characters.
 *
 * @param {string} kind e.g. "inventory"
 * @param {Pick<InventoryTenant, "id" | "domain">} tenant
 * @param {Date} date
 * @param {string} extension without the dot
 * @returns {string}
 */
export function buildExportFilename(kind, tenant, date, extension) {
  const tenantPart =
    (tenant.domain ?? tenant.id ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^[.-]+|[.-]+$/g, "") || "unknown-tenant";
  const timestamp = date.toISOString().replace(/[:.]/g, "-");
  return `nuketune-${kind}-${tenantPart}-${timestamp}.${extension}`;
}
