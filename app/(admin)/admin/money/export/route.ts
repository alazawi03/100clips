import { isRange, ledger, periodOf, platformBrand } from "@/lib/admin/money";
import { DEMO_TODAY } from "@/lib/data/account";
import { getCreator } from "@/lib/data/creators";
import { brandPaid, feeOf } from "@/lib/fees";

/** The transactions for a range as CSV, for the accountant. English headers and names, amounts in BHD. */
export function GET(request: Request) {
  const param = new URL(request.url).searchParams.get("range");
  const range = isRange(param) ? param : "30d";
  const { from, to } = periodOf(range, DEMO_TODAY);
  const cell = (v: string | number) => (typeof v === "number" ? v.toFixed(3) : `"${v.replace(/"/g, '""')}"`);
  const rows: Array<Array<string | number>> = [["date", "type", "order", "brand", "creator", "creator_pay", "service_fee", "amount", "bank_ref"]];
  for (const e of ledger(from, to)) {
    if (e.type === "payout") {
      rows.push([e.day, e.type, "", "", getCreator(e.creatorId)?.name.en ?? e.creatorId, -e.amount, 0, e.amount, e.bankRef]);
    } else {
      const o = e.order;
      const sign = e.type === "refund" ? -1 : 1;
      rows.push([e.day, e.type, o.id, platformBrand(o.brandId)?.name.en ?? o.brandId, getCreator(o.creatorId)?.name.en ?? o.creatorId, sign * o.amount, sign * feeOf(o), sign * brandPaid(o), ""]);
    }
  }
  const csv = rows.map((r) => r.map(cell).join(",")).join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="100clips-transactions-${from}-to-${to}.csv"` },
  });
}
