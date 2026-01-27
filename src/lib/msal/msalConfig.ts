import { type Configuration, LogLevel } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID ?? "",
    authority: process.env.NEXT_PUBLIC_MSAL_AUTHORITY ?? "https://login.microsoftonline.com/common",
    redirectUri: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI ?? (typeof window !== "undefined" ? window.location.origin : ""),
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI ?? (typeof window !== "undefined" ? window.location.origin : ""),
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: [
    "User.Read",
    "DeviceManagementManagedDevices.ReadWrite.All",
    "DeviceManagementServiceConfig.ReadWrite.All",
    "DeviceManagementConfiguration.ReadWrite.All",
    "DeviceManagementApps.ReadWrite.All",
    "Policy.ReadWrite.ConditionalAccess",
    "Policy.Read.All",
    "DeviceManagementRBAC.ReadWrite.All",
  ],
};

export const graphScopes = {
  default: ["https://graph.microsoft.com/.default"],
};

export type CloudEnvironment = "global" | "usgov" | "usgovdod" | "germany" | "china";

export const cloudEnvironment: CloudEnvironment =
  (process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT as CloudEnvironment) ?? "global";
