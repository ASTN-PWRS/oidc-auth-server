import "dotenv-flow/config";

export const config = {
  pg: {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  },
  redisUrl: process.env.REDIS_URL,
  issuer: process.env.OIDC_ISSUER,
  emailDomain: process.env.OIDC_EMAIL_DOMAIN,
  port: process.env.PORT || 4000,
  oidc: {
    basepath: process.env.OIDC_BASEPATH,
  },
};
