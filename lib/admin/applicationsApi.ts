import { api, ApiError } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { privateLink, publicUrl } from "@/lib/data/storage";
import type { Localized } from "@/lib/data/types";
import type { Application, ApplicationStatus } from "./data";

/** Creators' applications from the API, in the admin pages' shape (lib/admin/data.ts). Admins only. */

type Row = components["schemas"]["CreatorApplication"];

const same = (text: string | null | undefined): Localized => ({ ar: text ?? "", en: text ?? "" });


async function toApplication(row: Row, withIntro: boolean): Promise<Application> {
  const c = row.creator;
  const latest = row.applications.at(-1);
  const socials = Object.fromEntries(row.socials.map((s) => [s.platform, s.username]));
  return {
    id: c.id,
    name: { ar: c.name_ar || c.name_en || "", en: c.name_en || c.name_ar || "" },
    handle: c.handle,
    phone: row.phone ?? "",
    country: c.country,
    city: same(c.city),
    gender: (c.gender ?? "female") as Application["gender"],
    bio: same(c.bio),
    niches: c.niches,
    formats: row.formats,
    instagram: socials.instagram,
    tiktok: socials.tiktok,
    // What was sent with the latest submission (samples are public; the intro is private).
    samples: (latest?.sample_paths ?? []).map((p, i) => ({ id: `${latest!.id}-${i}`, videoSrc: publicUrl(p)! })),
    intro: withIntro ? await privateLink("private-docs", latest?.intro_video_path) : undefined,
    hasIntro: !!latest?.intro_video_path,
    appliedAt: latest?.submitted_at ?? c.created_at,
    status: c.status as ApplicationStatus,
    decisions: row.applications
      .filter((a) => a.decision && a.decided_at)
      .map((a) => ({ at: a.decided_at!, status: a.decision as Exclude<ApplicationStatus, "pending">, note: a.note ?? undefined })),
  };
}

/** Everyone who applied, any state (the page filters by tab and counts each). */
export async function listApplications(): Promise<Application[]> {
  const rows = await api<Row[]>("/admin/applications");
  return Promise.all(rows.map((r) => toApplication(r, false)));
}

export async function getApplication(creatorId: string): Promise<Application | undefined> {
  try {
    return await toApplication(await api<Row>(`/admin/applications/${creatorId}`), true);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return undefined;
    throw e;
  }
}

/** The API's words for the form's choices. */
const DECISION = { approve: "approved", changes: "changes_requested", reject: "rejected" } as const;

/** "decided", or "taken" when nobody waits any more (another admin decided first). */
export async function decide(creatorId: string, decision: keyof typeof DECISION, note: string): Promise<"decided" | "taken"> {
  try {
    await api(`/admin/creators/${creatorId}/decision`, { method: "POST", body: { decision: DECISION[decision], ...(note ? { note } : {}) } });
    return "decided";
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) return "taken";
    throw e;
  }
}
