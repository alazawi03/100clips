import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** The 100clips API (the 100clips-backend repo), reached from the server only. */
const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** The API's answer to every request from an account laqta erased. */
const ERASED = "This account was erased";

/** The API said no: its status and its message for people (a list for input checks). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly messages: string[],
  ) {
    super(message);
  }
}

/**
 * Calls the API as the signed-in user (their Supabase access token), from Server Components and
 * Server Actions. JSON in and out; a 204 gives undefined. Throws ApiError on 4xx/5xx.
 */
export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch (e) {
    // Usually the API isn't running: say where it was looked for.
    throw new Error(`The 100clips API isn't reachable at ${API_URL} (run "npm run dev" in 100clips-backend, or check API_URL in .env.local).`, { cause: e });
  }
  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => ({}))) as { message?: string | string[] };
  if (!res.ok) {
    const messages = Array.isArray(json.message) ? json.message : [json.message ?? res.statusText];
    // An erased account's session still works until it expires: sign it out (app/auth/erased).
    if (res.status === 403 && messages[0] === ERASED) redirect("/auth/erased");
    throw new ApiError(res.status, messages.join(". "), messages);
  }
  return json as T;
}

/** Like api(), but a 404 gives undefined (e.g. "no account yet"). */
export async function apiOrNothing<T>(path: string): Promise<T | undefined> {
  try {
    return await api<T>(path);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return undefined;
    throw e;
  }
}
