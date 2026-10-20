import { NextResponse, type NextRequest } from "next/server";
import { apiOrNothing } from "@/lib/api";
import type { Me } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Where an admin who reached the dashboard is sent (lib/session.ts): with Google, or signed in before (the
 * password form checks in app/actions/auth.ts and never comes here). Signed out of this dashboard only (the
 * admin portal keeps its session), then back at login, which says it's for brands only. Server
 * Components can't clear the session's cookies; a Route Handler can. Anyone else goes on to the dashboard.
 */
export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl;
  const me = await apiOrNothing<Me>("/me").catch(() => undefined);
  if (me?.account.role !== "admin") return NextResponse.redirect(`${origin}/dashboard`);
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(`${origin}/login?error=brands-only`);
}
