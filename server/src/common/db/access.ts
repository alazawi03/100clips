import type { Enums, Json } from "./database.types";
import type { Queryable } from "./db";

/**
 * Permission checks and logs for services that run past row-level security (elevated callers).
 * They read the tables directly, so they work the same whatever role the transaction runs as.
 */

export async function isAdmin(q: Queryable, userId: string): Promise<boolean> {
  const { rows } = await q.query(`select 1 from public.accounts where id = $1 and role = 'admin'`, [userId]);
  return rows.length > 0;
}

export async function ownsBrand(q: Queryable, userId: string, brandId: string): Promise<boolean> {
  const { rows } = await q.query(`select 1 from public.brands where id = $1 and account_id = $2`, [brandId, userId]);
  return rows.length > 0;
}

/** One line in the admin history (who did what to whom, and why). */
export async function logAdminAction(
  q: Queryable,
  adminId: string,
  action: Enums<"admin_action">,
  target: { kind: string; id: string },
  note: string | null = null,
  detail: string | null = null,
) {
  await q.query(
    `insert into public.admin_log (admin_id, action, target_kind, target_id, note, detail) values ($1, $2, $3, $4, $5, $6)`,
    [adminId, action, target.kind, target.id, note, detail],
  );
}

/** One step in an order's history. `actorId` is null for the system (timed jobs). */
export async function logOrderEvent(
  q: Queryable,
  orderId: string,
  type: Enums<"order_event_type">,
  actor: Enums<"actor">,
  actorId: string | null,
  data: Json = {},
) {
  await q.query(
    `insert into public.order_events (order_id, type, actor, actor_id, data) values ($1, $2, $3, $4, $5::jsonb)`,
    [orderId, type, actor, actorId, JSON.stringify(data)],
  );
}
