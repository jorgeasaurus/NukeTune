export type CloudEnvironment = "global" | "usgov" | "usgovdod" | "germany" | "china";

export const CLOUD_ENVIRONMENTS = {
  global: {
    authority: "https://login.microsoftonline.com",
    graphEndpoint: "https://graph.microsoft.com",
  },
  usgov: {
    authority: "https://login.microsoftonline.us",
    graphEndpoint: "https://graph.microsoft.us",
  },
  usgovdod: {
    authority: "https://login.microsoftonline.us",
    graphEndpoint: "https://dod-graph.microsoft.us",
  },
  germany: {
    authority: "https://login.microsoftonline.de",
    graphEndpoint: "https://graph.microsoft.de",
  },
  china: {
    authority: "https://login.chinacloudapi.cn",
    graphEndpoint: "https://microsoftgraph.chinacloudapi.cn",
  },
} as const;

export function getAuthorityUrl(
  environment: CloudEnvironment = "global",
  tenantId = "common"
): string {
  return `${CLOUD_ENVIRONMENTS[environment].authority}/${tenantId}`;
}

export function getGraphEndpoint(environment: CloudEnvironment = "global"): string {
  return CLOUD_ENVIRONMENTS[environment].graphEndpoint;
}
