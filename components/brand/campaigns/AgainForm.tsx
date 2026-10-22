"use client";

import { useRef, useState, type ReactNode } from "react";
import { Pencil, Plus, X } from "lucide-react";
import type { CheckoutState } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Card } from "@/components/ui/Card";
import { DateInput } from "@/components/ui/DateInput";
import { Field, FieldError, Input, Textarea } from "@/components/ui/Form";
import { createFormatters } from "@/lib/i18n/format";
import type { ContentFormat } from "@/lib/data/types";
import { InviteForm, type InviteCreator } from "./InviteForm";

/** What the new campaign starts with: the old one's brief and details, and a deadline as far out as before. */
export type AgainDefaults = {
  title: string;
  brief: string;
  deadline?: string;
  keyMessage?: string;
  references: string[];
  mustInclude?: string;
  avoid?: string;
  /** Shown, not editable: they define the campaign. */
  product?: string;
  videoStyle?: string;
};

const FIELDS = [
  "title",
  "brief",
  "deadline",
  "keyMessage",
  "mustInclude",
  "avoid",
] as const;

/**
 * "Run again": this campaign's creators start ticked with last time's platform, more can come from a
 * list, the details are the same unless edited, then pay. A new campaign, not through the cart.
 */
export function AgainForm({
  action,
  lists,
  explore,
  defaultFormats,
  defaults,
  minDeadline,
  balance,
  cardOnline,
}: {
  action: (prev: CheckoutState, form: FormData) => Promise<CheckoutState>;
  lists: Array<{ id: string; name: string; creators: InviteCreator[] }>;
  explore: { creators: InviteCreator[] };
  defaultFormats: Record<string, ContentFormat>;
  defaults: AgainDefaults;
  minDeadline: string;
  balance: number;
  cardOnline: boolean;
}) {
  return (
    <InviteForm
      action={action}
      lists={lists}
      explore={explore}
      initialListId={lists[0]?.id}
      tickList
      defaultFormats={defaultFormats}
      balance={balance}
      cardOnline={cardOnline}
      details={(form) => (
        <AgainDetails defaults={defaults} minDeadline={minDeadline} {...form} />
      )}
    />
  );
}

