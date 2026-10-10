import { BankAccountCard } from "@/components/brand/wallet/BankAccountCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { account } from "@/lib/data/account";
import { openWithdrawals } from "@/lib/data/wallet";
import { maskIban } from "@/lib/iban";
import { getI18n } from "@/lib/i18n/server";

/** Account settings. For now: the bank account withdrawals from the balance go to. */
export default async function SettingsPage() {
  const { t } = await getI18n();
  const bank = account.bankAccount;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.settings")} />
      <BankAccountCard key={bank?.iban ?? "none"} bank={bank && { holder: bank.holder, masked: maskIban(bank.iban) }} withdrawalWaiting={openWithdrawals().length > 0} />
    </div>
  );
}
