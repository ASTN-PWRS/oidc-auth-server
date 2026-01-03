-- ENUM型（認証方式）を先に定義
CREATE TYPE token_auth_method AS ENUM (
  'client_secret_basic',
  'client_secret_post',
  'client_secret_jwt',
  'private_key_jwt',
  'none'
);

CREATE TABLE oidc (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- テーブル定義
CREATE TABLE oidc_clients (
  client_id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_secret TEXT,
  redirect_uris TEXT[] NOT NULL,
  post_logout_redirect_uris TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  response_types TEXT[] NOT NULL CHECK (
    response_types <@ ARRAY['code', 'id_token', 'token', 'none']
  ),
  grant_types TEXT[] NOT NULL CHECK (
    grant_types <@ ARRAY['authorization_code', 'implicit', 'refresh_token', 'client_credentials']
  ),
  token_endpoint_auth_method token_auth_method NOT NULL,
  scope TEXT[] NOT NULL CHECK (
    'openid' = ANY(scope)
  ),
  require_pkce BOOLEAN NOT NULL DEFAULT false,
  trusted BOOLEAN NOT NULL DEFAULT false,
  access_token_lifetime INTEGER NOT NULL DEFAULT 3600 CHECK (access_token_lifetime > 0),
  refresh_token_lifetime INTEGER NOT NULL DEFAULT 1209600 CHECK (refresh_token_lifetime > 0),
  id_token_signed_response_alg TEXT NOT NULL DEFAULT 'RS256',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,

  -- 相関制約：require_pkce に応じた認証方式の制限
  CHECK (
    (require_pkce = true AND token_endpoint_auth_method = 'none') OR
    (require_pkce = false AND token_endpoint_auth_method != 'none')
  ),

  -- 相関制約：require_pkce = true のときは authorization_code が必須
  CHECK (
    require_pkce = false OR
    'authorization_code' = ANY(grant_types)
  ),

  -- trusted = false のときに require_consent = false 相当を防ぐ
  CHECK (
    trusted OR require_pkce OR 'authorization_code' = ANY(grant_types)
  )
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_oidc_clients_update
BEFORE UPDATE ON oidc_clients
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
