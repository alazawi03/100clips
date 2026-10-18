import { BankAccountCard } from "@/components/brand/wallet/BankAccountCard";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { PageHeader } from "@/components/ui/PageHeader";
import { myBankAccount, myWithdrawals } from "@/lib/data/wallet";
import { maskIban } from "@/lib/iban";
import { getI18n } from "@/lib/i18n/server";

/** Account settings. For now: the bank account withdrawals from the balance go to, and the terms and privacy pages. */
export default async function SettingsPage() {
  const { t } = await getI18n();
  const [bank, withdrawals] = await Promise.all([myBankAccount(), myWithdrawals()]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.settings")} />
      <BankAccountCard
        key={bank?.iban ?? "none"}
        bank={bank && { holder: bank.holder, masked: maskIban(bank.iban) }}
        withdrawalWaiting={withdrawals.some((w) => w.status === "requested")}
      />
      <LegalLinks />
    </div>
  );
}
