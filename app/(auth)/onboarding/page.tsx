import { redirect } from "next/navigation";
import { ensureBrandAccount } from "@/lib/session";

/**
 * First time here after sign-up, or with a login a creator or an admin already has: the brand account is made
 * here, then straight to the dashboard (it offers to create a brand).
 */
export default async function OnboardingPage() {
  await ensureBrandAccount();
  redirect("/dashboard");
}