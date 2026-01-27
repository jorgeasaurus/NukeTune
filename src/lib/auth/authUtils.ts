import type { AccountInfo } from "@azure/msal-browser";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalInstance, loginRequest } from "~/lib/msal";
import type { CloudEnvironment } from "~/types/cloud";
import { getAuthorityUrl } from "~/types/cloud";

let selectedCloudEnvironment: CloudEnvironment = "global";

export function getSelectedCloudEnvironment(): CloudEnvironment {
  return selectedCloudEnvironment;
}

export function setSelectedCloudEnvironment(environment: CloudEnvironment): void {
  selectedCloudEnvironment = environment;
  if (typeof window !== "undefined") {
    sessionStorage.setItem("cloudEnvironment", environment);
  }
}

export function loadCloudEnvironmentFromSession(): CloudEnvironment {
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("cloudEnvironment");
    if (stored && ["global", "usgov", "usgovdod", "germany", "china"].includes(stored)) {
      selectedCloudEnvironment = stored as CloudEnvironment;
    }
  }
  return selectedCloudEnvironment;
}

export function getActiveAccount(): AccountInfo | null {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    return accounts[0] ?? null;
  }
  return null;
}

export async function getAccessToken(): Promise<string> {
  const account = getActiveAccount();

  if (!account) {
    throw new Error("No active account found. Please sign in.");
  }

  const authority = getAuthorityUrl(selectedCloudEnvironment, account.tenantId);

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
      authority,
    });
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      const popupRedirectUri = `${window.location.origin}/blank.html`;
      const response = await msalInstance.acquireTokenPopup({
        ...loginRequest,
        authority,
        redirectUri: popupRedirectUri,
      });
      return response.accessToken;
    }
    throw error;
  }
}

export async function signIn(cloudEnvironment: CloudEnvironment = "global"): Promise<AccountInfo> {
  setSelectedCloudEnvironment(cloudEnvironment);
  const authority = getAuthorityUrl(cloudEnvironment, "common");
  const popupRedirectUri = `${window.location.origin}/blank.html`;

  const response = await msalInstance.loginPopup({
    ...loginRequest,
    authority,
    redirectUri: popupRedirectUri,
  });

  if (response.account) {
    msalInstance.setActiveAccount(response.account);
    return response.account;
  }
  throw new Error("Sign in failed: No account returned");
}

export async function signOut(): Promise<void> {
  const account = getActiveAccount();
  if (account) {
    await msalInstance.logoutPopup({
      account,
    });
  }
}

export function isAuthenticated(): boolean {
  return getActiveAccount() !== null;
}
