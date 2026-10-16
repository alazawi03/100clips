export const REPORT_REASONS = ["offPlatform", "abuse", "spam", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** The same reasons as the API names them. */
export const API_REPORT_REASON = { offPlatform: "off_platform", abuse: "abuse", spam: "spam", other: "other" } as const satisfies Record<ReportReason, string>;

export const reasonFromApi = (reason: string): ReportReason => REPORT_REASONS.find((r) => API_REPORT_REASON[r] === reason) ?? "other";
