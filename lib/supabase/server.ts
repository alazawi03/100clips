import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Supabase in Server Components, Server Actions and Route Handlers. The session lives in cookies;
 * proxy.ts keeps it fresh. Server Components can't write cookies, so setAll is allowed to fail there.
 */
export async function createClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component: proxy.ts refreshes the cookies instead.
        }
      },
    },
  });
}
