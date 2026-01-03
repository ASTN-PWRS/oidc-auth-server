CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE FUNCTION update_must_change_password() RETURNS trigger AS $$
BEGIN
  IF NEW.password IS NULL THEN
    NEW.must_change_password := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_must_change_password
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_must_change_password();


CREATE TABLE organizations (  
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    name TEXT UNIQUE NOT NULL, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE titles (  
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT UNIQUE NOT NULL,
    password        TEXT,
    username        TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    title_id        UUID REFERENCES titles(id) ON DELETE RESTRICT,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE
    password_reset_token TEXT;
    password_reset_expires_at TIMESTAMPTZ;
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TABLE group_roles (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, role_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    permission_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT UNIQUE NOT NULL,
    method TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE route_group_roles ( 
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE, 
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, 
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE, 
    PRIMARY KEY (route_id, group_id, role_id), 
    created_at TIMESTAMPTZ DEFAULT NOW() 
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO permissions (name, description)
VALUES 
  ('GET', 'Allows reading data'),
  ('POST', 'Allows creating new data'),
  ('PUT', 'Allows modifying existing data'),
  ('DELETE', 'Allows removing data') ON CONFLICT (name) DO NOTHING;

INSERT INTO organizations (name)
VALUES 
  ('Section A'),
  ('Section B'),
  ('Section C'),
  ('Section D'),
  ('Section E');
