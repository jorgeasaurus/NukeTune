import { graphGet } from "./graphClient";
import { deriveTenantIdentity, type TenantIdentity } from "./tenantIdentity";

export type { TenantIdentity };

/**
 * Look up the signed-in tenant's organization record. Readable with User.Read.
 * Throws if the response is unusable or belongs to a different tenant than
 * `expectedTenantId`.
 */
export async function fetchTenantIdentity(
  expectedTenantId: string | null | undefined,
): Promise<TenantIdentity> {
  const response = await graphGet<unknown>(
    "/organization?$select=id,displayName,verifiedDomains",
    false,
  );
  const identity = deriveTenantIdentity(response, expectedTenantId);
  if (!identity) {
    throw new Error(
      "Organization lookup returned no matching tenant for the signed-in account",
    );
  }
  return identity;
}
