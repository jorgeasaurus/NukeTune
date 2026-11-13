/**
 * @typedef {{ id: string, [key: string]: unknown }} DisplayableObject
 */

/**
 * @param {unknown} value
 * @returns {string | undefined} the string when it has non-blank content
 */
function text(value) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

/**
 * Best human-readable name for an object, by category.
 *
 * @param {DisplayableObject} obj
 * @param {string} categoryId
 * @returns {string}
 */
export function getObjectDisplayName(obj, categoryId) {
  const displayName = text(obj.displayName) ?? text(obj.name);
  if (displayName) return displayName;

  const serialNumber = text(obj.serialNumber);

  if (categoryId === "managed-devices") {
    const deviceName = text(obj.deviceName);
    if (deviceName) return deviceName;

    const userPrincipalName = text(obj.userPrincipalName);
    if (serialNumber && userPrincipalName) return `${serialNumber} (${userPrincipalName})`;
    if (serialNumber) return `SN: ${serialNumber}`;
    if (userPrincipalName) return userPrincipalName;
  }

  if (categoryId === "autopilot-devices") {
    const model = text(obj.model);
    const manufacturer = text(obj.manufacturer);
    if (serialNumber && model) return `${serialNumber} (${model})`;
    if (serialNumber && manufacturer) return `${serialNumber} (${manufacturer})`;
    if (serialNumber) return `SN: ${serialNumber}`;
    if (model) return model;
  }

  return `ID: ${obj.id.substring(0, 12)}...`;
}

/**
 * Short Graph type, e.g. "windows10GeneralConfiguration"; "" when unknown.
 *
 * @param {DisplayableObject} obj
 * @returns {string}
 */
export function getObjectType(obj) {
  const type = obj["@odata.type"];
  return typeof type === "string" ? type.replace("#microsoft.graph.", "") : "";
}
