import crypto from "crypto";

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

// トークンを生成してクッキーに保存、req.csrfToken() を提供
export function csrfTokenSetter(req, res, next) {
  const token = generateCsrfToken();
  res.cookie("csrf_token", token, {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
  });

  // テンプレートなどで使えるようにする
  req.csrfToken = () => token;

  next();
}

// トークンを検証するミドルウェア
export function csrfVerifier(req, res, next) {
  const tokenFromCookie = req.cookies["csrf_token"];
  const tokenFromBody = req.body._csrf;

  if (!tokenFromCookie || !tokenFromBody || tokenFromCookie !== tokenFromBody) {
    return res.status(403).send("CSRFトークンが無効です。");
  }

  next();
}
