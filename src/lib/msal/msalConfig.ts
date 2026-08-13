import { type Configuration, LogLevel } from "@azure/msal-browser";
import {
  COMMERCIAL_COMMON_AUTHORITY,
  COMMERCIAL_GRAPH_BASE_URL,
} from "./commercialCloud";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID ?? "",
    authority: COMMERCIAL_COMMON_AUTHORITY,
    redirectUri:
      process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI ??
      (typeof window !== "undefined" ? window.location.origin : ""),
    postLogoutRedirectUri:
      process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI ??
      (typeof window !== "undefined" ? window.location.origin : ""),
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
    "DeviceManagementScripts.ReadWrite.All",
    "Policy.ReadWrite.ConditionalAccess",
    "Policy.Read.All",
    "DeviceManagementRBAC.ReadWrite.All",
    "Group.ReadWrite.All",
  ],
};

export const graphScopes = {
  default: [`${COMMERCIAL_GRAPH_BASE_URL}/.default`],
};
