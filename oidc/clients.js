import { pgPool } from "../db/pg.js";
import { redis } from "../db/redis.js";

export async function loadClientsToRedis() {
  const res = await pgPool.query("SELECT * FROM oidc_clients");
  for (const client of res.rows) {
    delete client.created_at;
    delete client.updated_at;
    const newclient = {
      ...client,
      scope: Array.isArray(client.scope)
        ? client.scope.join(" ")
        : client.scope,
    };
    await redis.set(
      `oidc:client:${client.client_id}`,
      JSON.stringify(newclient)
    );
  }
  console.log(`Loaded ${res.rowCount} clients into Redis`);
}
