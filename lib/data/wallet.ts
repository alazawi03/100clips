import { account } from "./account";
import type { BankAccount, Withdrawal } from "./types";
import { addBusinessDays } from "@/lib/orderFlow";

/*
 * Taking money out of the balance to the account's bank. Same rules as creators' bank accounts:
 * the bank account is optional and can change or go at any time, so it's read fresh when the transfer
 * is sent (never copied at request time). Once sent, the IBAN it went to is kept on the withdrawal.
 */

/** Working days a withdrawal takes to arrive. */
export const WITHDRAWAL_DAYS = { from: 5, to: 7 } as const;

/** The smallest withdrawal, in BHD. */
export const MIN_WITHDRAWAL = 1;

/** Demo history: one earlier withdrawal, already sent. */
export const withdrawals: Withdrawal[] = [
  { id: "wd-0815", amount: 120, requestedAt: "2026-08-15T10:20:00+03:00", status: "sent", sentAt: "2026-08-20T11:00:00+03:00", bankRef: "BMAG-558120", iban: "BH67BMAG00001299123456" },
];

/**
 * Withdrawals still waiting for 100clips to send them, newest first. A brand can have several: each one
 * has already left the balance, so they can never add up to more than the brand had.
 */
export const openWithdrawals = () => withdrawals.filter((w) => w.status === "requested");

/** When a withdrawal should arrive: a range of working days after it was asked for. yyyy-mm-dd. */
export const expectedArrival = (w: Pick<Withdrawal, "requestedAt">) => ({ from: addBusinessDays(w.requestedAt, WITHDRAWAL_DAYS.from), to: addBusinessDays(w.requestedAt, WITHDRAWAL_DAYS.to) });

export type WithdrawalProblem = "noBank" | "tooSmall" | "tooMuch";

/** Takes the amount out of the balance now and queues the transfer for 100clips. */
export function requestWithdrawal(amount: number): { withdrawal?: Withdrawal; problem?: WithdrawalProblem } {
  if (!account.bankAccount) return { problem: "noBank" };
  if (!(amount >= MIN_WITHDRAWAL)) return { problem: "tooSmall" };
  if (amount > account.balance) return { problem: "tooMuch" };
  const withdrawal: Withdrawal = { id: `wd-${Math.random().toString(36).slice(2, 8)}`, amount, requestedAt: new Date().toISOString(), status: "requested" };
  account.balance = Math.round((account.balance - amount) * 1000) / 1000;
  withdrawals.unshift(withdrawal);
  return { withdrawal };
}

export function setBankAccount(bank: BankAccount) {
  account.bankAccount = bank;
}

/** Removing it doesn't touch a withdrawal already sent; one still waiting can't be sent until a new one is added. */
export function removeBankAccount() {
  account.bankAccount = undefined;
}
