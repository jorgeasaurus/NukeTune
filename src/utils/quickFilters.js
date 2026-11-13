/**
 * Quick filters for the preview table: a name prefix/contains match and a
 * preset for objects created by the Intune Hydration Kit.
 *
 * @typedef {"prefix" | "contains"} NameMatchMode
 * @typedef {{ nameQuery: string, nameMode: NameMatchMode, hydrationOnly: boolean }} QuickFilters
 * @typedef {{ id: string, description?: unknown, notes?: unknown, [key: string]: unknown }} FilterableObject
 */

/**
 * Markers the Intune Hydration Kit writes into the `description` (or, for
 * mobile apps, `notes`) of every object it creates. Primary and legacy
 * spellings, as defined in its Get-HydrationMarkerSet; it matches them
 * case-insensitively anywhere in the field (`-like "*marker*"`), so do we.
 */
export const HYDRATION_KIT_MARKERS = Object.freeze([
  "Imported by Intune Hydration Kit",
  "Imported by Intune-Hydration-Kit",
]);

/** @type {QuickFilters} */
export const EMPTY_QUICK_FILTERS = Object.freeze({
  nameQuery: "",
  nameMode: "prefix",
  hydrationOnly: false,
});

/**
 * @param {FilterableObject} obj
 * @returns {boolean}
 */
export function isHydrationKitObject(obj) {
  const markers = HYDRATION_KIT_MARKERS.map((marker) => marker.toLowerCase());
  return [obj.description, obj.notes].some(
    (field) =>
      typeof field === "string" &&
      markers.some((marker) => field.toLowerCase().includes(marker)),
  );
}

/**
 * Case-insensitive name match. An empty (or whitespace) query matches
 * everything, i.e. the filter is off.
 *
 * @param {string} name
 * @param {string} query
 * @param {NameMatchMode} mode
 * @returns {boolean}
 */
export function matchesName(name, query, mode) {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;
  const haystack = name.toLowerCase();
  return mode === "prefix" ? haystack.startsWith(needle) : haystack.includes(needle);
}

/**
 * @param {QuickFilters} filters
 * @returns {boolean}
 */
export function hasActiveQuickFilter(filters) {
  return filters.hydrationOnly || filters.nameQuery.trim().length > 0;
}

/**
 * @template {FilterableObject} T
 * @param {readonly T[]} objects
 * @param {QuickFilters} filters
 * @param {(obj: T) => string} getName
 * @returns {T[]}
 */
export function applyQuickFilters(objects, filters, getName) {
  if (!hasActiveQuickFilter(filters)) return [...objects];
  return objects.filter(
    (obj) =>
      (!filters.hydrationOnly || isHydrationKitObject(obj)) &&
      matchesName(getName(obj), filters.nameQuery, filters.nameMode),
  );
}
