import { Client } from "@microsoft/microsoft-graph-client";
import {
  InteractionRequiredAuthError,
  type AccountInfo,
  type AuthenticationResult,
} from "@azure/msal-browser";
import { msalInstance, loginRequest } from "../msal";
import {
  COMMERCIAL_AUTHORITY_ORIGIN,
  COMMERCIAL_GRAPH_BASE_URL,
} from "../msal/commercialCloud";
import type {
  GraphListResponse,
  IntuneObject,
  GraphError,
} from "~/types/intune";

async function getAccessToken(): Promise<string> {
  const account = msalInstance.getActiveAccount();
  if (!account) {
    throw new Error("No active account. Please sign in.");
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    return response.accessToken;
  } catch (error) {
    // Only an interaction-required failure can be fixed by a popup; anything
    // else (network, config) should surface as-is.
    if (!(error instanceof InteractionRequiredAuthError)) {
      throw error;
    }
    const response = await acquireTokenInteractively(account);
    return response.accessToken;
  }
}

// Several Graph requests run concurrently; when the silent call fails for all
// of them they must share one popup instead of each opening their own.
let interactiveRequest: Promise<AuthenticationResult> | null = null;

const TENANT_ID_PATTERN = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

// Interactive requests take their tenant from the authority, not from the
// account. Against /common a session in a resource tenant would come back as
// the user's home tenant and be rejected below, so target the account's own
// tenant when it is a well-formed tenant ID.
function tenantAuthority(account: AccountInfo): string | undefined {
  return TENANT_ID_PATTERN.test(account.tenantId)
    ? `${COMMERCIAL_AUTHORITY_ORIGIN}/${account.tenantId}`
    : undefined;
}

// The popup is locked to the active account, and its result is checked
// against it: a token for another account or tenant must never be used while
// the UI shows, and asks the user to confirm, the active one.
function acquireTokenInteractively(
  account: AccountInfo
): Promise<AuthenticationResult> {
  interactiveRequest ??= msalInstance
    .acquireTokenPopup({
      ...loginRequest,
      account,
      authority: tenantAuthority(account),
    })
    .then((response) => {
      const received = response.account;
      if (
        received.homeAccountId !== account.homeAccountId ||
        received.tenantId !== account.tenantId
      ) {
        throw new Error(
          "Signed in with a different account or tenant than the active session. Sign out and sign in again to switch."
        );
      }
      return response;
    })
    .finally(() => {
      interactiveRequest = null;
    });
  return interactiveRequest;
}

export async function getGraphClient(): Promise<Client> {
  const accessToken = await getAccessToken();

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

export async function graphGet<T>(
  endpoint: string,
  useBeta = true,
): Promise<T> {
  const client = await getGraphClient();
  const baseUrl = useBeta
    ? `${COMMERCIAL_GRAPH_BASE_URL}/beta`
    : `${COMMERCIAL_GRAPH_BASE_URL}/v1.0`;
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return client.api(`${baseUrl}${url}`).get() as Promise<T>;
}

export async function graphGetAllPages<T extends IntuneObject>(
  endpoint: string,
  useBeta = true,
): Promise<T[]> {
  const allItems: T[] = [];
  let nextLink: string | undefined = undefined;
  const client = await getGraphClient();
  const baseUrl = useBeta
    ? `${COMMERCIAL_GRAPH_BASE_URL}/beta`
    : `${COMMERCIAL_GRAPH_BASE_URL}/v1.0`;
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  let response = (await client
    .api(`${baseUrl}${url}`)
    .get()) as GraphListResponse<T>;

  if (response.value && Array.isArray(response.value)) {
    allItems.push(...response.value);
  }
  nextLink = response["@odata.nextLink"];

  while (nextLink) {
    response = (await client.api(nextLink).get()) as GraphListResponse<T>;
    if (response.value && Array.isArray(response.value)) {
      allItems.push(...response.value);
    }
    nextLink = response["@odata.nextLink"];
  }

  return allItems;
}

export async function graphDelete(
  endpoint: string,
  useBeta = true,
): Promise<void> {
  const client = await getGraphClient();
  const baseUrl = useBeta
    ? `${COMMERCIAL_GRAPH_BASE_URL}/beta`
    : `${COMMERCIAL_GRAPH_BASE_URL}/v1.0`;
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  await client.api(`${baseUrl}${url}`).delete();
}

export function parseGraphError(error: unknown): GraphError {
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;

    if (typeof err.statusCode === "number" && typeof err.code === "string") {
      return {
        statusCode: err.statusCode,
        code: err.code,
        message: typeof err.message === "string" && err.message ? err.message : "Unknown error",
        requestId: err.requestId as string | undefined,
      };
    }

    if (err.body && typeof err.body === "string") {
      try {
        const body = JSON.parse(err.body) as {
          error?: { code?: string; message?: string };
        };
        if (body.error) {
          return {
            statusCode: (err.statusCode as number) ?? 500,
            code: body.error.code ?? "UnknownError",
            message: body.error.message ?? "Unknown error",
          };
        }
      } catch {
        // ignore parse error
      }
    }
  }

  const statusCode =
    error && typeof error === "object" &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 500;

  return {
    statusCode,
    code: "UnknownError",
    message:
      error instanceof Error ? error.message : "An unknown error occurred",
  };
}
