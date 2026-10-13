import type { Caller } from "./db/db";

/**
 * Errors services throw when a business rule says no. They carry a message for people;
 * DbErrorFilter turns each into its HTTP status. Services don't know about HTTP.
 */
export class InputError extends Error {} // 400: the request itself is wrong or incomplete
export class ForbiddenError extends Error {} // 403: not allowed for this caller
export class NotFoundError extends Error {} // 404: doesn't exist, or the caller can't see it
export class ConflictError extends Error {} // 409: already done, or the wrong state for this

/**
 * Storage paths start with the uploader's id ({user id}/...), and storage only lets people write
 * to their own folder. A profile may only point at the caller's own files.
 */
export function assertOwnPath(caller: Caller, path: string | null | undefined, what: string) {
  if (path == null) return;
  const userId = "userId" in caller ? caller.userId : undefined;
  if (!userId || path.split("/")[0] !== userId || path.includes("..")) {
    throw new InputError(`${what} must be your own upload ({your user id}/...)`);
  }
}
