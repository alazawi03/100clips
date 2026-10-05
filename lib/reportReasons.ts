export const REPORT_REASONS = ["offPlatform", "abuse", "spam", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
