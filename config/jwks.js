import { readFileSync } from "fs";

export const jwks = JSON.parse(readFileSync("./config/jwks.json", "utf8"));
