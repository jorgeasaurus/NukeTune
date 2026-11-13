export const COMMERCIAL_AUTHORITY_ORIGIN = "https://login.microsoftonline.com";
export const COMMERCIAL_COMMON_AUTHORITY = `${COMMERCIAL_AUTHORITY_ORIGIN}/common`;
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

/**
 * The redirect URI MSAL should use. In the browser this is always the page's
 * own origin: a popup or redirect can only be read back by the page that
 * opened it when both share an origin, so a fixed value breaks sign-in as soon
 * as the site is served from another host (www vs apex, preview deployments).
 * Entra still only accepts URIs registered on the app, so this cannot widen
 * where tokens are sent. The configured value is used only where there is no
 * page origin (server-side rendering at build time).
 *
 * @param {string | null | undefined} pageOrigin `window.location.origin`, if any
 * @param {string | null | undefined} configuredUri NEXT_PUBLIC_MSAL_REDIRECT_URI
 * @returns {string}
 */
export function resolveRedirectUri(pageOrigin, configuredUri) {
  if (typeof pageOrigin === "string" && /^https?:\/\/[^/]+$/i.test(pageOrigin)) {
    return pageOrigin;
  }
  return typeof configuredUri === "string" ? configuredUri : "";
}
