import { Provider } from "oidc-provider";
//import { findClient } from "./oidc/findClient.js";
import { findAccount } from "./findAccount.js";
import { interactionCheck } from "./interactionCheck.js";
import { PostgresAdapter } from "./postgres-adapter.js";
import { jwks } from "./jwks.js";
//
import { config } from "../config/env.js";

export const oidc = new Provider(config.issuer, {
  jwks: {
    keys: [jwks],
  },
  adapter: PostgresAdapter,
  findAccount,
  interactionCheck,
  features: {
    devInteractions: { enabled: false },
  },
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
