/**
 * Classifies Intune / Entra objects that must never be deleted.
 *
 * This runs when objects are fetched (so the preview can lock them and
 * selection counts stay honest) and again right before deletion as a
 * defence-in-depth check.
 *
 * @typedef {{ id: string, displayName?: string, name?: string, [key: string]: unknown }} ClassifiableObject
 */

/** Display-name patterns that identify built-in or Microsoft-managed objects. */
export const PROTECTED_PATTERNS = [
  /^Default/i,
  /Microsoft managed/i,
  /^All Users$/i,
  /^All Devices$/i,
  /Built-in/i,
];

/**
 * Default enrollment configurations carry their marker in the object id,
 * e.g. `{tenantGuid}_DefaultPlatformRestrictions`, `{guid}_DefaultLimit`,
 * `{guid}_DefaultWindows10EnrollmentCompletionPageConfiguration`,
 * `{guid}_DefaultWindowsHelloForBusiness`. Their displayName is usually
 * "All users and all devices", so name matching alone misses them.
 */
export const DEFAULT_ENROLLMENT_ID_SUFFIX = /_Default[A-Za-z0-9]*$/;

/**
 * @param {string | undefined} displayName
 * @returns {boolean}
 */
export function isProtectedObject(displayName) {
  if (!displayName) return false;
  return PROTECTED_PATTERNS.some((pattern) => pattern.test(displayName));
}

/**
 * @param {string} categoryId
 * @param {ClassifiableObject} object
 * @returns {string | null} Human-readable reason the object is protected, or null.
 */
export function getProtectionReason(categoryId, object) {
  const name =
    typeof object.displayName === "string"
      ? object.displayName
      : typeof object.name === "string"
        ? object.name
        : "";

  if (categoryId === "enrollment-configurations") {
    if (
      DEFAULT_ENROLLMENT_ID_SUFFIX.test(object.id) ||
      object.priority === 0
    ) {
      return "Default enrollment configuration";
    }
  }

  if (categoryId === "scope-tags") {
    if (object.id === "0" || name.trim().toLowerCase() === "default") {
      return "Default scope tag";
    }
  }

  // Every tenant has exactly one default branding profile; Graph flags it
  // with isDefaultProfile (intuneBrandingProfile, beta).
  if (categoryId === "branding-profiles" && object.isDefaultProfile === true) {
    return "Default branding profile";
  }

  if (categoryId === "entra-groups" && object.onPremisesSyncEnabled === true) {
    return "Synced from on-premises AD";
  }

  if (object.isBuiltIn === true) {
    return "Built-in object";
  }

  if (isProtectedObject(name)) {
    return "Built-in or system-managed name";
  }

  return null;
}
