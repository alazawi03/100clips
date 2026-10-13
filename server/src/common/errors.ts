import type { Caller } from "./db/db";

/** Input a service refuses after looking at who is calling (DbErrorFilter answers 400 with the message). */
export class InputError extends Error {}

/**
 * Storage paths start with the uploader's id ({user id}/...), and storage only lets people write
 * to their own folder. A profile may only point at the caller's own files.
 */
export function assertOwnPath(caller: Caller, path: string | null | undefined, what: string) {
  if (path == null) return;
  const userId = caller.role === "authenticated" ? caller.userId : "";
  if (!userId || path.split("/")[0] !== userId || path.includes("..")) {
    throw new InputError(`${what} must be your own upload ({your user id}/...)`);
  }
}
