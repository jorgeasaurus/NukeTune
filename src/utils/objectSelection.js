/**
 * @typedef {{ id: string, selected?: boolean, _protectedReason?: string }} SelectableObject
 * @typedef {SelectableObject & { categoryId: string, [key: string]: unknown }} CategorizedObject
 * @typedef {{ categoryId: string, objectId: string }} ObjectSelectionTarget
 */

/**
 * @template {CategorizedObject} T
 * @param {readonly T[]} objects
 * @param {string} searchQuery
 * @param {string} selectedCategory
 * @returns {T[]}
 */
export function filterVisibleObjects(objects, searchQuery, selectedCategory) {
  const normalizedSearch = searchQuery.toLowerCase();

  return objects.filter((object) => {
    const searchableValues = [
      object.displayName,
      object.name,
      object.deviceName,
      object.serialNumber,
      object.userPrincipalName,
      object.model,
      object.manufacturer,
      object.id,
    ];
    const searchableText = searchableValues
      .filter((value) => typeof value === "string")
      .join(" ")
      .toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      searchableText.includes(normalizedSearch);
    const matchesCategory =
      selectedCategory === "all" || object.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });
}

/**
 * @param {readonly CategorizedObject[]} objects
 * @returns {ObjectSelectionTarget[]}
 */
export function getObjectSelectionTargets(objects) {
  return objects.map((object) => ({
    categoryId: object.categoryId,
    objectId: object.id,
  }));
}

/**
 * Protected objects (built-in, default or system-managed) can never be
 * selected for deletion.
 *
 * @param {SelectableObject} object
 * @returns {boolean}
 */
export function isSelectableObject(object) {
  return !object._protectedReason;
}

/**
 * @template {SelectableObject} T
 * @param {readonly T[]} objects
 * @param {readonly string[]} objectIds
 * @param {boolean} selected
 * @returns {T[]}
 */
export function setObjectSelection(objects, objectIds, selected) {
  const selectedIds = new Set(objectIds);

  return objects.map((object) =>
    selectedIds.has(object.id)
      ? { ...object, selected: selected && isSelectableObject(object) }
      : object,
  );
}

/**
 * Toggles one object, leaving protected objects deselected.
 *
 * @template {SelectableObject} T
 * @param {readonly T[]} objects
 * @param {string} objectId
 * @returns {T[]}
 */
export function toggleObjectSelection(objects, objectId) {
  return objects.map((object) =>
    object.id === objectId
      ? { ...object, selected: !object.selected && isSelectableObject(object) }
      : object,
  );
}

/**
 * Initial selection for freshly fetched objects: everything except
 * protected objects.
 *
 * @template {SelectableObject} T
 * @param {readonly T[]} objects
 * @returns {T[]}
 */
export function selectAllSelectable(objects) {
  return objects.map((object) => ({
    ...object,
    selected: isSelectableObject(object),
  }));
}

/**
 * Selects exactly `objectIds` (when selectable) and deselects everything
 * else in `objects`.
 *
 * @template {SelectableObject} T
 * @param {readonly T[]} objects
 * @param {readonly string[]} objectIds
 * @returns {T[]}
 */
export function selectOnly(objects, objectIds) {
  const keep = new Set(objectIds);
  return objects.map((object) => ({
    ...object,
    selected: keep.has(object.id) && isSelectableObject(object),
  }));
}
