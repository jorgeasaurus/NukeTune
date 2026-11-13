/**
 * Pure helpers for the category selector: search, grouping by severity and
 * the selection summary shown in the sticky action bar.
 *
 * @typedef {import("../../types/intune").CategoryState} CategoryState
 * @typedef {import("../../types/intune").DangerLevel} DangerLevel
 */

/** Display order of severity sections, most dangerous first. */
export const SEVERITY_ORDER = /** @type {const} */ (["critical", "high", "medium", "low"]);

/**
 * Case-insensitive match of every whitespace-separated term against the
 * category's name, description, id and severity. An empty query matches all.
 *
 * @param {Pick<CategoryState, "category">} cat
 * @param {string} query
 * @returns {boolean}
 */
export function matchesCategoryQuery(cat, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const { name, description, id, dangerLevel } = cat.category;
  const haystack = `${name} ${description} ${id} ${dangerLevel}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

/**
 * Groups categories by severity in SEVERITY_ORDER, keeping their original
 * order within a group. Every severity is returned, even when empty.
 *
 * @template {Pick<CategoryState, "category">} C
 * @param {readonly C[]} categories
 * @returns {{ level: DangerLevel, items: C[] }[]}
 */
export function groupBySeverity(categories) {
  return SEVERITY_ORDER.map((level) => ({
    level,
    items: categories.filter((cat) => cat.category.dangerLevel === level),
  }));
}

/**
 * Whether a category can be selected at all.
 *
 * @param {Pick<CategoryState, "category">} cat
 * @returns {boolean}
 */
export function isSelectableCategory(cat) {
  return !cat.category.requiresAppPermissions;
}

/**
 * Ids of the categories whose selection must flip so that every selectable
 * category in `categories` ends up `selected`.
 *
 * @param {readonly Pick<CategoryState, "category" | "selected">[]} categories
 * @param {boolean} selected
 * @returns {string[]}
 */
export function getBulkToggleIds(categories, selected) {
  return categories
    .filter((cat) => isSelectableCategory(cat) && cat.selected !== selected)
    .map((cat) => cat.category.id);
}

/**
 * Summary for the sticky action bar.
 *
 * `objectCount` counts selected objects in selected categories, matching
 * what the preview will offer for deletion.
 *
 * @param {readonly CategoryState[]} categories
 * @returns {{ selectedCount: number, criticalCount: number, objectCount: number, loadingCount: number }}
 */
export function summarizeSelection(categories) {
  let selectedCount = 0;
  let criticalCount = 0;
  let objectCount = 0;
  let loadingCount = 0;
  for (const cat of categories) {
    if (!cat.selected || !isSelectableCategory(cat)) continue;
    selectedCount += 1;
    if (cat.category.dangerLevel === "critical") criticalCount += 1;
    if (cat.loading) loadingCount += 1;
    for (const obj of cat.objects) {
      if (obj.selected) objectCount += 1;
    }
  }
  return { selectedCount, criticalCount, objectCount, loadingCount };
}
