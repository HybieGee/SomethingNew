export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: R2Bucket;
  RAFFLE_DO: DurableObjectNamespace;
  ADMIN_SECRET: string;
  SERVER_SEED: string;
  ENVIRONMENT: string;
}

export interface SessionUser {
  id: string;
  username: string;
}

export interface AuthContext {
  user?: SessionUser;
}