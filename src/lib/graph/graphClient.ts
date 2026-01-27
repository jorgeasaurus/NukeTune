import { Client } from "@microsoft/microsoft-graph-client";
import { msalInstance, loginRequest } from "../msal";
import type { GraphListResponse, IntuneObject, GraphError } from "~/types/intune";

const GRAPH_BASE_URL = "https://graph.microsoft.com";

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
  } catch {
    const response = await msalInstance.acquireTokenPopup(loginRequest);
    return response.accessToken;
  }
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
  useBeta = true
): Promise<T> {
  const client = await getGraphClient();
  const baseUrl = useBeta ? `${GRAPH_BASE_URL}/beta` : `${GRAPH_BASE_URL}/v1.0`;
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return client.api(`${baseUrl}${url}`).get() as Promise<T>;
}

export async function graphGetAllPages<T extends IntuneObject>(
  endpoint: string,
  useBeta = true
): Promise<T[]> {
  const allItems: T[] = [];
  let nextLink: string | undefined = undefined;
  const client = await getGraphClient();
  const baseUrl = useBeta ? `${GRAPH_BASE_URL}/beta` : `${GRAPH_BASE_URL}/v1.0`;
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
  useBeta = true
): Promise<void> {
  const client = await getGraphClient();
  const baseUrl = useBeta ? `${GRAPH_BASE_URL}/beta` : `${GRAPH_BASE_URL}/v1.0`;
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  await client.api(`${baseUrl}${url}`).delete();
}

export function parseGraphError(error: unknown): GraphError {
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;

    if (err.statusCode && err.code) {
      return {
        statusCode: err.statusCode as number,
        code: err.code as string,
        message: (err.message as string) ?? "Unknown error",
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

  return {
    statusCode: 500,
    code: "UnknownError",
    message: error instanceof Error ? error.message : "An unknown error occurred",
  };
}

export function isRetryableError(error: GraphError): boolean {
  return error.statusCode >= 500 || error.statusCode === 429;
}
