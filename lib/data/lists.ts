import { bookableCreators, creators } from "./creators";
import type { Creator } from "./types";

/*
 * Lists of creators the account saved to hire later. "Favourites" is built in and always first;
 * its name comes from the translations, so `name` is empty. The brand adds its own named lists after it.
 * In-memory like the rest of the dummy data; swap for an API when the backend exists.
 */
export type CreatorList = { id: string; name: string; creatorIds: string[]; favorites?: true };

export const FAVORITES_ID = "favorites";

// Demo: a few creators already saved, so Lists and "invite from a list" have something to show.
const lists: CreatorList[] = [{ id: FAVORITES_ID, name: "", creatorIds: ["khalid-almutairi", "fahad-alqahtani", "hessa-alajmi"], favorites: true }];
let seq = 1;

export function allLists(): CreatorList[] {
  return lists;
}

/** A list's creators, most recently added first. */
export function creatorsIn(list: CreatorList): Creator[] {
  return [...list.creatorIds]
    .reverse()
    .map((id) => bookableCreators().find((c) => c.id === id))
    .filter((c): c is Creator => !!c);
}

/** Creators saved in at least one list. */
export function savedCount(): number {
  return new Set(lists.flatMap((l) => l.creatorIds)).size;
}

export function createList(name: string, creatorId?: string): CreatorList {
  const list: CreatorList = { id: `list-${seq++}`, name, creatorIds: creatorId && creators.some((c) => c.id === creatorId) ? [creatorId] : [] };
  lists.push(list);
  return list;
}

export function setInList(listId: string, creatorId: string, on: boolean) {
  const list = lists.find((l) => l.id === listId);
  if (!list || !creators.some((c) => c.id === creatorId)) return;
  list.creatorIds = list.creatorIds.filter((id) => id !== creatorId);
  if (on) list.creatorIds.push(creatorId);
}
