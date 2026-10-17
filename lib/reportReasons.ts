import { PROBLEM_REASONS, type ProblemReason } from "@/lib/data/types";

export const REPORT_REASONS = ["offPlatform", "abuse", "spam", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** The same reasons as the API names them. */
export const API_REPORT_REASON = { offPlatform: "off_platform", abuse: "abuse", spam: "spam", other: "other" } as const satisfies Record<ReportReason, string>;

export const reasonFromApi = (reason: string): ReportReason => REPORT_REASONS.find((r) => API_REPORT_REASON[r] === reason) ?? "other";

/** "Report a problem" on an order: the brand's reasons as the API names them. */
export const API_PROBLEM_REASON = {
  notDelivered: "not_delivered",
  notAsAgreed: "not_as_agreed",
  productIssue: "product_issue",
  creatorConduct: "creator_conduct",
  payment: "payment",
  other: "other",
} as const satisfies Record<ProblemReason, string>;

export const problemReasonFromApi = (reason: string): ProblemReason => PROBLEM_REASONS.find((r) => API_PROBLEM_REASON[r] === reason) ?? "other";
