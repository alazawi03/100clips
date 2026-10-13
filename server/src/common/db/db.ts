import { Pool, types } from "pg";

/**
 * Who a query runs as. The API never bypasses the database rules: each request runs as the
 * signed-in user (role `authenticated`, auth.uid() = their id), as a visitor (`anon`), or, for the
 * card webhook and jobs only, as `service_role`. Row-level security and the functions decide the rest.
 */
export type Caller = { role: "anon" } | { role: "authenticated"; userId: string } | { role: "service_role" };

export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export abstract class Db {
  /** Runs `fn` in one transaction as `caller`; it commits if `fn` resolves and rolls back if it throws. */
  abstract run<T>(caller: Caller, fn: (q: Queryable) => Promise<T>): Promise<T>;
}

/** The claims Supabase's auth.uid() and auth.role() read, for one transaction. */
export function claimsFor(caller: Caller) {
  const sub = caller.role === "authenticated" ? caller.userId : "";
  return { json: JSON.stringify({ sub: sub || undefined, role: caller.role }), sub };
}

/** The role name, from the fixed list above (never from the request). */
export function roleOf(caller: Caller): string {
  return { anon: "anon", authenticated: "authenticated", service_role: "service_role" }[caller.role];
}

/**
 * How Postgres values arrive in JavaScript, matching the generated types in database.types.ts:
 * numeric (prices, amounts) and bigint (counts) as numbers, timestamps and dates as ISO strings.
 */
export const TYPE_PARSERS: Record<number, (value: string) => unknown> = {
  20: Number, // bigint
  1700: Number, // numeric
  1082: String, // date
  1114: isoTimestamp, // timestamp
  1184: isoTimestamp, // timestamptz
};

/** "2026-10-12 23:00:23.8+00" → "2026-10-12T23:00:23.8+00:00", the same as timestamps inside to_jsonb(). */
export function isoTimestamp(value: string): string {
  return value.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00");
}

/**
 * Arrays of our enums (niche[], ...) have ids that differ per database, so drivers return them as
 * text like "{beauty,food}". Call once at start-up with the database, so they arrive as lists.
 */
export async function registerEnumArrays(q: Queryable) {
  const { rows } = await q.query<{ oid: number }>(`
    select t.typarray::int as oid from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'
  `);
  const parseTextArray: (value: string) => unknown = types.getTypeParser(1009 as never); // 1009 is text[]
  for (const { oid } of rows) TYPE_PARSERS[oid] = parseTextArray;
}

/** Pass as `types` when creating the pg Pool. */
export const pgTypes = {
  getTypeParser: ((oid: number, format?: string) =>
    TYPE_PARSERS[oid] ?? types.getTypeParser(oid, format as never)) as typeof types.getTypeParser,
};

export class PgDb extends Db {
  constructor(private readonly pool: Pool) {
    super();
  }

  async run<T>(caller: Caller, fn: (q: Queryable) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query(`set local role ${roleOf(caller)}`);
      const { json, sub } = claimsFor(caller);
      await client.query("select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)", [json, sub]);
      const result = await fn(client);
      await client.query("commit");
      return result;
    } catch (e) {
      await client.query("rollback").catch(() => undefined);
      throw e;
    } finally {
      client.release();
    }
  }
}
