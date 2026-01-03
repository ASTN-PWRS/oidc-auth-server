// web.js
import express from "express";
import { csrfTokenSetter, csrfVerifier } from "../middleware/csrfMiddleware.js";

export function createWebRouter(provider) {
  const router = express.Router();

  // app.get("/", (req, res) => {
  //   const html = env.render("main.njk", {
  //     usedScripts: res.locals.usedScripts,
  //     title: "トップページ",
  //   });
  //   res.send(html);
  // });

  router.get("/hello", async (req, res) => {
    return res.render("hello.njk");
  });

  router.get("/interaction/:uid", csrfTokenSetter, async (req, res) => {
    const csrf_token = req.csrfToken();
    const { uid } = req.params;
    const { error } = req.query;

    const details = await provider.interactionDetails(req, res);
    const { prompt, params, session } = details;

    let error_description = null;
    if (error === "invalid_login") {
      error_description = "ユーザー名またはパスワードが間違っています";
    }
    if (prompt.name === "login") {
      return res.render("login.njk", {
        uid,
        params,
        title: "ログイン",
        error,
        error_description,
        csrf_token,
        lastSubmission: details.lastSubmission,
      });
    }

    if (prompt.name === "consent") {
      return res.render("consent.njk", {
        uid,
        params,
        title: "同意確認",
      });
    }

    // 他のプロンプトがあればここで処理
    return res.status(400).send("未対応のプロンプトです");
  });

  router.post("/interaction/:uid/login", csrfVerifier, async (req, res) => {
    const { uid } = req.params;
    const { username, password } = req.body;
    console.log("POST login uid:", uid);
    //const details = await provider.interactionDetails(req, res);
    console.log(username, password);
    if (username === "mushroom" && password === "forest") {
      const result = {
        login: {
          accountId: username,
          acr: "urn:pwd",
          remember: true,
          ts: Math.floor(Date.now() / 1000),
        },
      };
      try {
        // console.log("typeof account:", typeof result.login.accountId);
        // console.log("account value:", result.login.accountId);
        await provider.interactionFinished(req, res, result, {
          mergeWithLastSubmission: false,
        });
        console.log("✅ interactionFinished called successfully");
        console.log(
          "✅ interactionFinished completed. headersSent:",
          res.headersSent
        );
        return;
      } catch (err) {
        console.error("❌ interactionFinished failed:", err);
        res.status(500).send("Internal Server Error");
      }
    }

    return res.redirect(`/interaction/${uid}?error=invalid_login`);
  });

  router.post("/reset-password", async (req, res) => {
    const { email } = req.body;

    const userExists = email === "user@example.com";

    if (!userExists) {
      return res.redirect(
        "/forgot-password?error=登録されたメールアドレスが見つかりません"
      );
    }

    console.log(`📧 パスワードリセットリンクを ${email} に送信しました`);

    return res.redirect(
      "/forgot-password?message=リセットリンクを送信しました。メールをご確認ください。"
    );
  });

  router.get("/logout", (req, res) => {
    res.render("logout");
  });

  return router;
}
