import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Caller, claimsFor, Db, Queryable, registerEnumArrays, roleOf, TYPE_PARSERS } from "../src/common/db/db";

/** What Supabase provides before our migrations run (same stand-ins as supabase/tests/db.test.mjs). */
const SUPABASE_STANDINS = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  create schema auth; grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  create schema storage; grant usage on schema storage to anon, authenticated, service_role;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text, owner uuid);
  alter table storage.objects enable row level security;
  grant all on storage.objects to authenticated;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant execute on function storage.foldername(text) to authenticated;
`;

/** The real schema in PGlite, run as the caller exactly like PgDb does against Supabase. */
export class PgliteDb extends Db {
  private constructor(readonly pg: PGlite) {
    super();
  }

  static async create(migrationsDir = join(__dirname, "..", "..", "..", "supabase", "migrations")) {
    const pg = new PGlite({ parsers: TYPE_PARSERS });
    await pg.exec(SUPABASE_STANDINS);
    for (const f of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql") && !f.endsWith("_cron.sql")).sort()) {
      await pg.exec(readFileSync(join(migrationsDir, f), "utf8"));
    }
    await registerEnumArrays({ query: (sql, params) => pg.query(sql, params) as never });
    return new PgliteDb(pg);
  }

  run<T>(caller: Caller, fn: (q: Queryable) => Promise<T>): Promise<T> {
    return this.pg.transaction(async (tx) => {
      await tx.exec(`set local role ${roleOf(caller)}`);
      const { json, sub } = claimsFor(caller);
      await tx.query("select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)", [json, sub]);
      // Parsers per query, so the enum arrays registered after start-up apply too.
      return fn({ query: (sql, params) => tx.query(sql, params, { parsers: TYPE_PARSERS }) as never });
    });
  }

  /** Reads the database directly, to check what an action left behind. */
  async select<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.pg.query<T>(sql, params)).rows;
  }

  /** Test setup that the API doesn't do itself: sign-in users and the first admin. */
  async seed(sql: string, params: unknown[] = []) {
    await this.pg.query(sql, params);
  }
}
