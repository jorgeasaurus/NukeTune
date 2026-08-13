/**
 * @typedef {{ id: string, selected?: boolean }} SelectableObject
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
 * @template {SelectableObject} T
 * @param {readonly T[]} objects
 * @param {readonly string[]} objectIds
 * @param {boolean} selected
 * @returns {T[]}
 */
export function setObjectSelection(objects, objectIds, selected) {
  const selectedIds = new Set(objectIds);

  return objects.map((object) =>
    selectedIds.has(object.id) ? { ...object, selected } : object,
  );
}
