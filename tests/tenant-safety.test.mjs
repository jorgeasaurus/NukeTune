import assert from "node:assert/strict";
import test from "node:test";

import {
  GENERIC_CONFIRMATION_PHRASE,
  deriveTenantIdentity,
  formatTenantLabel,
  getConfirmationPhrase,
  getPrimaryDomain,
  getUpnDomain,
  isConfirmationMatch,
  shouldResetForAccountChange,
} from "../src/lib/graph/tenantIdentity.js";

const TENANT_ID = "11111111-2222-3333-4444-555555555555";

test("primary domain prefers the default verified domain", () => {
  assert.equal(
    getPrimaryDomain([
      { name: "contoso.onmicrosoft.com", isDefault: false, isInitial: true },
      { name: "Contoso.com", isDefault: true, isInitial: false },
    ]),
    "contoso.com",
  );
});

test("primary domain falls back to the initial onmicrosoft.com domain", () => {
  assert.equal(
    getPrimaryDomain([
      { name: "other.example", isDefault: false, isInitial: false },
      { name: "contoso.onmicrosoft.com", isDefault: false, isInitial: true },
    ]),
    "contoso.onmicrosoft.com",
  );
  assert.equal(getPrimaryDomain([{ name: "x.example" }]), null);
  assert.equal(getPrimaryDomain(undefined), null);
  assert.equal(getPrimaryDomain([null, "junk", { isDefault: true }]), null);
});

test("organization response is mapped to tenant identity", () => {
  const response = {
    value: [
      {
        id: TENANT_ID,
        displayName: "Contoso",
        verifiedDomains: [
          { name: "contoso.onmicrosoft.com", isInitial: true, isDefault: false },
          { name: "contoso.com", isInitial: false, isDefault: true },
        ],
      },
    ],
  };
  assert.deepEqual(deriveTenantIdentity(response, TENANT_ID.toUpperCase()), {
    id: TENANT_ID,
    displayName: "Contoso",
    primaryDomain: "contoso.com",
  });
});

test("organization from a different tenant than the account is rejected", () => {
  const response = { value: [{ id: "99999999-0000-0000-0000-000000000000", displayName: "Fabrikam" }] };
  assert.equal(deriveTenantIdentity(response, TENANT_ID), null);
});

test("unusable organization responses yield null", () => {
  assert.equal(deriveTenantIdentity(null, TENANT_ID), null);
  assert.equal(deriveTenantIdentity({}, TENANT_ID), null);
  assert.equal(deriveTenantIdentity({ value: [] }, TENANT_ID), null);
  assert.equal(deriveTenantIdentity({ value: [{ displayName: "No id" }] }, TENANT_ID), null);
  assert.deepEqual(deriveTenantIdentity({ value: [{ id: TENANT_ID, displayName: "  " }] }, TENANT_ID), {
    id: TENANT_ID,
    displayName: null,
    primaryDomain: null,
  });
});

test("UPN domain extraction", () => {
  assert.equal(getUpnDomain("Admin@Contoso.com"), "contoso.com");
  assert.equal(
    getUpnDomain("guest_fabrikam.com#EXT#@contoso.onmicrosoft.com"),
    "contoso.onmicrosoft.com",
  );
  assert.equal(getUpnDomain("no-at-sign"), null);
  assert.equal(getUpnDomain("trailing@"), null);
  assert.equal(getUpnDomain("@leading.com"), null);
  assert.equal(getUpnDomain("user@localhost"), null);
  assert.equal(getUpnDomain(null), null);
});

test("confirmation phrase prefers tenant domain, then account domain, then DELETE", () => {
  assert.deepEqual(
    getConfirmationPhrase({ tenantDomain: "Contoso.com", username: "a@other.com" }),
    { phrase: "contoso.com", source: "tenant" },
  );
  assert.deepEqual(
    getConfirmationPhrase({ tenantDomain: null, username: "a@Fabrikam.com" }),
    { phrase: "fabrikam.com", source: "account" },
  );
  assert.deepEqual(getConfirmationPhrase({ tenantDomain: "", username: "nobody" }), {
    phrase: GENERIC_CONFIRMATION_PHRASE,
    source: "generic",
  });
  assert.equal(GENERIC_CONFIRMATION_PHRASE, "DELETE");
});

test("confirmation matching is trimmed, case-insensitive and exact", () => {
  assert.equal(isConfirmationMatch("contoso.com", "contoso.com"), true);
  assert.equal(isConfirmationMatch("  CONTOSO.COM \n", "contoso.com"), true);
  assert.equal(isConfirmationMatch("delete", "DELETE"), true);
  assert.equal(isConfirmationMatch("contoso", "contoso.com"), false);
  assert.equal(isConfirmationMatch("contoso.com.", "contoso.com"), false);
  assert.equal(isConfirmationMatch("www.contoso.com", "contoso.com"), false);
  assert.equal(isConfirmationMatch("DELETE", "contoso.com"), false);
  assert.equal(isConfirmationMatch("", ""), false);
  assert.equal(isConfirmationMatch("   ", "  "), false);
});

