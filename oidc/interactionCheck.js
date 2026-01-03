export async function interactionCheck(ctx) {
  const { oidc } = ctx;

  if (!oidc.session?.accountId) {
    return { prompt: "login" };
  }

  const requestedAcr = oidc.params.acr_values;
  const currentAcr = oidc.session.acr;
  if (requestedAcr && currentAcr !== requestedAcr) {
    return { prompt: "login", reason: "acr_mismatch" };
  }

  const client = await oidc.client;
  const trusted = client.metadata?.trusted ?? client.trusted;

  if (trusted === true && oidc.session?.accountId) {
    return false; // login済み＋trusted → OK
  }
  console.log("interactionCheck: check");
  return { prompt: "consent" };
}
