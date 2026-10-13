"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { decide as decideOnApi } from "@/lib/admin/applicationsApi";
import { addPayout, addSupportMessage } from "@/lib/admin/data";
import { getCreator } from "@/lib/data/creators";
import { owedToCreators } from "@/lib/admin/money";
import * as orders from "@/lib/admin/orders";
import * as users from "@/lib/admin/users";
import { CONTENT_RULES } from "@/lib/admin/rules";
import type { SuspendedKind } from "@/lib/data/moderation";
import { logAction } from "@/lib/admin/data";
import { account } from "@/lib/data/account";
import { problemReports, resolveProblemReport } from "@/lib/data/problems";
import { markWithdrawalSent, rejectWithdrawal, withdrawals } from "@/lib/data/wallet";
import { DEMO_TODAY } from "@/lib/data/account";
import type { MessageKey } from "@/lib/i18n/messages";

/* Admin actions. There are no logins yet: when there are, each one checks for the admin role first. */

export type PayoutState = { error?: MessageKey } | null;

/**
 * "Mark paid": the admin sent the bank transfer and records its reference. Covers exactly the orders the
 * admin was shown (`orderIds`), so a clip approved meanwhile waits for the next transfer instead of
 * being marked paid without being sent.
 */
export async function markCreatorPaid(creatorId: string, orderIds: string[], _prev: PayoutState, form: FormData): Promise<PayoutState> {
  const bankRef = String(form.get("bankRef") ?? "").trim().slice(0, 40);
  if (!bankRef) return { error: "admin.payouts.errors.refRequired" };
  const row = owedToCreators(DEMO_TODAY).find((r) => r.creatorId === creatorId);
  if (!row) return { error: "admin.payouts.errors.nothingOwed" };
  if (!row.bank) return { error: "admin.payouts.errors.noBank" };
  const owed = new Set(row.orders.map((o) => o.id));
  const covered = row.orders.filter((o) => orderIds.includes(o.id));
  if (covered.length === 0 || orderIds.some((id) => !owed.has(id))) return { error: "admin.payouts.errors.changed" };
  const payout = addPayout(creatorId, covered.map((o) => o.id), covered.reduce((n, o) => n + o.amount, 0), bankRef);
  revalidatePath("/admin", "layout");
  // The creator's row is gone now, so the page itself confirms it.
  redirect(`/admin/payouts?paid=${payout.id}`);
}

/* ---------- Creator approvals ---------- */

export type AdminFormState = { errors?: Partial<Record<string, MessageKey>>; done?: boolean } | null;

/**
 * Approve, request changes or reject a creator's application. Approving needs every content rule
 * ticked (the samples were checked against them); the other two need a note, which the creator sees.
 */
export async function decideApplication(id: string, _prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const decision = String(form.get("decision") ?? "");
  const note = String(form.get("note") ?? "").trim().slice(0, 1000);
  const errors: NonNullable<AdminFormState>["errors"] = {};
  if (decision !== "approve" && decision !== "changes" && decision !== "reject") errors.decision = "admin.approvals.errors.pickDecision";
  else if (decision === "approve" && CONTENT_RULES.some((r) => form.get(`rule-${r}`) !== "on")) errors.rules = "admin.approvals.errors.checkRules";
  else if (decision !== "approve" && !note) errors.note = "admin.approvals.errors.noteRequired";
  if (Object.keys(errors).length > 0) return { errors };
  if ((await decideOnApi(id, decision as "approve" | "changes" | "reject", note)) === "taken") return { errors: { decision: "admin.approvals.errors.alreadyDecided" } };
  revalidatePath("/admin", "layout");
  revalidatePath("/explore");
  redirect(`/admin/approvals/${id}?decided=1`);
}

/* ---------- Users ---------- */

export async function setSuspended(kind: SuspendedKind, id: string, on: boolean, _prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const reason = String(form.get("reason") ?? "").trim().slice(0, 500);
  if (on && !reason) return { errors: { reason: "admin.users.errors.reasonRequired" } };
  users.setSuspended(kind, id, on, reason);
  revalidatePath("/", "layout");
  return { done: true };
}

