/*
 * Who 100clips has suspended. Set from the admin panel, respected by the brand app: a suspended
 * creator can't be found or booked, and a suspended brand can't pay for new work. Orders already
 * running carry on. In-memory like the rest of lib/data.
 */

export type SuspendedKind = "creator" | "brand";
export type Suspension = { at: string; reason: string };

const suspensions = new Map<string, Suspension>();
const key = (kind: SuspendedKind, id: string) => `${kind}:${id}`;

export function suspensionOf(kind: SuspendedKind, id: string): Suspension | undefined {
  return suspensions.get(key(kind, id));
}

export function isSuspended(kind: SuspendedKind, id: string): boolean {
  return suspensions.has(key(kind, id));
}

export function suspend(kind: SuspendedKind, id: string, reason: string) {
  suspensions.set(key(kind, id), { at: new Date().toISOString(), reason });
}

export function unsuspend(kind: SuspendedKind, id: string) {
  suspensions.delete(key(kind, id));
}
