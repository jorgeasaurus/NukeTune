export const COMMERCIAL_AUTHORITY_HOST = "https://login.microsoftonline.com";
export const COMMERCIAL_COMMON_AUTHORITY = `${COMMERCIAL_AUTHORITY_HOST}/common`;
export const COMMERCIAL_GRAPH_BASE_URL = "https://graph.microsoft.com";

const COMMERCIAL_AUTHORITY_ALIASES = new Set([
  "login.microsoftonline.com",
  "login.windows.net",
  "login.microsoft.com",
  "sts.windows.net",
]);

/**
 * @param {unknown} environment
 * @returns {boolean}
 */
export function isCommercialAuthorityEnvironment(environment) {
  return (
    typeof environment === "string" &&
    COMMERCIAL_AUTHORITY_ALIASES.has(environment.toLowerCase())
  );
}
