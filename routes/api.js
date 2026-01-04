// api.js
import express from "express";
//import { publicJwks } from "../oidc/jwks.js";

export function createApiRouter(provider) {
  const router = express.Router();

  router.get("/hello", (req, res) => {
    res.json({ message: "Hello from modular API!" });
  });

  router.post("/interaction/:uid/confirm", async (req, res) => {
    const interaction = await provider.interactionDetails(req, res);
    const { prompt, params, session } = interaction;

    if (req.body.action === "cancel") {
      return provider.interactionFinished(req, res, {
        error: "access_denied",
        error_description: "ユーザーがアクセスを拒否しました",
      });
    }

    let result = {};

    if (prompt.name === "consent") {
      const grant = new provider.Grant({
        accountId: session.accountId,
        clientId: params.client_id,
      });

      if (prompt.details.missingOIDCScope) {
        grant.addOIDCScope(prompt.details.missingOIDCScope.join(" "));
      }

      const grantId = await grant.save();
      result.consent = { grantId };
    }

    return provider.interactionFinished(req, res, result);
  });

  router.get("/forgot-password", (req, res) => {
    res.render("forgot-password.njk", {
      title: "パスワード再設定",
      message: req.query.message,
      error: req.query.error,
    });
  });

  return router;
}
