import { config } from "../config/env.js";

// /userinfoで呼ばれる
export function findAccount(ctx, id) {
  console.log("🔍 findAccount called with:", id);
  const email = ctx.oidc.session?.email;
  return {
    accountId: id,
    async claims() {
      return {
        sub: id,
        email,
        email_verified: true,
      };
    },
  };
}
