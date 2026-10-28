"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Compass, ListChecks, MapPin, MonitorPlay, Plus, ScanFace, Search, Users, X } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { FilterMenu } from "@/components/brand/creators/FilterMenu";
import { SortMenu } from "@/components/brand/creators/SortMenu";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { FieldError, Input } from "@/components/ui/Form";
import { FormatLogo, PlatformLogo } from "@/components/ui/PlatformLogo";
import { faceEmoji, genderEmoji } from "@/lib/data/emojis";
import { cn } from "@/lib/cn";
import { areasOf, bySort, FACES, GENDERS, matchesArea, matchesFace, PLATFORMS, SORTS, type Face, type Sort } from "@/lib/data/creatorFilters";
import { platformOf, type ContentFormat, type Gender, type Niche, type Platform } from "@/lib/data/types";
import { createFormatters } from "@/lib/i18n/format";
import { priceForBrand } from "@/lib/fees";

export type InviteCreator = {
  id: string;
  name: string;
  /** Without "@". */
  handle: string;
  city: string;
  niches: Niche[];
  gender: Gender;
  /** Face in their videos; undefined until they say. */
  showsFace?: boolean;
  /** For sorting, as on the creators page. */
  rating?: number;
  completedOrders: number;
  inCampaign: boolean;
  packages: Array<{ format: ContentFormat; label: string; price: number }>;
  photo?: string;
};

export type PickerOptions = {
  lists: Array<{ id: string; name: string; creators: InviteCreator[] }>;
  /** "Explore": every creator, to search, filter and sort as on the creators page, offered next to the lists. */
  explore?: { creators: InviteCreator[] };
  /** Coming from creator cards or a profile (?creators=): just these creators, already ticked. */
  preset?: InviteCreator[];
  initialListId?: string;
  /** Coming from a list's "Invite to campaign" (?list=): its members start ticked. */
  tickList?: boolean;
  /** Creators chosen to start with (a saved draft). */
  initialPicked?: string[];
  /** Platform already chosen per creator (running a campaign again: what each did last time). */
  defaultFormats?: Record<string, ContentFormat>;
};

/** Creators per page in the picker. */
const PAGE = 5;

/** What sorting compares: the cheapest package stands for the price, as on the creators page. */
const sortable = (c: InviteCreator) => ({
  rating: c.rating,
  completedOrders: c.completedOrders,
  fromPrice: c.packages.length ? Math.min(...c.packages.map((p) => p.price)) : undefined,
});
/** The "list" id of Explore: every creator, filterable. */
const EXPLORE = "explore";

/**
 * The creator picker shared by "Add creator", "Run again" and "New campaign": «صنّاع المحتوى» (lists and
 * Explore, 5 per page) above «اللي بتدعوهم» (everyone chosen, each with one platform). Picks add up across
 * lists. Returns what's chosen and `render`, which draws both sections plus the hidden "pick" fields
 * ("creatorId|format") the server reads. `bare` drops the cards' own frames, for use inside another card.
 */
