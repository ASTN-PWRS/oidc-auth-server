import { generateKeyPair, exportJWK } from "jose";
import fs from "fs";

async function main() {
  const { publicKey, privateKey } = await generateKeyPair("RS256", {
    extractable: true,
  });

  const privateJwk = await exportJWK(privateKey);
  privateJwk.kid = "my-key-1";
  privateJwk.use = "sig";
  privateJwk.alg = "RS256";

  fs.writeFileSync(
    "./config/jwks.json",
    JSON.stringify({ keys: [privateJwk] }, null, 2)
  );
  console.log("jwks.json generated!");
}

main();
