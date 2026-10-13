import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "./env";

/** Supabase in Client Components (Google sign-in starts in the browser). */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
