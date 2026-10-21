import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where an erased account's session is sent (lib/api.ts): laqta deleted the account and its login,
 * but the session works until it expires. Signed out here, then login says the account was deleted.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(`${request.nextUrl.origin}/login?error=erased`);
}
