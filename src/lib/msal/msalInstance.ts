import {
  PublicClientApplication,
  EventType,
  type EventMessage,
  type AuthenticationResult,
} from "@azure/msal-browser";
import { msalConfig } from "./msalConfig";
import { isCommercialAuthorityEnvironment } from "./commercialCloud";

export const msalInstance = new PublicClientApplication(msalConfig);

export async function initializeMsal(): Promise<void> {
  await msalInstance.initialize();

  const accounts = msalInstance.getAllAccounts();
  const commercialAccounts = accounts.filter((account) =>
    isCommercialAuthorityEnvironment(account.environment),
  );
  const incompatibleAccounts = accounts.filter(
    (account) => !isCommercialAuthorityEnvironment(account.environment),
  );

  await Promise.all(
    incompatibleAccounts.map((account) => msalInstance.clearCache({ account })),
  );
  msalInstance.setActiveAccount(commercialAccounts[0] ?? null);

  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult;
      if (isCommercialAuthorityEnvironment(payload.account.environment)) {
        msalInstance.setActiveAccount(payload.account);
      } else {
        msalInstance.setActiveAccount(null);
        void msalInstance.clearCache({ account: payload.account });
      }
    }
  });

  await msalInstance.handleRedirectPromise();
}
