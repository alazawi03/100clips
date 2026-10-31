import { NextResponse, type NextRequest } from "next/server";
import { PENDING_COOKIE, PENDING_PATH, readPendingSignup } from "@/lib/pending-signup";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Google sign-in and the emailed links (confirm email, reset password) land: trades the
 * one-time code for a session, then goes on to `next`.
 *
 * `set=password`: the link a sign-up with an email that already had a laqta login was sent (app/actions/auth.ts).
 * The password and name typed then, kept in this browser (lib/pending-signup.ts), go on the login, and they go on
 * to onboarding, which makes the brand account. Without them here (another browser, or over an hour later), they
 * choose the password on /reset-password.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && searchParams.get("set") !== "password") return NextResponse.redirect(`${origin}${next}`);
    if (!error) {
      const pending = await readPendingSignup(request.cookies.get(PENDING_COOKIE)?.value);
      let to = "/reset-password";
      // Only for the login the sign-up was for: the cookie holds the latest one tried in this browser.
      if (pending && pending.email === data.user.email?.toLowerCase()) {
        // The name for the brand account (lib/session.ts ensureBrandAccount); only the dashboard reads it.
        await supabase.auth.updateUser({ data: { name: pending.name } });
        const { error: setError } = await supabase.auth.updateUser({ password: pending.password });
        // same_password: it was this login's password already.
        if (!setError || setError.code === "same_password") to = next;
      }
      const res = NextResponse.redirect(`${origin}${to}`);
      res.cookies.set(PENDING_COOKIE, "", { path: PENDING_PATH, maxAge: 0 });
      return res;
    }
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
