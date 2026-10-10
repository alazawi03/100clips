import type { ProblemReason, ProblemReport } from "./types";

/*
 * "Report a problem" on an order: goes to 100clips support (the admin's Reports page), which looks into
 * it and replies when resolving. Reporting changes nothing on the order by itself.
 */

export const problemReports: ProblemReport[] = [
  {
    id: "rep-0928",
    orderId: "ord-1036",
    brandId: "muharraq-roastery",
    reason: "notDelivered",
    details: "لطيفة ما ترد على الرسائل من أسبوع، والموعد قرب.",
    at: "2026-09-28T09:40:00+03:00",
    status: "resolved",
    resolution: "تواصلنا مع لطيفة وأكدت إنها بتسلم المقطع قبل الموعد.",
    resolvedAt: "2026-09-29T13:10:00+03:00",
  },
];

/** The latest report on this order, if any. */
export const reportOf = (orderId: string) => problemReports.find((r) => r.orderId === orderId);

/** One open report per order: a second one while it's open would only repeat it. */
export function addProblemReport(input: { orderId: string; brandId: string; reason: ProblemReason; details: string }): ProblemReport | undefined {
  if (problemReports.some((r) => r.orderId === input.orderId && r.status === "open")) return undefined;
  const report: ProblemReport = { id: `rep-${Math.random().toString(36).slice(2, 8)}`, ...input, at: new Date().toISOString(), status: "open" };
  problemReports.unshift(report);
  return report;
}

export function resolveProblemReport(id: string, resolution: string): boolean {
  const report = problemReports.find((r) => r.id === id && r.status === "open");
  if (!report) return false;
  Object.assign(report, { status: "resolved", resolution, resolvedAt: new Date().toISOString() });
  return true;
}
