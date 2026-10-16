"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { Bookmark, Check, Heart, Plus } from "lucide-react";
import { createCreatorList, setCreatorInList } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, buttonClass } from "@/components/ui/Button";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";
import { Input } from "@/components/ui/Form";
import { cn } from "@/lib/cn";

export type ListOption = { id: string; name: string; count: number; has: boolean; favorites?: boolean };

/**
 * "Save" on a creator profile or card. Opens a menu of the account's lists to tick the creator into:
 * Favourites (with a heart) first, then the brand's own lists, then "New list".
 * `compact` is the round icon-only version used on creator cards.
 */
export function SaveToListButton({ creatorId, name, lists, compact }: { creatorId: string; name: string; lists: ListOption[]; compact?: boolean }) {
  const { t, tp } = useI18n();
  const [shown, toggle] = useOptimistic(lists, (current, id: string) =>
    current.map((l) => (l.id === id ? { ...l, has: !l.has, count: l.count + (l.has ? -1 : 1) } : l)),
  );
  const [, startTransition] = useTransition();
  const saved = shown.some((l) => l.has);
  const favorite = shown.some((l) => l.favorites && l.has);
  const TriggerIcon = favorite ? Heart : Bookmark;

  return (
    <Dropdown
      align="end"
      panelClassName="w-72"
      triggerLabel={t("lists.saveLabel", { name })}
      triggerClassName={cn(
        "inline-flex items-center rounded-full border font-medium transition-colors duration-[120ms]",
        compact ? "size-9 justify-center" : "h-10 gap-2 px-4 text-small",
        saved ? "border-brand-soft bg-brand-soft text-brand-on-soft" : "border-border bg-card text-text hover:bg-surface",
      )}
      trigger={
        <>
          <TriggerIcon aria-hidden className={cn("size-4", saved && "fill-current", favorite && compact && "text-error")} />
          {!compact && (saved ? t("lists.saved") : t("lists.save"))}
        </>
      }
    >
      {() => (
          <div className="flex flex-col">
            <p className="px-3 pt-1.5 pb-1 text-small font-medium text-text-muted">{t("lists.menuTitle")}</p>
            <ul>
              {shown.map((list) => (
                <li key={list.id}>
                  <button
                    type="button"
                    aria-pressed={list.has}
                    onClick={() =>
                      startTransition(async () => {
                        toggle(list.id);
                        await setCreatorInList(list.id, creatorId, !list.has);
                      })
                    }
                    className={menuItemClass}
                  >
                    <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center rounded-[6px] border-2 transition-colors", list.has ? "border-primary bg-primary text-on-primary" : "border-border")}>
                      {list.has && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                      {list.favorites && <Heart aria-hidden className={cn("size-4 shrink-0", list.has ? "fill-error text-error" : "text-text-muted")} />}
                      <span className="truncate">{list.favorites ? t("lists.favorites") : list.name}</span>
                    </span>
                    <span className="shrink-0 text-small text-text-muted tabular-nums">{tp("lists.creators", list.count)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="my-1 border-t border-border" />
            <AddListRow creatorId={creatorId} />
          </div>
      )}
    </Dropdown>
  );
}

/** "New list" at the bottom of the menu; turns into the name field when tapped. */
function AddListRow({ creatorId }: { creatorId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(menuItemClass, "font-medium text-primary")}>
        <Plus aria-hidden className="size-5" />
        {t("lists.newList")}
      </button>
    );
  }
  return (
    <div className="p-2">
      <NewListForm creatorId={creatorId} onDone={() => setOpen(false)} />
    </div>
  );
}

/** Name field + Create. From a profile, the new list starts with that creator in it. */
export function NewListForm({ creatorId, onDone }: { creatorId?: string; onDone: () => void }) {
  const { t } = useI18n();
  const id = useId();
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        startTransition(async () => {
          await createCreatorList(value, creatorId);
          onDone();
        });
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor={id} className="sr-only">
        {t("lists.nameLabel")}
      </label>
      <Input id={id} autoFocus maxLength={60} value={value} onChange={(e) => setValue(e.target.value)} placeholder={t("lists.namePlaceholder")} />
      <Button type="submit" variant="primary" disabled={!value.trim()} aria-busy={pending} className="w-full disabled:opacity-50">
        {t("lists.create")}
      </Button>
    </form>
  );
}

/** "New list" on the Lists page: a button that opens the name field. */
export function NewListButton() {
  const { t } = useI18n();
  return (
    <Dropdown
      align="end"
      panelClassName="w-72"
      triggerClassName={buttonClass("secondary")}
      trigger={
        <>
          <Plus aria-hidden />
          {t("lists.newList")}
        </>
      }
    >
      {(close) => (
        <div className="p-2">
          <NewListForm onDone={close} />
        </div>
      )}
    </Dropdown>
  );
}
