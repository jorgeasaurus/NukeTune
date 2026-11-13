/**
 * Pure helpers for the per-category part of the deletion progress dialog.
 *
 * @typedef {Pick<import("../../types/intune").CategoryState, "runTotal" | "deletedCount" | "failedCount" | "skippedCount">} RunCounts
 */

/**
 * Bar segment widths (percent of the category's run total) for deleted,
 * failed and skipped objects. Widths never sum past 100.
 *
 * @param {RunCounts} cat
 * @returns {{ deleted: number, failed: number, skipped: number }}
 */
export function getRunSegments(cat) {
  if (cat.runTotal <= 0) return { deleted: 0, failed: 0, skipped: 0 };
  const pct = (/** @type {number} */ n) => (n / cat.runTotal) * 100;
  const deleted = Math.min(100, pct(cat.deletedCount));
  const failed = Math.min(100 - deleted, pct(cat.failedCount));
  const skipped = Math.min(100 - deleted - failed, pct(cat.skippedCount));
  return { deleted, failed, skipped };
}

/**
 * One-line summary of the categories in a run, for the collapsed
 * "Category progress" section.
 *
 * @param {readonly RunCounts[]} categories categories with runTotal > 0
 * @returns {{ total: number, finished: number, withFailures: number }}
 */
export function summarizeRunCategories(categories) {
  let finished = 0;
  let withFailures = 0;
  for (const cat of categories) {
    if (cat.deletedCount + cat.failedCount + cat.skippedCount >= cat.runTotal) finished += 1;
    if (cat.failedCount > 0) withFailures += 1;
  }
  return { total: categories.length, finished, withFailures };
}
