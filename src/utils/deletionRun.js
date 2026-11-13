import { sortByDeletionOrder } from "../lib/intune/deletionOrder.js";
import { isSelectableObject } from "./objectSelection.js";

/**
 * Pure accounting for a deletion run. The store applies these so there is a
 * single source of truth for per-category counts.
 *
 * @typedef {import("../types/intune").CategoryState} CategoryState
 * @typedef {import("../types/intune").DeletionLogEntry} DeletionLogEntry
 * @typedef {{ categoryId: string, objectIds: string[] }} DeletionPlanEntry
 * @typedef {"selected" | "failed"} DeletionPlanMode
 */

/**
 * Builds the ordered list of objects to delete.
 *
 * - "selected": selected, non-protected objects in selected categories.
 * - "failed": objects that failed in the previous run and are still present.
 *
 * Categories with nothing to delete are left out; the result follows
 * DELETION_ORDER, not display order.
 *
 * @param {readonly CategoryState[]} categories
 * @param {DeletionPlanMode} mode
 * @returns {DeletionPlanEntry[]}
 */
export function buildDeletionPlan(categories, mode) {
  /** @type {DeletionPlanEntry[]} */
  const plan = [];

  for (const cat of categories) {
    /** @type {string[]} */
    let objectIds;
    if (mode === "failed") {
      const failed = new Set(cat.failedObjectIds);
      objectIds = cat.objects
        .filter((obj) => failed.has(obj.id) && isSelectableObject(obj))
        .map((obj) => obj.id);
    } else {
      if (!cat.selected) continue;
      objectIds = cat.objects
        .filter((obj) => obj.selected === true && isSelectableObject(obj))
        .map((obj) => obj.id);
    }
    if (objectIds.length > 0) {
      plan.push({ categoryId: cat.category.id, objectIds });
    }
  }

  return sortByDeletionOrder(plan, (entry) => entry.categoryId);
}

/**
 * Resets run counters and sets each category's run total from the plan.
 *
 * @template {CategoryState} C
 * @param {readonly C[]} categories
 * @param {readonly DeletionPlanEntry[]} plan
 * @returns {C[]}
 */
export function beginRun(categories, plan) {
  const totals = new Map(plan.map((entry) => [entry.categoryId, entry.objectIds.length]));
  return categories.map((cat) => ({
    ...cat,
    runTotal: totals.get(cat.category.id) ?? 0,
    deletedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    failedObjectIds: [],
  }));
}

/**
 * Applies one deletion result to its category.
 *
 * Deleted objects are removed so they can no longer be selected or counted
 * as pending; failed objects are remembered for "Retry failed"; skipped
 * objects are deselected.
 *
 * @template {CategoryState} C
 * @param {C} cat
 * @param {DeletionLogEntry} entry
 * @returns {C}
 */
export function applyDeletionEntry(cat, entry) {
  if (cat.category.id !== entry.categoryId) return cat;

  switch (entry.status) {
    case "success":
      return {
        ...cat,
        deletedCount: cat.deletedCount + 1,
        objects: cat.objects.filter((obj) => obj.id !== entry.objectId),
        failedObjectIds: cat.failedObjectIds.filter((id) => id !== entry.objectId),
      };
    case "error":
      return {
        ...cat,
        failedCount: cat.failedCount + 1,
        failedObjectIds: cat.failedObjectIds.includes(entry.objectId)
          ? cat.failedObjectIds
          : [...cat.failedObjectIds, entry.objectId],
      };
    case "skipped":
      return {
        ...cat,
        skippedCount: cat.skippedCount + 1,
        objects: cat.objects.map((obj) =>
          obj.id === entry.objectId ? { ...obj, selected: false } : obj,
        ),
      };
    default:
      return cat;
  }
}

/**
 * @param {Pick<CategoryState, "runTotal" | "deletedCount" | "failedCount" | "skippedCount">} cat
 * @returns {number} processed objects in this run
 */
export function getProcessedCount(cat) {
  return cat.deletedCount + cat.failedCount + cat.skippedCount;
}

/**
 * @param {Pick<CategoryState, "runTotal" | "deletedCount" | "failedCount" | "skippedCount">} cat
 * @returns {number} 0-100
 */
export function getRunProgress(cat) {
  if (cat.runTotal <= 0) return 0;
  return Math.min(100, (getProcessedCount(cat) / cat.runTotal) * 100);
}

/**
 * @param {readonly CategoryState[]} categories
 * @returns {{ totalDeleted: number, totalFailed: number, totalSkipped: number, totalObjects: number, totalRemaining: number }}
 */
export function computeDeletionStats(categories) {
  let totalDeleted = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalObjects = 0;
  for (const cat of categories) {
    if (cat.runTotal <= 0) continue;
    totalDeleted += cat.deletedCount;
    totalFailed += cat.failedCount;
    totalSkipped += cat.skippedCount;
    totalObjects += cat.runTotal;
  }
  return {
    totalDeleted,
    totalFailed,
    totalSkipped,
    totalObjects,
    totalRemaining: Math.max(0, totalObjects - totalDeleted - totalFailed - totalSkipped),
  };
}

/**
 * @param {readonly CategoryState[]} categories
 * @returns {number} objects that can be retried
 */
export function countRetryableFailures(categories) {
  return buildDeletionPlan(categories, "failed").reduce(
    (sum, entry) => sum + entry.objectIds.length,
    0,
  );
}
