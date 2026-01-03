import { redis } from "../db/redis.js";

export async function findClient(clientId) {
  const data = await redis.get(`oidc:client:${clientId}`);
  if (!data) return undefined;

  const client = JSON.parse(data);
  const result = {
    ...client,
    default_acr_values: client.default_acr_values ?? ["urn:pwd"],
    require_consent: !client.trusted,
  };
  //console.log("client data", result);
  return result;
}
