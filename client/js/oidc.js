// 1. URLから認可コードを取得
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (code) {
  // 2. ローカルストレージなどから code_verifier を取得（事前に保存しておいたもの）
  const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

  // 3. トークンエンドポイントにPOSTリクエスト
  fetch("https://your-auth-server.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: "https://your-app/callback",
      client_id: "your-client-id",
      code_verifier: codeVerifier,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("トークン取得に失敗しました");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Access Token:", data.access_token);
      console.log("ID Token:", data.id_token);
      // 必要に応じてトークンを保存（セキュアに！）
      sessionStorage.removeItem("pkce_code_verifier");
    })
    .catch((error) => {
      console.error("エラー:", error);
      sessionStorage.removeItem("pkce_code_verifier");
    });
}
