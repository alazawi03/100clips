"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/actions/brand";
import { api, ApiError } from "@/lib/api";
import { PROBLEM_REASONS, type ProblemReason } from "@/lib/data/types";
import { MIN_WITHDRAWAL } from "@/lib/data/wallet";
import { checkIban, normalizeIban } from "@/lib/iban";
import type { MessageKey } from "@/lib/i18n/messages";
import { API_PROBLEM_REASON } from "@/lib/reportReasons";

/* Money out of the balance (withdrawals, the bank account they go to) and "Report a problem" on an order. */

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

const logFailure = (what: string, e: unknown) => console.error(`${what} failed:`, e instanceof ApiError ? `${e.status} ${e.message}` : e);

/** "Withdraw": the amount leaves the balance now; 100clips sends it to the bank in 5–7 working days. */
export async function requestWithdrawal(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = text(form, "amount");
  const amount = Math.round(Number(raw) * 1000) / 1000;
  const values = { amount: raw };
  if (!raw || !Number.isFinite(amount) || amount < MIN_WITHDRAWAL) return { errors: { amount: "walletPage.withdraw.errors.tooSmall" }, values };
  try {
    await api("/me/withdrawals", { method: "POST", body: { amount } });
  } catch (e) {
    // The API's checks, in the page's words: no bank account, or more than the balance can spend.
    if (e instanceof ApiError && /bank account/i.test(e.message)) return { errors: { amount: "walletPage.withdraw.errors.noBank" }, values };
    if (e instanceof ApiError && /balance/i.test(e.message)) return { errors: { amount: "walletPage.withdraw.errors.tooMuch" }, values };
    logFailure("Requesting a withdrawal", e);
    return { errors: { amount: "forms.errors.saveFailed" }, values };
  }
  revalidatePath("/", "layout");
  return { errors: {}, values: {} };
}

const IBAN_ERRORS: Record<NonNullable<ReturnType<typeof checkIban>>, MessageKey> = {
  empty: "settings.bank.errors.ibanRequired",
  characters: "settings.bank.errors.ibanCharacters",
  country: "settings.bank.errors.ibanCountry",
  length: "settings.bank.errors.ibanLength",
  checksum: "settings.bank.errors.ibanChecksum",
};

/** Adds or replaces the bank account withdrawals go to. Checked like the creator app's (length per country, mod 97); the API checks again. */
export async function saveBankAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const holder = text(form, "holder").slice(0, 80);
  const iban = normalizeIban(text(form, "iban"));
  const errors: NonNullable<FormState>["errors"] = {};
  if (!holder) errors.holder = "settings.bank.errors.holderRequired";
  // A bank account in any Gulf country.
  const problem = checkIban(iban);
  if (problem) errors.iban = IBAN_ERRORS[problem];
  const values = { holder, iban: text(form, "iban") };
  if (Object.keys(errors).length > 0) return { errors, values };
  try {
    await api("/me/bank-account", { method: "PUT", body: { holder_name: holder, iban } });
  } catch (e) {
    logFailure("Saving the bank account", e);
    return { errors: { iban: e instanceof ApiError && e.status === 400 ? "settings.bank.errors.ibanChecksum" : "forms.errors.saveFailed" }, values };
  }
  revalidatePath("/", "layout");
  return { errors: {}, values: {} };
}

export async function removeBankAccount() {
  await api("/me/bank-account", { method: "DELETE" });
  revalidatePath("/", "layout");
}

/** Sent, or `already`: the brand's earlier report on the order is still open, so nothing new was saved. */
export type ProblemState = (NonNullable<FormState> & { already?: boolean }) | null;

/** "Report a problem" on an order: a reason and what happened, for laqta support. */
export async function reportProblem(orderId: string, _prev: ProblemState, form: FormData): Promise<ProblemState> {
  const reason = text(form, "reason");
  const details = text(form, "details").slice(0, 1000);
  const errors: NonNullable<FormState>["errors"] = {};
  if (!PROBLEM_REASONS.includes(reason as ProblemReason)) errors.reason = "orderDetail.problem.errors.reason";
  if (!details) errors.details = "orderDetail.problem.errors.details";
  if (Object.keys(errors).length > 0) return { errors, values: { reason, details } };
  try {
    await api(`/orders/${orderId}/reports`, { method: "POST", body: { reason: API_PROBLEM_REASON[reason as ProblemReason], details } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) return { errors: {}, values: {}, already: true };
    logFailure("Reporting a problem", e);
    return { errors: { form: "orderDetail.problem.errors.failed" }, values: { reason, details } };
  }
  revalidatePath(`/orders/${orderId}`);
  return { errors: {}, values: {} };
}
