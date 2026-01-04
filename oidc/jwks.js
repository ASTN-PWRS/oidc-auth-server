import { readFileSync } from "fs";

export const jwks = JSON.parse(
  readFileSync("./config/private_jwks.json", "utf8")
);

// export const jwks = {
//   jwks: {
//     keys: [privateJwk],
//   },
// };

export const publicJwks = JSON.parse(
  readFileSync("./config/public_jwks.json", "utf8")
);
