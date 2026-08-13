import {
  PublicClientApplication,
  EventType,
  type EventMessage,
  type AuthenticationResult,
  type AccountInfo,
} from "@azure/msal-browser";
import { msalConfig } from "./msalConfig";
import { isCommercialAuthorityEnvironment } from "./commercialCloud";

export const msalInstance = new PublicClientApplication(msalConfig);

async function clearUnsupportedAccount(account: AccountInfo): Promise<void> {
  try {
    await msalInstance.clearCache({ account });
  } catch (error) {
    console.error("Failed to clear an unsupported cloud account", error);
  }
}

export async function initializeMsal(): Promise<void> {
  await msalInstance.initialize();

  const accounts = msalInstance.getAllAccounts();
  const commercialAccounts = accounts.filter((account) =>
    isCommercialAuthorityEnvironment(account.environment),
  );
  const incompatibleAccounts = accounts.filter(
    (account) => !isCommercialAuthorityEnvironment(account.environment),
  );

  await Promise.all(incompatibleAccounts.map(clearUnsupportedAccount));
  msalInstance.setActiveAccount(commercialAccounts[0] ?? null);

  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult;
      if (isCommercialAuthorityEnvironment(payload.account.environment)) {
        msalInstance.setActiveAccount(payload.account);
      } else {
        msalInstance.setActiveAccount(null);
        void clearUnsupportedAccount(payload.account);
      }
    }
  });

  await msalInstance.handleRedirectPromise();
}
