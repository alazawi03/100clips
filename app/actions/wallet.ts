"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/actions/brand";
import { getOrder } from "@/lib/data/orders";
import { ACTIVE_MARKETS } from "@/lib/data/markets";
import { addProblemReport } from "@/lib/data/problems";
import { PROBLEM_REASONS, type ProblemReason } from "@/lib/data/types";
import * as wallet from "@/lib/data/wallet";
import { checkIban, normalizeIban } from "@/lib/iban";
import type { MessageKey } from "@/lib/i18n/messages";

/* Money out of the balance (withdrawals, the bank account they go to) and "Report a problem" on an order. */

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

/** "Withdraw": the amount leaves the balance now; 100clips sends it to the bank in 5–7 working days. */
export async function requestWithdrawal(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = text(form, "amount");
  const amount = Math.round(Number(raw) * 1000) / 1000;
  const { problem } = wallet.requestWithdrawal(raw && Number.isFinite(amount) ? amount : NaN);
  if (problem) return { errors: { amount: `walletPage.withdraw.errors.${problem}` }, values: { amount: raw } };
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

/** Adds or replaces the bank account withdrawals go to. Checked like the creator app's (length per country, mod 97). */
export async function saveBankAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const holder = text(form, "holder").slice(0, 80);
  const iban = normalizeIban(text(form, "iban"));
  const errors: NonNullable<FormState>["errors"] = {};
  if (!holder) errors.holder = "settings.bank.errors.holderRequired";
  // Bank accounts in the active markets only (Bahrain for the MVP).
  const problem = checkIban(iban, ACTIVE_MARKETS);
  if (problem) errors.iban = IBAN_ERRORS[problem];
  if (Object.keys(errors).length > 0) return { errors, values: { holder, iban: text(form, "iban") } };
  wallet.setBankAccount({ holder, iban });
  revalidatePath("/", "layout");
  return { errors: {}, values: {} };
}

export async function removeBankAccount() {
  wallet.removeBankAccount();
  revalidatePath("/", "layout");
}

/** "Report a problem" on an order: a reason and what happened, for 100clips support. */
export async function reportProblem(orderId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const order = getOrder(orderId);
  const reason = text(form, "reason");
  const details = text(form, "details").slice(0, 1000);
  const errors: NonNullable<FormState>["errors"] = {};
  if (!PROBLEM_REASONS.includes(reason as ProblemReason)) errors.reason = "orderDetail.problem.errors.reason";
  if (!details) errors.details = "orderDetail.problem.errors.details";
  if (!order) errors.form = "orderDetail.problem.errors.alreadyOpen";
  if (Object.keys(errors).length > 0) return { errors, values: { reason, details } };
  if (!addProblemReport({ orderId, brandId: order!.brandId, reason: reason as ProblemReason, details })) return { errors: { form: "orderDetail.problem.errors.alreadyOpen" }, values: { reason, details } };
  revalidatePath(`/orders/${orderId}`);
  return { errors: {}, values: {} };
}
