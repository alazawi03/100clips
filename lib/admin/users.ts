import { account, brands as accountBrands } from "@/lib/data/account";
import { creators } from "@/lib/data/creators";
import { isSuspended, suspend, unsuspend, type SuspendedKind } from "@/lib/data/moderation";
import type { Brand, Creator, Localized } from "@/lib/data/types";
import { brandPaid } from "@/lib/fees";
import { brandOwners, getApplication, logAction, otherBalances, payouts, platformOrders, type Application } from "./data";
import { platformBrands } from "./money";

/*
 * Brands and creators as the admin sees them, plus creator approval: a new creator only goes live
 * (shows up for brands) once an admin approves their profile and samples against the content rules.
 */

export type CreatorRow = { creator: Creator; suspended: boolean; orders: number; approved: number; earned: number; paidOut: number };

export function creatorRows(): CreatorRow[] {
  const all = platformOrders();
  return creators.map((creator) => {
    const mine = all.filter((o) => o.creatorId === creator.id);
    const approved = mine.filter((o) => o.status === "approved");
    return {
      creator,
      suspended: isSuspended("creator", creator.id),
      orders: mine.length,
      approved: approved.length,
      earned: approved.reduce((n, o) => n + o.amount, 0),
      paidOut: payouts.filter((p) => p.creatorId === creator.id).reduce((n, p) => n + p.amount, 0),
    };
  });
}

export type BrandOwner = { name: Localized; email: string; phone: string };
export type BrandRow = { brand: Brand; owner: BrandOwner; balance: number; suspended: boolean; orders: number; spent: number; demoAccount: boolean };

export function brandOwnerOf(brandId: string): BrandOwner {
  return brandOwners[brandId] ?? { name: account.name, email: account.email, phone: account.phone };
}

export function brandRows(): BrandRow[] {
  const all = platformOrders();
  return platformBrands().map((brand) => {
    const mine = all.filter((o) => o.brandId === brand.id);
    const demoAccount = accountBrands.some((b) => b.id === brand.id);
    return {
      brand,
      owner: brandOwnerOf(brand.id),
      // The demo account's brands share one balance.
      balance: demoAccount ? account.balance : (otherBalances[brand.id] ?? 0),
      suspended: isSuspended("brand", brand.id),
      orders: mine.length,
      spent: mine.filter((o) => o.status === "approved").reduce((n, o) => n + brandPaid(o), 0),
      demoAccount,
    };
  });
}

/** Search names (both languages), handles, emails and phone numbers. */
export function matches(q: string, ...fields: Array<string | undefined>): boolean {
  if (!q) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((w) => haystack.includes(w));
}

/* ---------- Actions ---------- */

export function setSuspended(kind: SuspendedKind, id: string, on: boolean, reason: string) {
  if (on) suspend(kind, id, reason);
  else unsuspend(kind, id);
  logAction(on ? "suspended" : "unsuspended", { kind, id }, { note: reason || undefined });
}

/** Mock: brands get a password-reset email, creators are signed out everywhere and log in again with a code. */
export function resetLogin(kind: SuspendedKind, id: string) {
  logAction("loginReset", { kind, id });
}

/** The creator as brands will see them once approved: no rating or finished orders yet. */
function toCreator(a: Application): Creator {
  return { id: a.id, name: a.name, handle: a.handle, country: a.country, city: a.city, gender: a.gender, niches: a.niches, formats: a.formats, completedOrders: 0, bio: a.bio, hasNewClips: true };
}

export type ApplicationDecision = "approve" | "changes" | "reject";

/**
 * Approve puts the creator live (brands can find and book them); request changes and reject send the
 * note to the creator. Only applications still waiting on 100clips can be decided.
 */
export function decideApplication(id: string, decision: ApplicationDecision, note: string): boolean {
  const a = getApplication(id);
  if (!a || a.status !== "pending") return false;
  const at = new Date().toISOString();
  const status = decision === "approve" ? "approved" : decision === "changes" ? "changes_requested" : "rejected";
  a.status = status;
  a.decisions.push({ at, status, note: note || undefined });
  if (status === "approved" && !creators.some((c) => c.id === a.id)) creators.push(toCreator(a));
  logAction(status === "approved" ? "creatorApproved" : status === "rejected" ? "creatorRejected" : "changesRequested", { kind: "application", id }, { note: note || undefined });
  return true;
}
