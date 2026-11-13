import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import type { AccountInfo } from "@azure/msal-browser";
import { useShallow } from "zustand/react/shallow";
import { useNukeTuneStore, type TenantStatus } from "~/store";
import {
  formatTenantLabel,
  isGuestAccount,
  getConfirmationPhrase,
  getUpnDomain,
  type ConfirmationPhrase,
} from "~/lib/graph/tenantIdentity";

/**
 * The MSAL *active* account — the one Graph calls are made with — kept in
 * React state and refreshed on every MSAL event (login, logout, active account
 * change).
 */
export function useActiveAccount(): AccountInfo | null {
  const { instance, accounts } = useMsal();
  const [account, setAccount] = useState<AccountInfo | null>(() =>
    instance.getActiveAccount(),
  );

  useEffect(() => {
    const sync = () => {
      const next = instance.getActiveAccount();
      setAccount((prev) =>
        prev?.homeAccountId === next?.homeAccountId &&
        prev?.tenantId === next?.tenantId
          ? prev
          : next,
      );
    };
    sync();
    const callbackId = instance.addEventCallback(sync);
    return () => {
      if (callbackId) instance.removeEventCallback(callbackId);
    };
  }, [instance, accounts]);

  return account;
}

export interface TenantDisplay {
  account: AccountInfo | null;
  /** e.g. "Contoso (contoso.com)"; falls back to account domain / tenant GUID. */
  label: string;
  tenantId: string | null;
  tenantName: string | null;
  /**
   * Primary domain from the org lookup, else the account's UPN domain. Null
   * for a guest whose lookup failed: their UPN domain is their home tenant.
   */
  domain: string | null;
  status: TenantStatus;
  /** True when the label comes from the verified organization record. */
  verified: boolean;
  confirmation: ConfirmationPhrase;
}

export function useTenantDisplay(): TenantDisplay {
  const account = useActiveAccount();
  const { tenantId, tenantName, tenantDomain, tenantStatus } = useNukeTuneStore(
    useShallow((state) => ({
      tenantId: state.tenantId,
      tenantName: state.tenantName,
      tenantDomain: state.tenantDomain,
      tenantStatus: state.tenantStatus,
    })),
  );

  const username = account?.username ?? null;
  // A guest's UPN domain is their home tenant, not the one being modified.
  const isGuest = isGuestAccount(account);
  const resolvedTenantId = tenantId ?? account?.tenantId ?? null;

  return {
    account,
    label: formatTenantLabel({
      tenantName,
      tenantDomain,
      tenantId: resolvedTenantId,
      username,
      isGuest,
    }),
    tenantId: resolvedTenantId,
    tenantName,
    domain: tenantDomain ?? (isGuest ? null : getUpnDomain(username)),
    status: tenantStatus,
    verified: tenantStatus === "loaded" && Boolean(tenantName ?? tenantDomain),
    confirmation: getConfirmationPhrase({ tenantDomain, username, isGuest }),
  };
}
