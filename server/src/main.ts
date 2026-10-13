import "reflect-metadata";
import { Pool } from "pg";
import { createApp } from "./app.module";
import { SupabaseTokenVerifier } from "./common/auth/token-verifier";
import { PgDb, pgTypes, registerEnumArrays } from "./common/db/db";

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") throw new Error(`Missing ${name} (see server/.env.example)`);
  return value;
}

async function main() {
  try {
    process.loadEnvFile(".env");
  } catch {
    // No .env file: the variables come from the environment (as when deployed).
  }
  const pool = new Pool({ connectionString: env("DATABASE_URL"), max: 10, types: pgTypes });
  await registerEnumArrays(pool);
  const verifier = new SupabaseTokenVerifier(env("SUPABASE_URL"), process.env.SUPABASE_JWT_SECRET || undefined);
  const origins = env("CORS_ORIGINS", "http://localhost:3000").split(",").map((o) => o.trim());
  const app = await createApp(new PgDb(pool), verifier, origins);
  const port = Number(env("PORT", "4000"));
  await app.listen(port);
  console.log(`100clips API on http://localhost:${port}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
