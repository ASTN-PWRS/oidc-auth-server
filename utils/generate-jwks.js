import { generateKeyPair, exportJWK } from "jose";
import fs from "fs";

export async function generate_jwks() {
  // RSA鍵ペアを生成（署名用）
  const { publicKey, privateKey } = await generateKeyPair("RS256", {
    extractable: true,
  });

  // 公開鍵をJWK形式に変換
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = "my-key-1";
  publicJwk.use = "sig";
  publicJwk.alg = "RS256";

  // 公開鍵のみをJWKSとして保存
  fs.writeFileSync(
    "./config/public_jwks.json",
    JSON.stringify({ keys: [publicJwk] }, null, 2)
  );
  console.log("✅ public_jwks.json (公開鍵) を生成しました！");

  // 秘密鍵も必要なら別ファイルに保存（※セキュリティに注意！）
  const privateJwk = await exportJWK(privateKey);
  privateJwk.kid = "my-key-1";
  privateJwk.use = "sig";
  privateJwk.alg = "RS256";

  fs.writeFileSync(
    "./config/private_jwks.json",
    JSON.stringify(privateJwk, null, 2)
  );
  console.log(
    "🔒 private_jwks.json (秘密鍵) を生成しました（公開しないでね！）"
  );
}