test("tenant label falls back from name+domain to domain to tenant id", () => {
  assert.equal(
    formatTenantLabel({ tenantName: "Contoso", tenantDomain: "contoso.com", tenantId: TENANT_ID }),
    "Contoso (contoso.com)",
  );
  assert.equal(
    formatTenantLabel({ tenantName: "contoso.com", tenantDomain: "contoso.com" }),
    "contoso.com",
  );
  assert.equal(
    formatTenantLabel({ tenantName: null, tenantDomain: null, tenantId: TENANT_ID, username: "a@fabrikam.com" }),
    "fabrikam.com",
  );
  assert.equal(
    formatTenantLabel({ tenantName: null, tenantDomain: null, tenantId: TENANT_ID, username: "x" }),
    `Tenant ${TENANT_ID}`,
  );
  assert.equal(formatTenantLabel({}), "Unknown tenant");
});

test("store reset fires on account switch and sign-out, not on first sign-in", () => {
  assert.equal(shouldResetForAccountChange(undefined, "a"), false);
  assert.equal(shouldResetForAccountChange(undefined, null), true);
  assert.equal(shouldResetForAccountChange("a", "a"), false);
  assert.equal(shouldResetForAccountChange("a", "b"), true);
  assert.equal(shouldResetForAccountChange("a", null), true);
  assert.equal(shouldResetForAccountChange(null, "b"), true);
});

test("modal focus trap wraps Tab at the edges and pulls stray focus inside", async () => {
  const { getWrappedFocusIndex } = await import("../src/hooks/focusTrap.js");
  assert.equal(getWrappedFocusIndex(2, 3, false), 0);
  assert.equal(getWrappedFocusIndex(0, 3, true), 2);
  assert.equal(getWrappedFocusIndex(1, 3, false), null);
  assert.equal(getWrappedFocusIndex(1, 3, true), null);
  assert.equal(getWrappedFocusIndex(-1, 3, false), 0);
  assert.equal(getWrappedFocusIndex(-1, 3, true), 2);
  assert.equal(getWrappedFocusIndex(0, 1, false), 0);
  assert.equal(getWrappedFocusIndex(0, 0, false), null);
});

test("guest accounts never fall back to their home UPN domain", async () => {
  const { isGuestAccount } = await import("../src/lib/graph/tenantIdentity.js");
  const HOME = "11111111-1111-1111-1111-111111111111";
  const RESOURCE = "22222222-2222-2222-2222-222222222222";

  assert.equal(isGuestAccount({ homeAccountId: `oid.${HOME}`, tenantId: HOME.toUpperCase() }), false);
  assert.equal(isGuestAccount({ homeAccountId: `oid.${HOME}`, tenantId: RESOURCE }), true);
  assert.equal(isGuestAccount({ homeAccountId: "no-separator", tenantId: RESOURCE }), false);
  assert.equal(isGuestAccount(null), false);

  assert.deepEqual(
    getConfirmationPhrase({ tenantDomain: null, username: "a@home.com", isGuest: true }),
    { phrase: "DELETE", source: "generic" },
  );
  assert.deepEqual(
    getConfirmationPhrase({ tenantDomain: "resource.com", username: "a@home.com", isGuest: true }),
    { phrase: "resource.com", source: "tenant" },
  );
  assert.equal(
    formatTenantLabel({ tenantId: RESOURCE, username: "a@home.com", isGuest: true }),
    `Tenant ${RESOURCE}`,
  );
});

test("the same user in a different resource tenant is a different session", async () => {
  const { getTenantSessionKey } = await import("../src/lib/graph/tenantIdentity.js");
  const HOME = "11111111-1111-1111-1111-111111111111";
  const RESOURCE = "22222222-2222-2222-2222-222222222222";
  const inHome = getTenantSessionKey({ homeAccountId: `oid.${HOME}`, tenantId: HOME });
  const inResource = getTenantSessionKey({ homeAccountId: `oid.${HOME}`, tenantId: RESOURCE });

  assert.notEqual(inHome, inResource);
  assert.equal(shouldResetForAccountChange(inHome, inResource), true);
  assert.equal(
    shouldResetForAccountChange(
      inHome,
      getTenantSessionKey({ homeAccountId: `OID.${HOME}`, tenantId: HOME.toUpperCase() }),
    ),
    false,
  );
  assert.equal(getTenantSessionKey(null), null);
  assert.equal(getTenantSessionKey({ tenantId: HOME }), null);
});
