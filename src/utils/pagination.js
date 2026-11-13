/**
 * Client-side pagination for the preview table, so tenants with thousands
 * of devices or groups do not render every row at once.
 *
 * @template T
 * @typedef {{
 *   items: T[],
 *   page: number,
 *   pageCount: number,
 *   firstIndex: number,
 *   lastIndex: number,
 *   total: number,
 * }} Page
 */

export const DEFAULT_PAGE_SIZE = 100;

/**
 * @param {number} total
 * @param {number} pageSize
 * @returns {number} at least 1
 */
export function getPageCount(total, pageSize) {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

/**
 * Zero-based page index clamped to the valid range, so a shrinking filter
 * result never leaves the table on an empty page.
 *
 * @param {number} page
 * @param {number} total
 * @param {number} pageSize
 * @returns {number}
 */
export function clampPage(page, total, pageSize) {
  const last = getPageCount(total, pageSize) - 1;
  if (!Number.isFinite(page)) return 0;
  return Math.min(Math.max(0, Math.floor(page)), last);
}

/**
 * @template T
 * @param {readonly T[]} items
 * @param {number} page zero-based; clamped
 * @param {number} [pageSize]
 * @returns {Page<T>} firstIndex/lastIndex are 1-based for display (0 when empty)
 */
export function paginate(items, page, pageSize = DEFAULT_PAGE_SIZE) {
  const size = Math.max(1, pageSize);
  const current = clampPage(page, items.length, size);
  const start = current * size;
  const pageItems = items.slice(start, start + size);
  return {
    items: pageItems,
    page: current,
    pageCount: getPageCount(items.length, size),
    firstIndex: pageItems.length > 0 ? start + 1 : 0,
    lastIndex: start + pageItems.length,
    total: items.length,
  };
}