function AgainDetails({
  defaults,
  minDeadline,
  err,
  v,
}: {
  defaults: AgainDefaults;
  minDeadline: string;
  err: (name: string) => string | undefined;
  v: (name: string) => string | undefined;
}) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const hasError =
    FIELDS.some((n) => err(n)) ||
    defaults.references.some((_, i) => err(`reference-${i}`));
  const [editing, setEditing] = useState(false);
  const open = editing || hasError;
  const [refs, setRefs] = useState<string[]>(() =>
    defaults.references.length ? defaults.references : [""],
  );
  // Submitted values win (after an error), then the old campaign's.
  const val = (name: (typeof FIELDS)[number]) =>
    v(name) ?? defaults[name] ?? "";
  // The fields stay mounted (hidden when not editing) so edits always go with the form; the summary
  // shows what they held when "Done" was pressed.
  const fields = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((n) => [n, val(n)])),
  );
  const toggle = () => {
    if (open && fields.current) {
      const read = (n: string) =>
        (
          fields.current!.querySelector(
            `[name="${n}"]`,
          ) as HTMLInputElement | null
        )?.value ?? "";
      setShown(Object.fromEntries(FIELDS.map((n) => [n, read(n)])));
    }
    setEditing((e) => !e);
  };

  const links = refs.filter(Boolean);
  const summary: Array<[string, ReactNode]> = [
    [t("campaignDetail.product"), defaults.product],
    [t("checkout.videoStyle"), defaults.videoStyle],
    [t("checkout.titleLabel"), shown.title],
    [t("checkout.briefLabel"), shown.brief],
    [
      t("checkout.deadline"),
      shown.deadline ? f.date(shown.deadline) : t("campaignDetail.noDeadline"),
    ],
    [t("checkout.keyMessage"), shown.keyMessage || undefined],
    [
      t("checkout.references"),
      // Links read left to right in both languages.
      links.length > 0
        ? links.map((r) => (
            <span key={r} dir="ltr" className="block truncate text-left rtl:text-right">
              {r}
            </span>
          ))
        : undefined,
    ],
    [t("checkout.mustInclude"), shown.mustInclude || undefined],
    [t("checkout.avoid"), shown.avoid || undefined],
  ];

  return (
    <Card className="flex flex-col gap-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-h2 font-medium">{t("again.details")}</h2>
          {!open && (
            <p className="text-small text-text-muted">
              {t("again.sameAsBefore")}
            </p>
          )}
        </div>
        {!hasError && (
          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-small font-medium transition-colors hover:bg-surface"
          >
            {open ? null : <Pencil aria-hidden className="size-4" />}
            {open ? t("again.doneEditing") : t("again.edit")}
          </button>
        )}
      </div>

      <div ref={fields} className={open ? "flex flex-col gap-5" : "hidden"}>
        <p className="text-small text-text-muted">
          {t("again.lockedHint", {
            product: defaults.product ?? "–",
            style: defaults.videoStyle ?? "–",
          })}
        </p>
        <Field
          label={t("checkout.titleLabel")}
          htmlFor="again-title"
          required
          error={err("title")}
        >
          <Input
            id="again-title"
            name="title"
            defaultValue={val("title")}
            aria-invalid={!!err("title")}
          />
        </Field>
        <Field
          label={t("checkout.briefLabel")}
          htmlFor="again-brief"
          required
          error={err("brief")}
        >
          <Textarea
            id="again-brief"
            name="brief"
            defaultValue={val("brief")}
            className="min-h-28"
            aria-invalid={!!err("brief")}
          />
        </Field>
        <Field
          label={t("checkout.deadline")}
          htmlFor="again-deadline"
          hint={t("checkout.deadlineHint")}
          error={err("deadline")}
        >
          <DateInput
            id="again-deadline"
            name="deadline"
            min={minDeadline}
            defaultValue={val("deadline") || undefined}
            aria-invalid={!!err("deadline")}
            className="sm:max-w-72"
          />
        </Field>
        <Field
          label={t("checkout.keyMessage")}
          htmlFor="again-key"
          hint={t("checkout.keyMessageHint")}
        >
          <Input
            id="again-key"
            name="keyMessage"
            maxLength={200}
            defaultValue={val("keyMessage")}
          />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 flex w-full items-center justify-between gap-3 font-medium">
            {t("checkout.references")}
            {refs.length < 3 && (
              <button
                type="button"
                onClick={() => setRefs((list) => [...list, ""])}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-small font-medium transition-colors hover:bg-surface"
              >
                <Plus aria-hidden className="size-4" />
                {t("checkout.addReference")}
              </button>
            )}
          </legend>
          {refs.map((ref, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="relative">
                <Input
                  name="reference"
                  type="url"
                  inputMode="url"
                  dir="ltr"
                  aria-label={`${t("checkout.references")} ${i + 1}`}
                  value={ref}
                  onChange={(e) =>
                    setRefs((list) =>
                      list.map((x, j) => (j === i ? e.target.value : x)),
                    )
                  }
                  placeholder={t("checkout.referencePlaceholder")}
                  aria-invalid={!!err(`reference-${i}`)}
                  className={refs.length > 1 ? "pe-12" : undefined}
                />
                {refs.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setRefs((list) => list.filter((_, j) => j !== i))
                    }
                    aria-label={`${t("checkout.removeReference")} ${i + 1}`}
                    className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-text-muted hover:bg-surface"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                )}
              </div>
              {err(`reference-${i}`) && (
                <FieldError>{err(`reference-${i}`)}</FieldError>
              )}
            </div>
          ))}
        </fieldset>
        <Field label={t("checkout.mustInclude")} htmlFor="again-must">
          <Textarea
            id="again-must"
            name="mustInclude"
            maxLength={500}
            className="min-h-16"
            defaultValue={val("mustInclude")}
          />
        </Field>
        <Field label={t("checkout.avoid")} htmlFor="again-avoid">
          <Textarea
            id="again-avoid"
            name="avoid"
            maxLength={500}
            className="min-h-16"
            defaultValue={val("avoid")}
          />
        </Field>
      </div>
      {!open && (
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {summary
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div
                key={label}
                className="flex min-w-0 flex-col gap-0.5 text-small"
              >
                <dt className="text-text-muted">{label}</dt>
                {/* Text the brand typed takes its own direction (an English brief on an Arabic page). */}
                <dd dir={Array.isArray(value) ? undefined : "auto"} className="whitespace-pre-line break-words">
                  {value}
                </dd>
              </div>
            ))}
        </dl>
      )}
    </Card>
  );
}
