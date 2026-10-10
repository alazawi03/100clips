/*
 * IBANs for the GCC countries brands work in, checked the same way as in the creator app
 * (creator_app/lib/domain/iban.dart): the right length for the country, then the IBAN's own check
 * digits (mod 97), so money never goes to a mistyped account.
 */

/** IBAN length per GCC country code. */
export const IBAN_LENGTHS: Record<string, number> = { BH: 22, SA: 24, AE: 23, KW: 30, QA: 29, OM: 23 };

/** Upper case, no spaces or dashes. */
export const normalizeIban = (input: string) => input.replace(/[\s-]/g, "").toUpperCase();

export type IbanProblem = "empty" | "characters" | "country" | "length" | "checksum";

/** Undefined when the IBAN is good. `countries`: the ISO codes accepted (all GCC by default). */
export function checkIban(input: string, countries: readonly string[] = Object.keys(IBAN_LENGTHS)): IbanProblem | undefined {
  const iban = normalizeIban(input);
  if (!iban) return "empty";
  if (!/^[A-Z0-9]+$/.test(iban)) return "characters";
  const length = IBAN_LENGTHS[iban.slice(0, 2)];
  if (!length || !countries.includes(iban.slice(0, 2))) return "country";
  if (iban.length !== length) return "length";
  // Move the first four characters to the end, turn letters into numbers (A = 10 … Z = 35), and take mod 97.
  const digits = [...(iban.slice(4) + iban.slice(0, 4))].map((ch) => (ch >= "A" ? String(ch.charCodeAt(0) - 55) : ch)).join("");
  let rest = 0;
  for (const d of digits) rest = (rest * 10 + Number(d)) % 97;
  return rest === 1 ? undefined : "checksum";
}

/** "BH67 BMAG 0000 1299 1234 56": groups of four, as banks print it. */
export const groupIban = (input: string) => normalizeIban(input).replace(/(.{4})(?=.)/g, "$1 ");

/** "BH67 •••• 3456": enough to recognise it, not enough to copy it. */
export function maskIban(input: string): string {
  const iban = normalizeIban(input);
  return iban.length < 8 ? iban : `${iban.slice(0, 4)} •••• ${iban.slice(-4)}`;
}
