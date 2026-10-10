import type { BadgeTone } from "@/components/ui/Badge";
import type { ApplicationStatus } from "@/lib/admin/data";

/** Badge colour per application status. */
export const APPLICATION_TONE: Record<ApplicationStatus, BadgeTone> = { pending: "warning", changes_requested: "brand", rejected: "error", approved: "success" };
