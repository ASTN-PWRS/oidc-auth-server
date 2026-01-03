import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import nunjucks from "nunjucks";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Provider } from "oidc-provider";

import { config } from "./config/env.js";
//import { pgPool } from "./src/db/pg.js";
import { redis } from "./db/redis.js";
import { loadClientsToRedis } from "./oidc/clients.js";
//import { findClient } from "./oidc/findClient.js";
import { findAccount } from "./oidc/findAccount.js";
import { interactionCheck } from "./oidc/interactionCheck.js";
import { PostgresAdapter } from "./oidc/postgres-adapter.js";
import { jwks } from "./config/jwks.js";
import { createApiRouter } from "./routes/api.js";
import { createWebRouter } from "./routes/web.js";
//middleware
import { scriptCollector } from "./middleware/scriptCollector.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
await redis.connect();

const app = express();
//一部のプロキシ（例：IIS + web.config）では、Host ヘッダーが localhost のままになるのを回避する
//対策
app.set("trust proxy", true);
// nunjucks の設定
nunjucks.configure(path.join(__dirname, "templates"), {
  autoescape: true,
  noCache: true,
  express: app,
  watch: false,
});

const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(["templates", "templates/components"]),
  { autoescape: true }
);
env.addGlobal("renderComponent", function (name, context = {}) {
  const scriptPath = path.join(
    __dirname,
    "templates",
    "components",
    `${name}.js`
  );
  const templatePath = path.join("components", `${name}.njk`);

  // 呼び出し元のテンプレートの context から usedScripts を取得
  const callerContext = this.ctx || {};
  const usedScripts = callerContext.usedScripts;

  if (fs.existsSync(scriptPath) && usedScripts) {
    usedScripts.add(`/components/${name}.js`);
  }

  const output = env.render(templatePath, context);
  return new nunjucks.runtime.SafeString(output);
});

env.addGlobal("renderScripts", function () {
  const callerContext = this.ctx || {};
  const usedScripts = callerContext.usedScripts;

  if (!usedScripts) return "";

  let output = "";
  for (const src of usedScripts) {
    output += `<script src="${src}"></script>\n`;
  }
  return new nunjucks.runtime.SafeString(output);
});

await loadClientsToRedis();

const oidc = new Provider(config.issuer, {
  jwks,
  adapter: PostgresAdapter,
  findAccount,
  interactionCheck,
  features: { devInteractions: { enabled: false } },
  interactions: {
    url(ctx, interaction) {
      return `/interaction/${interaction.uid}`;
    },
  },
  session: {
    rolling: true,
    rollingDuration: 3600,
    cookie: {
      secure: false,
      path: "/", // ← 追加
      sameSite: "lax",
    },
  },
  ttl: {
    Interaction: 15 * 60, // 15 分
    Session: 2 * 60 * 60, // 2 時間
    Grant: 7 * 24 * 60 * 60, // 7 日
    AccessToken: 60 * 60, // 1 時間
    RefreshToken: 30 * 24 * 60 * 60,
  },
  claims: {
    openid: ["sub"],
    profile: ["preferred_username"],
    email: ["email", "email_verified"],
    acr: null,
  },
  cookies: {
    long: {
      signed: true,
      maxAge: 24 * 60 * 60 * 1000,
      path: "/", // ← 追加
      sameSite: "lax",
    },
    short: {
      signed: true,
      maxAge: 60 * 60 * 1000,
      path: "/", // ← 追加
      sameSite: "lax",
    },
    secure: false,
  },
  renderError: async (ctx, out, error) => {
    ctx.type = "html";
    ctx.status = typeof out.statusCode === "number" ? out.statusCode : 400;
    ctx.body = `
    <html>
      <head>
        <title>エラーが発生しました</title>
      </head>
      <body> 
        <h1>エラー: ${out.error}</h1>
        <p>${out.error_description}</p>
        <p>詳細: ${error.message}</p>
      </body>
    </html> `;
  },
});
oidc.keys = ["super-secret-key"];
oidc.proxy = true;

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// middleware
app.use(scriptCollector);
// CORS
app.use(cors({ origin: true, credentials: true }));
// router
app.use("/", createWebRouter(oidc));
app.use("/", createApiRouter(oidc));
//
// エラーハンドリング
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    res.status(403).send("CSRFトークンが無効です。");
  } else {
    console.error(err);
    res.status(500).send("サーバーエラー");
  }
});
app.use(oidc.callback());

createServer(app).listen(config.port, () => {
  console.log(
    `OIDC + API server running at ${config.issuer}/.well-known/openid-configuration`
  );
});
