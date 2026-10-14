import { cache } from "react";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import type { Creator } from "./types";
import type { Workspace } from "./live";

/*
 * Lists of creators the account saved to hire later. "Favourites" is built in and always first (the
 * API makes it the first time someone is added); its name comes from the translations, so `name` is
 * empty. The brand's own named lists follow it.
 */
export type CreatorList = { id: string; name: string; creatorIds: string[]; favorites?: true };

/** Favourites' id in the API's paths, whether or not it exists yet. */
export const FAVORITES_ID = "favorites";

type ListRow = components["schemas"]["CreatorList"];

/** The account's lists, Favourites first. Once per request. */
export const allLists = cache(async (): Promise<CreatorList[]> => {
  const rows = await api<ListRow[]>("/me/lists");
  const favorites = rows.find((l) => l.is_favorites);
  return [
    { id: FAVORITES_ID, name: "", creatorIds: favorites?.creator_ids ?? [], favorites: true },
    ...rows.filter((l) => !l.is_favorites).map((l) => ({ id: l.id, name: l.name, creatorIds: l.creator_ids })),
  ];
});

/** A list's creators who can be booked now, most recently added first. */
export function creatorsIn(list: CreatorList, ws: Pick<Workspace, "bookable">): Creator[] {
  return list.creatorIds.map((id) => ws.bookable.find((c) => c.id === id)).filter((c): c is Creator => !!c);
}

/** Creators saved in at least one list. */
export const savedCount = (lists: CreatorList[]) => new Set(lists.flatMap((l) => l.creatorIds)).size;

export async function createList(name: string, creatorId?: string) {
  await api("/me/lists", { method: "POST", body: { name, ...(creatorId ? { creator_id: creatorId } : {}) } });
}

export async function setInList(listId: string, creatorId: string, on: boolean) {
  await api(`/me/lists/${encodeURIComponent(listId)}/creators/${creatorId}`, { method: on ? "PUT" : "DELETE" });
}
