/**
 * Pure helpers for identifying which tenant a destructive operation targets.
 * Kept free of React/MSAL/Graph imports so they can be tested with node --test.
 *
 * @typedef {{ name?: unknown, isDefault?: unknown, isInitial?: unknown }} VerifiedDomain
 * @typedef {{ id?: unknown, displayName?: unknown, verifiedDomains?: unknown }} OrganizationRecord
 * @typedef {{ id: string, displayName: string | null, primaryDomain: string | null }} TenantIdentity
 * @typedef {{ phrase: string, source: "tenant" | "account" | "generic" }} ConfirmationPhrase
 */

export const GENERIC_CONFIRMATION_PHRASE = "DELETE";

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function nonEmptyString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Pick the tenant's primary domain: the default verified domain, else the
 * initial *.onmicrosoft.com domain. Returns a lower-cased domain or null.
 *
 * @param {unknown} verifiedDomains
 * @returns {string | null}
 */
export function getPrimaryDomain(verifiedDomains) {
  if (!Array.isArray(verifiedDomains)) return null;

  /** @type {VerifiedDomain[]} */
  const domains = verifiedDomains.filter(
    (domain) => domain !== null && typeof domain === "object",
  );
  const pick = (/** @type {"isDefault" | "isInitial"} */ flag) => {
    const match = domains.find(
      (domain) => domain[flag] === true && nonEmptyString(domain.name),
    );
    return match ? (nonEmptyString(match.name)?.toLowerCase() ?? null) : null;
  };

  return pick("isDefault") ?? pick("isInitial");
}

/**
 * Derive tenant identity from a `GET /organization` response. Returns null when
 * the response does not contain a usable organization record, or when its id
 * does not match the signed-in account's tenant (never show a name we cannot
 * tie to the account the delete calls will be made with).
 *
 * @param {unknown} response
 * @param {string | null | undefined} expectedTenantId
 * @returns {TenantIdentity | null}
 */
export function deriveTenantIdentity(response, expectedTenantId) {
  if (!response || typeof response !== "object") return null;
  const value = /** @type {{ value?: unknown }} */ (response).value;
  if (!Array.isArray(value) || value.length === 0) return null;

  /** @type {OrganizationRecord} */
  const org = value[0] && typeof value[0] === "object" ? value[0] : {};
  const id = nonEmptyString(org.id);
  if (!id) return null;
  if (
    expectedTenantId &&
    id.toLowerCase() !== expectedTenantId.trim().toLowerCase()
  ) {
    return null;
  }

  return {
    id,
    displayName: nonEmptyString(org.displayName),
    primaryDomain: getPrimaryDomain(org.verifiedDomains),
  };
}

/**
 * Domain part of a UPN / username, lower-cased. Null if it doesn't look like one.
 *
 * @param {string | null | undefined} username
 * @returns {string | null}
 */
export function getUpnDomain(username) {
  const value = nonEmptyString(username);
  if (!value) return null;
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return null;
  const domain = value.slice(at + 1).toLowerCase();
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) ? domain : null;
}

/**
 * Whether the account is a guest in the tenant it is signed in to. MSAL's
 * `homeAccountId` is `<objectId>.<homeTenantId>`; for a guest that home
 * tenant differs from the resource `tenantId` Graph calls are made against,
 * so the account's UPN domain names the wrong tenant.
 *
 * @param {{ homeAccountId?: string | null, tenantId?: string | null } | null | undefined} account
 * @returns {boolean}
 */
export function isGuestAccount(account) {
  const homeAccountId = nonEmptyString(account?.homeAccountId);
  const tenantId = nonEmptyString(account?.tenantId);
  if (!homeAccountId || !tenantId) return false;
  const separator = homeAccountId.lastIndexOf(".");
  if (separator === -1) return false;
  const homeTenantId = homeAccountId.slice(separator + 1);
  return homeTenantId.length > 0 && homeTenantId.toLowerCase() !== tenantId.toLowerCase();
}

/**
 * What the user must type to confirm deletion: the tenant's primary domain,
 * else the signed-in account's UPN domain, else the generic phrase. The UPN
 * domain is skipped for guests, where it belongs to their home tenant.
 *
 * @param {{ tenantDomain?: string | null, username?: string | null, isGuest?: boolean }} input
 * @returns {ConfirmationPhrase}
 */
export function getConfirmationPhrase({ tenantDomain, username, isGuest = false }) {
  const domain = nonEmptyString(tenantDomain);
  if (domain) return { phrase: domain.toLowerCase(), source: "tenant" };
  const upnDomain = isGuest ? null : getUpnDomain(username);
  if (upnDomain) return { phrase: upnDomain, source: "account" };
  return { phrase: GENERIC_CONFIRMATION_PHRASE, source: "generic" };
}

/**
 * Case-insensitive, whitespace-trimmed, exact comparison. An empty phrase never matches.
 *
 * @param {string} input
 * @param {string} phrase
 * @returns {boolean}
 */
export function isConfirmationMatch(input, phrase) {
  const expected = phrase.trim().toLowerCase();
  if (expected.length === 0) return false;
  return input.trim().toLowerCase() === expected;
}

/**
 * Human-readable tenant label, e.g. "Contoso (contoso.com)", with fallbacks to
 * whatever is known.
 *
 * @param {{ tenantName?: string | null, tenantDomain?: string | null, tenantId?: string | null, username?: string | null, isGuest?: boolean }} input
 * @returns {string}
 */
export function formatTenantLabel({ tenantName, tenantDomain, tenantId, username, isGuest = false }) {
  const name = nonEmptyString(tenantName);
  const domain = nonEmptyString(tenantDomain) ?? (isGuest ? null : getUpnDomain(username));
  if (name && domain && name.toLowerCase() !== domain.toLowerCase()) {
    return `${name} (${domain})`;
  }
  if (name) return name;
  if (domain) return domain;
  const id = nonEmptyString(tenantId);
  if (id) return `Tenant ${id}`;
  return "Unknown tenant";
}

/**
 * Identity of a tenant session: who is signed in AND which tenant Graph calls
 * target. `homeAccountId` alone is not enough: it is `<objectId>.<homeTenantId>`
 * and stays the same when the same user becomes active in a different
 * resource tenant, where every tenant-scoped piece of state must be discarded.
 *
 * @param {{ homeAccountId?: string | null, tenantId?: string | null } | null | undefined} account
 * @returns {string | null} null when signed out
 */
export function getTenantSessionKey(account) {
  const homeAccountId = nonEmptyString(account?.homeAccountId);
  if (!homeAccountId) return null;
  const tenantId = nonEmptyString(account?.tenantId) ?? "";
  return `${homeAccountId.toLowerCase()}|${tenantId.toLowerCase()}`;
}

/**
 * Whether the tenant session changed in a way that must discard tenant-scoped
 * state. Compare keys from `getTenantSessionKey`. `undefined` means "not
 * observed yet" (first render).
 *
 * @param {string | null | undefined} previousSessionKey
 * @param {string | null} nextSessionKey
 * @returns {boolean}
 */
export function shouldResetForAccountChange(previousSessionKey, nextSessionKey) {
  if (previousSessionKey === undefined) return nextSessionKey === null;
  return previousSessionKey !== nextSessionKey;
}
