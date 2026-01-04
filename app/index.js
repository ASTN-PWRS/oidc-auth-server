import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { oidc } from "../oidc/index.js";
// router
import { createApiRouter } from "../routes/api.js";
import { createWebRouter } from "../routes/web.js";

// middleware
import { scriptCollector } from "../middleware/scriptCollector.js";

export const app = express();
//一部のプロキシ（例：IIS + web.config）では、Host ヘッダーが localhost のままになるのを回避する
//対策
app.set("trust proxy", true);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parentDir = path.resolve(__dirname, "..");
app.use("/", express.static(path.join(parentDir, "public")));

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// middleware
app.use(scriptCollector);
// CORS
app.use(cors({ origin: true, credentials: true }));
// router
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

// router
app.use("/", createWebRouter(oidc));
app.use("/", createApiRouter(oidc));
//最後に設定
app.use(oidc.callback());
