import { pgPool } from "../db/pg.js";

export class PostgresAdapter {
  constructor(name) {
    this.name = name; // e.g. "Session", "AccessToken"
  }
  async upsert(id, payload, expiresIn) {
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    // Interaction だけ加工したい場合はここ
    if (this.name === "Interaction" && payload.account) {
      payload.accountId = payload.account;
      delete payload.account;
    }

    await pgPool.query(
      `INSERT INTO oidc (id, payload, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE
       SET payload = $2, expires_at = $3`,
      [id, JSON.stringify(payload), expiresAt]
    );
  }
  //defaut_acr指定するなら
  //const oidc = new Provider(config.issuer, { acrValues: ['urn:pwd'], // ... });
  async find(id) {
    if (this.name === "Session") {
      console.log("🔍 Finding Session", id);
    }
    // --- Interaction ---
    if (this.name === "Interaction") {
      console.log("🔍 Finding Interaction:", id);
      const result = await pgPool.query(
        `SELECT payload FROM oidc
       WHERE id = $1 AND (expires_at IS NULL OR expires_at > now())`,
        [id]
      );

      const payload = result.rows[0]?.payload;
      if (!payload) return undefined;

      // accountId → account に戻す
      if (payload.accountId) {
        payload.account = payload.accountId;
        delete payload.accountId;
      }

      return payload;
    }

    // --- Client ---
    if (this.name === "Client") {
      const result = await pgPool.query(
        `SELECT * FROM oidc_clients WHERE client_id = $1`,
        [id]
      );

      const row = result.rows[0];
      if (!row) return undefined;

      return {
        ...row,
        scope: row.scope?.join(" ") ?? "",
        require_consent: !row.trusted,
      };
    }

    // --- default (Session, AccessToken, RefreshToken, Grant, etc.) ---
    const result = await pgPool.query(
      `SELECT payload FROM oidc
     WHERE id = $1 AND (expires_at IS NULL OR expires_at > now())`,
      [id]
    );

    return result.rows[0]?.payload || undefined;
  }

  async findByUid(uid) {
    console.log("🔍 findByUid:", uid, this.name);

    const res = await pgPool.query(
      `SELECT payload FROM oidc
       WHERE (payload->>'uid') = $1
       AND (expires_at IS NULL OR expires_at > now())`,
      [uid]
    );
    console.log(res.rows[0]);
    return res.rows[0]?.payload || undefined;
  }

  async destroy(id) {
    console.log("delete", id);
    await pgPool.query(`DELETE FROM oidc WHERE id = $1`, [id]);
  }

  async consume(id) {
    await pgPool.query(
      `UPDATE oidc SET payload = jsonb_set(payload, '{consumed}', to_jsonb(EXTRACT(EPOCH FROM NOW())::int)) WHERE id = $1`,
      [id]
    );
  }

  async revokeByGrantId(grantId) {
    await pgPool.query(`DELETE FROM oidc WHERE (payload->>'grantId') = $1`, [
      grantId,
    ]);
  }
}
