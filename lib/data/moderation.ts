/*
 * Who 100clips has suspended, respected by the brand app: a suspended creator can't be found or
 * booked, and a suspended brand can't pay for new work. Orders already running carry on. Set by
 * the admin portal (../admin-page) once it exists; nothing sets it in the demo for now. In-memory
 * like the rest of lib/data.
 */

type SuspendedKind = "creator" | "brand";

const suspensions = new Set<string>();

export function isSuspended(kind: SuspendedKind, id: string): boolean {
  return suspensions.has(`${kind}:${id}`);
}
