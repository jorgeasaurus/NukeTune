/**
 * Builds a Graph list path with an optional OData `$filter`.
 *
 * The Graph JS client splits the query string on `&` and `=` and does not
 * encode values itself, so the filter is percent-encoded here. Encoded
 * values contain neither `&` nor `=`, so they survive that parsing intact.
 *
 * @param {string} endpoint e.g. "/deviceAppManagement/mobileApps"
 * @param {string | undefined} [filter] raw OData filter expression
 * @returns {string}
 */
export function buildListEndpoint(endpoint, filter) {
  if (!filter) return endpoint;
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}$filter=${encodeURIComponent(filter)}`;
}
