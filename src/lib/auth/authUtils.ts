import type { AccountInfo } from "@azure/msal-browser";
import { msalInstance, loginRequest } from "~/lib/msal";
import {
  COMMERCIAL_COMMON_AUTHORITY,
  isCommercialAuthorityEnvironment,
} from "~/lib/msal/commercialCloud";

export async function signIn(): Promise<AccountInfo> {
  const response = await msalInstance.loginPopup({
    ...loginRequest,
    authority: COMMERCIAL_COMMON_AUTHORITY,
  });

  if (response.account) {
    if (!isCommercialAuthorityEnvironment(response.account.environment)) {
      try {
        await msalInstance.clearCache({ account: response.account });
      } catch (error) {
        console.error("Failed to clear an unsupported cloud account", error);
      }
      throw new Error(
        "Sign in failed: NukeTune supports Global Commercial tenants only",
      );
    }
    msalInstance.setActiveAccount(response.account);
    return response.account;
  }
  throw new Error("Sign in failed: No account returned");
}
