import { useEffect, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { useActiveAccount } from "~/hooks/useTenantIdentity";
import { fetchTenantIdentity } from "~/lib/graph/organization";
import { shouldResetForAccountChange } from "~/lib/graph/tenantIdentity";
import { resetTenantSession, useNukeTuneStore } from "~/store";

/**
 * Renders nothing. Keeps the store bound to the active account:
 * - resets all tenant-scoped state when the account changes or signs out
 *   (logoutPopup navigates without a reload, so the store would otherwise
 *   carry tenant A's selections and objects into tenant B), and
 * - looks up the tenant's display name and primary domain after sign-in.
 */
export function TenantSessionSync() {
  const { inProgress } = useMsal();
  const account = useActiveAccount();
  const homeAccountId = account?.homeAccountId ?? null;
  const previousHomeAccountId = useRef<string | null | undefined>(undefined);
  const lookupGeneration = useRef(0);

  useEffect(() => {
    if (shouldResetForAccountChange(previousHomeAccountId.current, homeAccountId)) {
      // Invalidate any in-flight lookup for the previous account.
      lookupGeneration.current += 1;
      resetTenantSession();
    }
    previousHomeAccountId.current = homeAccountId;
  }, [homeAccountId]);

  useEffect(() => {
    if (!account || inProgress !== "none") return;
    const store = useNukeTuneStore.getState();
    if (store.tenantStatus !== "idle") return;

    const generation = ++lookupGeneration.current;
    const accountTenantId = account.tenantId || null;
    store.setUser(account.name ?? account.username, accountTenantId, null);
    store.setTenantInfo({
      tenantId: accountTenantId,
      tenantName: null,
      tenantDomain: null,
      tenantStatus: "loading",
    });

    fetchTenantIdentity(accountTenantId)
      .then((identity) => {
        if (generation !== lookupGeneration.current) return;
        useNukeTuneStore.getState().setTenantInfo({
          tenantId: identity.id,
          tenantName: identity.displayName,
          tenantDomain: identity.primaryDomain,
          tenantStatus: "loaded",
        });
      })
      .catch((error: unknown) => {
        if (generation !== lookupGeneration.current) return;
        console.warn("Tenant organization lookup failed", error);
        useNukeTuneStore.getState().setTenantInfo({
          tenantId: accountTenantId,
          tenantName: null,
          tenantDomain: null,
          tenantStatus: "failed",
        });
      });
  }, [account, inProgress]);

  return null;
}
