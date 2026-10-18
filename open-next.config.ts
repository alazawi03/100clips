import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal config: no ISR / on-demand revalidation in this dashboard (every
// route reads fresh via lib/api.ts), so no incremental cache override
// (R2/KV) is needed. Add one here later if a page starts using `revalidate`.
export default defineCloudflareConfig();
