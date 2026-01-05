import { createServer } from "http";
import { config } from "./config/env.js";
import { loadClientsToRedis } from "./oidc/clients.js";
import { app } from "./app/index.js";
import { initEngine } from "./engine/index.js";

//Initialize template engine
initEngine(app);

//Connect Redis Server
await loadClientsToRedis();

createServer(app).listen(config.port, () => {
  console.log(
    `OIDC + API server running at ${config.issuer}/.well-known/openid-configuration`
  );
});