export async function resetLogin(kind: SuspendedKind, id: string): Promise<AdminFormState> {
  users.resetLogin(kind, id);
  revalidatePath("/admin", "layout");
  return { done: true };
}

/* ---------- Orders ---------- */

export async function cancelOrder(orderId: string, _prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const note = String(form.get("note") ?? "").trim().slice(0, 500);
  if (!note) return { errors: { note: "admin.orders.errors.noteRequired" } };
  if (!orders.cancelAndRefund(orderId, note)) return { errors: { note: "admin.orders.errors.cantChange" } };
  revalidatePath("/", "layout");
  return { done: true };
}

export async function extendDeadline(orderId: string, _prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const to = String(form.get("deadline") ?? "");
  const note = String(form.get("note") ?? "").trim().slice(0, 500);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) return { errors: { deadline: "forms.errors.dateInvalid" } };
  if (!orders.extendOrderDeadline(orderId, to, DEMO_TODAY, note)) return { errors: { deadline: "admin.orders.errors.deadlineLater" } };
  revalidatePath("/admin", "layout");
  return { done: true };
}

/* ---------- 100Clips Support ---------- */

/** Sends a message to the creator as "100Clips Support" (the official, verified account in their app). */
export async function sendSupportMessage(creatorId: string, form: FormData) {
  const text = String(form.get("text") ?? "").trim().slice(0, 2000);
  if (!text || !getCreator(creatorId)) return;
  addSupportMessage(creatorId, text);
  revalidatePath(`/admin/users/creators/${creatorId}/support`);
}

/* ---------- Withdrawals from brands ---------- */

/** 100clips sent the brand's withdrawal: to the account's bank as it is now, with the bank's reference. */
export async function sendBrandWithdrawal(id: string, _prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const bankRef = String(form.get("bankRef") ?? "").trim().slice(0, 40);
  if (!bankRef) return { errors: { bankRef: "admin.payouts.errors.refRequired" } };
  if (!account.bankAccount) return { errors: { bankRef: "admin.withdrawals.errors.noBank" } };
  const w = withdrawals.find((x) => x.id === id);
  if (!markWithdrawalSent(id, bankRef)) return { errors: { bankRef: "admin.payouts.errors.changed" } };
  logAction("withdrawalSent", { kind: "account", id: account.id }, { detail: `${w?.amount ?? 0}|${bankRef}` });
  revalidatePath("/", "layout");
  return { done: true };
}

/** Turned down: the money goes back to the brand's balance, and the brand sees the note. */
export async function rejectBrandWithdrawal(id: string, _prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const note = String(form.get("note") ?? "").trim().slice(0, 500);
  if (!note) return { errors: { note: "admin.withdrawals.errors.noteRequired" } };
  const w = withdrawals.find((x) => x.id === id);
  if (!rejectWithdrawal(id, note)) return { errors: { note: "admin.payouts.errors.changed" } };
  logAction("withdrawalRejected", { kind: "account", id: account.id }, { note, detail: String(w?.amount ?? 0) });
  revalidatePath("/", "layout");
  return { done: true };
}

/* ---------- Problem reports from brands ---------- */

/** Closes a brand's "Report a problem" with a reply the brand sees on the order. */
export async function resolveProblem(id: string, _prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const resolution = String(form.get("resolution") ?? "").trim().slice(0, 1000);
  if (!resolution) return { errors: { resolution: "admin.reports.errors.replyRequired" } };
  const report = problemReports.find((r) => r.id === id);
  if (!report || !resolveProblemReport(id, resolution)) return { errors: { resolution: "admin.reports.errors.alreadyResolved" } };
  logAction("problemResolved", { kind: "order", id: report.orderId }, { note: resolution });
  revalidatePath("/", "layout");
  return { done: true };
}
