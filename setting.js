import dotenv from "dotenv";
import { nanoid } from "nanoid";
import { Client } from "pg";

function generateClientCredentials(client_name) {
  const client_id = `client_${nanoid(10)}`;
  const client_secret = nanoid(32);
  return { client_id, client_secret, client_name };
}

dotenv.config();

const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
const dsn = `postgresql://${encodeURIComponent(PGUSER)}:${encodeURIComponent(
  PGPASSWORD
)}@${PGHOST}:${PGPORT}/${PGDATABASE}`;

const redirect_uris = ["http://localhost:5173"];
const token_endpoint_auth_method = ["http://localhost:5173/logout"];
const response_types = ["code"];
const grant_types = ["authorization_code"];
const require_pkce = true;
const scope = ["openid", "email"];
const random_client = generateClientCredentials(
  "Authorization Code flow:sample"
);
const data = {
  ...random_client,
  response_types,
  redirect_uris,
  grant_types,
  token_endpoint_auth_method,
  require_pkce,
  scope,
};

const client = new Client({
  connectionString: dsn,
});

const query = `
  INSERT INTO oidc_clients (
    client_id,
    client_secret,
    client_name,
    response_types,
    redirect_uris,
    grant_types,
    token_endpoint_auth_method,
    require_pkce,
    scope
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
`;

const values = [
  data.client_id,
  data.client_secret,
  data.client_name,
  data.response_types,
  data.redirect_uris,
  data.grant_types,
  data.token_endpoint_auth_method,
  data.require_pkce,
  data.scope,
];

try {
  await client.connect();
  await client.query(query, values);
  console.log("🌱 クライアント情報を挿入しました！");
} catch (err) {
  console.error("🍂 エラーが発生しました:", err);
} finally {
  await client.end();
}
