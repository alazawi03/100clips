import { apiOrNothing, api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import type { BankAccount, Withdrawal } from "./types";
import { addBusinessDays } from "@/lib/orderFlow";

/*
 * Taking money out of the balance to the account's bank, from the API (/me/bank-account, /me/withdrawals).
 * Same rules as creators' bank accounts: the bank account is optional and can change or go at any time,
 * so it's read fresh when the transfer is sent (never copied at request time). Once sent, the IBAN it
 * went to is kept on the withdrawal.
 */

type BankRow = components["schemas"]["BankAccount"];
type WithdrawalRow = components["schemas"]["Withdrawal"];

/** Working days a withdrawal takes to arrive. */
export const WITHDRAWAL_DAYS = { from: 5, to: 7 } as const;

/** The smallest withdrawal, in BHD. */
export const MIN_WITHDRAWAL = 1;

export const toBankAccount = (row: BankRow): BankAccount => ({ holder: row.holder_name, iban: row.iban });

export const toWithdrawal = (w: WithdrawalRow): Withdrawal => ({
  id: w.id,
  amount: w.amount,
  requestedAt: w.requested_at,
  status: w.status,
  sentAt: w.sent_at ?? undefined,
  bankRef: w.bank_ref ?? undefined,
  iban: w.iban ?? undefined,
  note: w.reject_note ?? undefined,
  rejectedAt: w.rejected_at ?? undefined,
});

/** The signed-in account's bank account, if it added one. */
export async function myBankAccount(): Promise<BankAccount | undefined> {
  const row = await apiOrNothing<BankRow>("/me/bank-account");
  return row && toBankAccount(row);
}

/** Every withdrawal, newest first. Several can wait at once: each has already left the balance. */
export async function myWithdrawals(): Promise<Withdrawal[]> {
  return (await api<WithdrawalRow[]>("/me/withdrawals")).map(toWithdrawal);
}

/** When a withdrawal should arrive: a range of working days after it was asked for. yyyy-mm-dd. */
export const expectedArrival = (w: Pick<Withdrawal, "requestedAt">) => ({ from: addBusinessDays(w.requestedAt, WITHDRAWAL_DAYS.from), to: addBusinessDays(w.requestedAt, WITHDRAWAL_DAYS.to) });
