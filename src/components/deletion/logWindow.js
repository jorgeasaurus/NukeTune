/**
 * Pure helpers for the deletion activity log: which entries to render and
 * whether the view should follow new entries.
 *
 * @typedef {import("../../types/intune").DeletionLogEntry} DeletionLogEntry
 */

/** How many log rows are rendered at most; the CSV export has the rest. */
export const LOG_WINDOW_SIZE = 300;

/**
 * The last `limit` entries (optionally errors only), each paired with its
 * index in the full log. The log is append-only, so that index is a stable
 * React key that survives new entries and filter changes.
 *
 * @param {readonly DeletionLogEntry[]} entries
 * @param {{ errorsOnly?: boolean, limit?: number }} [options]
 * @returns {{ rows: { key: number, entry: DeletionLogEntry }[], matchingCount: number, errorCount: number }}
 */
export function getLogWindow(entries, { errorsOnly = false, limit = LOG_WINDOW_SIZE } = {}) {
  /** @type {{ key: number, entry: DeletionLogEntry }[]} */
  const rows = [];
  let matchingCount = 0;
  let errorCount = 0;

  // Walk backwards so only the visible tail is collected.
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = /** @type {DeletionLogEntry} */ (entries[i]);
    const isError = entry.status === "error";
    if (isError) errorCount += 1;
    if (errorsOnly && !isError) continue;
    matchingCount += 1;
    if (rows.length < limit) rows.push({ key: i, entry });
  }

  rows.reverse();
  return { rows, matchingCount, errorCount };
}

/**
 * True when a scroll container is at (or within `threshold` px of) its end,
 * i.e. the user is following the log rather than reading back through it.
 *
 * @param {{ scrollTop: number, scrollHeight: number, clientHeight: number }} el
 * @param {number} [threshold]
 * @returns {boolean}
 */
export function isScrolledToBottom(el, threshold = 24) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}
