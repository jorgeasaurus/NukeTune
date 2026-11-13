/**
 * Order in which categories are deleted, independent of display order.
 *
 * Dependents go before what they depend on:
 * - devices first (they reference policies, apps, categories, profiles);
 * - role assignments before role definitions (a custom role cannot be
 *   deleted while it is assigned);
 * - policy sets before anything they bundle (apps, app configuration and
 *   protection policies, device configurations, compliance policies,
 *   Autopilot profiles, enrollment configurations);
 * - app configurations / protection policies before the apps they target;
 * - compliance policies before the compliance scripts and notification
 *   message templates they reference;
 * - Settings Catalog and intents (baselines, endpoint security) before the
 *   reusable settings they reference;
 * - every policy, app and script before assignment filters, groups and
 *   scope tags, which they reference.
 */
export const DELETION_ORDER = [
  "managed-devices",
  "autopilot-devices",
  "role-assignments",
  "role-definitions",
  "policy-sets",
  "autopilot-profiles",
  "app-configurations",
  "managed-app-configurations",
  "app-protection-ios",
  "app-protection-android",
  "app-protection-windows-mam",
  "app-protection-windows",
  "wip-mdm-policies",
  "mobile-apps",
  "device-configurations",
  "configuration-policies",
  "compliance-policies",
  "compliance-policies-v2",
  "compliance-scripts",
  "group-policy-configurations",
  "security-baselines",
  "reusable-policy-settings",
  "feature-update-profiles",
  "quality-update-profiles",
  "quality-update-policies",
  "driver-update-profiles",
  "powershell-scripts",
  "shell-scripts",
  "remediation-scripts",
  "custom-attribute-scripts",
  "enrollment-configurations",
  "terms-and-conditions",
  "conditional-access",
  "notification-templates",
  "branding-profiles",
  "assignment-filters",
  "device-categories",
  "entra-groups",
  "scope-tags",
];

/**
 * Categories not listed in DELETION_ORDER are treated like policies: after
 * everything listed before assignment filters, before the shared targets.
 */
const UNKNOWN_RANK = DELETION_ORDER.indexOf("notification-templates") + 0.5;

/**
 * @param {string} categoryId
 * @returns {number}
 */
export function getDeletionRank(categoryId) {
  const index = DELETION_ORDER.indexOf(categoryId);
  return index === -1 ? UNKNOWN_RANK : index;
}

/**
 * Stable sort of items by deletion order.
 *
 * @template T
 * @param {readonly T[]} items
 * @param {(item: T) => string} getCategoryId
 * @returns {T[]}
 */
export function sortByDeletionOrder(items, getCategoryId) {
  return items
    .map((item, index) => ({ item, index, rank: getDeletionRank(getCategoryId(item)) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ item }) => item);
}