export function useCreatorPicker({ lists, explore, preset, initialListId, tickList, initialPicked, defaultFormats }: PickerOptions) {
  const { t, tp, locale, currency } = useI18n();
  const f = createFormatters(locale, currency);
  const [listId, setListId] = useState(initialListId);
  // Chosen creators, and the platform picked for each (none at first, unless known from last time).
  const [ticked, setTicked] = useState<Set<string>>(() => {
    const start = preset ?? (tickList ? (lists.find((l) => l.id === initialListId)?.creators ?? []) : []);
    return new Set([...(initialPicked ?? []), ...start.map((c) => c.id)]);
  });
  const [formats, setFormats] = useState<Map<string, ContentFormat>>(() => new Map(Object.entries(defaultFormats ?? {})));
  const everyone = new Map([...lists.flatMap((l) => l.creators), ...(explore?.creators ?? []), ...(preset ?? [])].map((c) => [c.id, c]));
  // Explore's filters, as on the creators page: text (name or handle), platforms, areas, genders, face or
  // faceless (any of each matches), and the order.
  const [query, setQuery] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [faces, setFaces] = useState<Face[]>([]);
  const [sort, setSort] = useState<Sort>("rating");
  // The page of the current list (5 creators each); back to the first on any list or filter change.
  const [page, setPage] = useState(0);
  const resetMore = () => setPage(0);
  const chosen = [...ticked]
    .map((id) => everyone.get(id))
    .filter((c): c is InviteCreator => !!c)
    .flatMap((creator) => creator.packages.filter((p) => p.format === formats.get(creator.id)).map((p) => ({ creator, format: p.format, label: p.label, price: p.price })));
  const invitees = [...ticked].filter((id) => everyone.has(id)).length;
  const missing = [...ticked].filter((id) => everyone.has(id) && !formats.has(id));
  const total = chosen.reduce((sum, p) => sum + p.price, 0);
  const add = (ids: string[]) =>
    setTicked((s) => {
      const next = new Set(s);
      for (const id of ids) next.add(id);
      return next;
    });
  const remove = (id: string) =>
    setTicked((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  const chooseFormat = (c: InviteCreator, format: ContentFormat) => setFormats((m) => new Map(m).set(c.id, format));
  // Everyone picked so far, from any list, in the order they were added. Switching lists never drops them.
  const picked = [...ticked].map((id) => everyone.get(id)).filter((c): c is InviteCreator => !!c);
  const exploring = listId === EXPLORE && !!explore;
  const exploreAreas = areasOf((explore?.creators ?? []).map((c) => c.city));
  const q = query.trim().toLowerCase().replace(/^@/, "");
  const listCreators = exploring
    ? explore.creators.filter(
        (c) =>
          (!q || c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)) &&
          matchesArea(c.city, areas) &&
          (platforms.length === 0 || c.packages.some((p) => platforms.includes(platformOf[p.format]))) &&
          (genders.length === 0 || genders.includes(c.gender)) &&
          matchesFace(c, faces),
      ).sort((a, b) => bySort[sort](sortable(a), sortable(b)))
    : (lists.find((l) => l.id === listId)?.creators ?? []);
  const filtered = exploring && (!!q || areas.length > 0 || platforms.length > 0 || genders.length > 0 || faces.length > 0);
  const sortLabels = { rating: t("explore.sortRating"), priceLow: t("explore.sortPriceLow"), priceHigh: t("explore.sortPriceHigh"), orders: t("explore.sortOrders") };
  const sortMenu = (
    <SortMenu
      label={t("explore.sort")}
      value={sort}
      options={SORTS.map((s) => ({ value: s, label: sortLabels[s] }))}
      onChange={(v) => (setSort(v as Sort), resetMore())}
    />
  );
  const pages = Math.max(1, Math.ceil(listCreators.length / PAGE));
  const current = Math.min(page, pages - 1);
  const visible = listCreators.slice(current * PAGE, current * PAGE + PAGE);
  const notYet = listCreators.filter((c) => !ticked.has(c.id));


  function render({ showMissing = false, error, bare = false }: { showMissing?: boolean; error?: string; bare?: boolean } = {}) {
    const checked = showMissing;
    const err = (name: string) => (name === "pick" ? error : undefined);
    const Frame = bare ? BareFrame : Card;
    return (
      <>
      {chosen.map((p) => (
        <input key={`${p.creator.id}|${p.format}`} type="hidden" name="pick" value={`${p.creator.id}|${p.format}`} />
      ))}
        {/* Pick creators from a list, first. Choosing a list only changes what you can add from. */}
        {!preset && (
          <Frame className="flex flex-col">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-medium">
                  <ListChecks aria-hidden className="size-5 text-text-muted" />
                  {t("invite.fromList")}
                </h2>
                {notYet.length > 1 && (
                  <button
                    type="button"
                    onClick={() => add(notYet.map((c) => c.id))}
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-small font-medium transition-colors hover:bg-surface"
                  >
                    <Plus aria-hidden className="size-4" />
                    {t("invite.addAll", { count: f.number(notYet.length) })}
                  </button>
                )}
              </div>
              {(lists.length > 0 || explore) && (
                <div role="radiogroup" aria-label={t("invite.chooseList")} className="flex flex-wrap gap-2">
                  {explore && (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={exploring}
                      onClick={() => (setListId(EXPLORE), resetMore())}
                      className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-small font-medium transition-colors", exploring ? "border-primary bg-primary text-on-primary" : "border-border hover:bg-surface")}
                    >
                      <Compass aria-hidden className="size-4" />
                      {t("invite.explore")} <span className="opacity-70">({f.number(explore.creators.length)})</span>
                    </button>
                  )}
                  {lists.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      role="radio"
                      aria-checked={l.id === listId}
                      onClick={() => (setListId(l.id), resetMore())}
                      className={cn("h-9 rounded-full border px-3 text-small font-medium transition-colors", l.id === listId ? "border-primary bg-primary text-on-primary" : "border-border hover:bg-surface")}
                    >
                      {l.name} <span className="opacity-70">({f.number(l.creators.length)})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {exploring && (
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4">
                <div className="relative">
                  <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => (setQuery(e.target.value), resetMore())}
                    placeholder={t("explore.search")}
                    aria-label={t("explore.search")}
                    className="ps-9"
                  />
                </div>
                {/* Phones: area chips in one row to swipe, then platform and face chips (same choices as the menus below). */}
                <div className="flex flex-col gap-2 sm:hidden">
                  {exploreAreas.length > 0 && (
                    <div role="group" aria-label={t("explore.area")} className="scrollbar-none -mx-5 flex gap-1.5 overflow-x-auto px-5">
                      {[null, ...exploreAreas].map((a) => {
                        const on = a ? areas.includes(a) : areas.length === 0;
                        return (
                          <button
                            key={a ?? "all"}
                            type="button"
                            aria-pressed={on}
                            onClick={() => (setAreas(a ? (on ? areas.filter((x) => x !== a) : [...areas, a]) : []), resetMore())}
                            className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-small transition-colors", on ? "border-brand-soft bg-brand-soft font-medium text-brand-on-soft" : "border-border text-text-muted hover:bg-surface")}
                          >
                            {a && <MapPin aria-hidden className="size-3.5" />}
                            {a ?? t("invite.allAreas")}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PLATFORMS.map((p) => {
                      const on = platforms.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          aria-pressed={on}
                          onClick={() => (setPlatforms(on ? platforms.filter((x) => x !== p) : [...platforms, p]), resetMore())}
                          className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-small transition-colors", on ? "border-brand-soft bg-brand-soft font-medium text-brand-on-soft" : "border-border text-text-muted hover:bg-surface")}
                        >
                          <PlatformLogo platform={p} className="size-3.5" />
                          {t(`platforms.${p}`)}
                        </button>
                      );
                    })}
                    {GENDERS.map((g) => {
                      const on = genders.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          aria-pressed={on}
                          onClick={() => (setGenders(on ? genders.filter((x) => x !== g) : [...genders, g]), resetMore())}
                          className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-small transition-colors", on ? "border-brand-soft bg-brand-soft font-medium text-brand-on-soft" : "border-border text-text-muted hover:bg-surface")}
                        >
                          <span aria-hidden>{genderEmoji[g]}</span>
                          {t(`genders.${g}`)}
                        </button>
                      );
                    })}
                    {FACES.map((v) => {
                      const on = faces.includes(v);
                      return (
                        <button
                          key={v}
                          type="button"
                          aria-pressed={on}
                          onClick={() => (setFaces(on ? faces.filter((x) => x !== v) : [...faces, v]), resetMore())}
                          className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-small transition-colors", on ? "border-brand-soft bg-brand-soft font-medium text-brand-on-soft" : "border-border text-text-muted hover:bg-surface")}
                        >
                          <span aria-hidden>{faceEmoji[v]}</span>
                          {t(`faces.${v}`)}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-small text-text-muted">{tp("explore.results", listCreators.length)}</span>
                    {sortMenu}
                  </div>
                </div>
                {/* Wider screens: the creators page's own filter menus, in its order, one compact row. */}
                <div className="hidden flex-wrap items-center gap-2 sm:flex">
                  <FilterMenu
                    label={t("explore.platform")}
                    icon={<MonitorPlay aria-hidden className="size-4 shrink-0" />}
                    options={PLATFORMS.map((p) => ({ value: p, label: t(`platforms.${p}`), icon: <PlatformLogo platform={p} className="size-5" /> }))}
                    selected={platforms}
                    onChange={(next) => (setPlatforms(next as Platform[]), resetMore())}
                  />
                  {exploreAreas.length > 0 && (
                    <FilterMenu
                      label={t("explore.area")}
                      icon={<MapPin aria-hidden className="size-4 shrink-0" />}
                      options={exploreAreas.map((a) => ({ value: a, label: a }))}
                      selected={areas}
                      onChange={(next) => (setAreas(next), resetMore())}
                    />
                  )}
                  <FilterMenu
                    label={t("explore.gender")}
                    icon={<Users aria-hidden className="size-4 shrink-0" />}
                    options={GENDERS.map((g) => ({ value: g, label: t(`genders.${g}`), icon: <span aria-hidden className="text-base leading-none">{genderEmoji[g]}</span> }))}
                    selected={genders}
                    onChange={(next) => (setGenders(next as Gender[]), resetMore())}
                  />
                  <FilterMenu
                    label={t("explore.face")}
                    icon={<ScanFace aria-hidden className="size-4 shrink-0" />}
                    options={FACES.map((v) => ({ value: v, label: t(`faces.${v}`), icon: <span aria-hidden className="text-base leading-none">{faceEmoji[v]}</span> }))}
                    selected={faces}
                    onChange={(next) => (setFaces(next as Face[]), resetMore())}
                  />
                  <span className="ms-auto text-small text-text-muted">{tp("explore.results", listCreators.length)}</span>
                  {sortMenu}
                </div>
              </div>
            )}
            {exploring && listCreators.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-5 text-center text-small text-text-muted">
                {t("explore.emptyTitle")}
                {filtered && (
                  <button
                    type="button"
                    onClick={() => (setQuery(""), setAreas([]), setPlatforms([]), setGenders([]), setFaces([]))}
                    className="rounded-[var(--radius-sm)] px-2 py-1 font-medium text-primary hover:bg-surface"
                  >
                    {t("explore.clear")}
                  </button>
                )}
              </div>
            ) : !exploring && (lists.length === 0 || listCreators.length === 0) ? (
              <p className="p-5 text-small text-text-muted">{lists.length ? t("invite.emptyList") : t("invite.noLists")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {visible.map((c) => {
                  const added = ticked.has(c.id);
                  return (
                    <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar id={c.id} name={c.name} src={c.photo} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.name}</span>
                        <span className="block truncate text-small text-text-muted">
                          <bdi dir="ltr">@{c.handle}</bdi> · {c.city}
                          {c.inCampaign && ` · ${t("invite.inCampaign")}`}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-pressed={added}
                        onClick={() => (added ? remove(c.id) : add([c.id]))}
                        className={cn(
                          "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-small font-medium transition-colors",
                          added ? "bg-brand-soft text-brand-on-soft" : "border border-border hover:bg-surface",
                        )}
                      >
                        {added ? <Check aria-hidden className="size-4" strokeWidth={2.5} /> : <Plus aria-hidden className="size-4" />}
                        {added ? t("invite.added") : t("invite.add")}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {pages > 1 && (
              <nav aria-label={t("invite.pages")} className="flex items-center justify-between gap-3 border-t border-border px-5 py-2.5">
                <button
                  type="button"
                  onClick={() => setPage(current - 1)}
                  disabled={current === 0}
                  aria-label={t("invite.previousPage")}
                  className="grid size-9 place-items-center rounded-full border border-border transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
                </button>
                <span className="text-small text-text-muted tabular-nums">
                  {t("invite.pageRange", { from: f.number(current * PAGE + 1), to: f.number(current * PAGE + visible.length), total: f.number(listCreators.length) })}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(current + 1)}
                  disabled={current >= pages - 1}
                  aria-label={t("invite.nextPage")}
                  className="grid size-9 place-items-center rounded-full border border-border transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
                </button>
              </nav>
            )}
          </Frame>
        )}

        {/* Who's in: each with a platform (exactly one: one video), removable. */}
        <Frame className="flex flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 className="font-medium">{t("invite.invitees")}</h2>
            {picked.length > 0 && <span className="text-small text-text-muted">{tp("invite.selected", picked.length)}</span>}
          </div>
          {picked.length === 0 ? (
            <p className="p-5 text-small text-text-muted">{preset ? t("invite.emptyList") : t("invite.noneChosen")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {picked.map((c) => {
                const needsPlatform = !formats.has(c.id);
                return (
                  <li key={c.id} id={`invitee-${c.id}`} className="flex flex-col gap-3 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar id={c.id} name={c.name} src={c.photo} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.name}</span>
                        <span className="block truncate text-small text-text-muted">
                          {c.city}
                          {c.inCampaign && ` · ${t("invite.inCampaign")}`}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        aria-label={t("invite.remove", { name: c.name })}
                        className="grid size-9 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface hover:text-text"
                      >
                        <X aria-hidden className="size-4" />
                      </button>
                    </div>
                    <div role="radiogroup" aria-label={`${t("invite.platforms")} · ${c.name}`} aria-describedby={needsPlatform ? `invitee-${c.id}-hint` : undefined} className="flex flex-wrap gap-2 ps-[52px]">
                      {c.packages.map((p) => {
                        const active = formats.get(c.id) === p.format;
                        return (
                          <button
                            key={p.format}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => chooseFormat(c, p.format)}
                            className={cn(
                              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-small transition-colors",
                              active ? "border-primary bg-card font-medium" : "border-border text-text-muted hover:bg-surface",
                            )}
                          >
                            {active && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                            <FormatLogo format={p.format} className="size-3.5" />
                            {p.label}
                            <span className="tabular-nums">{f.money(priceForBrand(p.price))}</span>
                          </button>
                        );
                      })}
                    </div>
                    {needsPlatform && (
                      <p id={`invitee-${c.id}-hint`} className={cn("ps-[52px] text-small", checked ? "font-medium text-error" : "text-text-muted")}>
                        {t("invite.pickPlatform")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {err("pick") && (
            <div className="border-t border-border px-5 py-3">
              <FieldError>{err("pick")}</FieldError>
            </div>
          )}
        </Frame>
      </>
    );
  }

  return { chosen, picked, invitees, missing, total, render };
}

/** A section frame without the card's shadow, for a picker inside another card. */
function BareFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-[var(--radius-lg)] border border-border", className)}>{children}</div>;
}
