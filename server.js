// import path from "path";
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import nunjucks from "nunjucks";
// import { fileURLToPath } from "url";
import { createServer } from "http";

import { config } from "./config/env.js";
import { loadClientsToRedis } from "./oidc/clients.js";
import { oidc } from "./oidc/index.js";
import { createApiRouter } from "./routes/api.js";
import { createWebRouter } from "./routes/web.js";
import { app } from "./app/index.js";
import { initEngine } from "./engine/index.js";

//Initialize template engine
initEngine(app);

//Connect Redis Server
await loadClientsToRedis();

// router
app.use("/", createWebRouter(oidc));
app.use("/", createApiRouter(oidc));
//最後に設定
app.use(oidc.callback());

createServer(app).listen(config.port, () => {
  console.log(
    `OIDC + API server running at ${config.issuer}/.well-known/openid-configuration`
  );
});
