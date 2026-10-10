"use client";

import { useActionState, useEffect, useId, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, MoreHorizontal, Pencil, Plus, Repeat, X, type LucideIcon } from "lucide-react";
import { editCampaignDetails, extendDeadline, type FormState } from "@/app/actions/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DateInput";
import { Drawer } from "@/components/ui/Drawer";
import { Dropdown, menuItemClass } from "@/components/ui/Dropdown";
import { Field, FieldError, Input, Textarea } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import { createFormatters } from "@/lib/i18n/format";

export type CampaignDetails = { keyMessage?: string; references: string[]; mustInclude?: string; avoid?: string };

type Props = {
  campaignId: string;
  cancelled: boolean;
  /** Nobody has accepted yet: the details can still be edited. */
  canEdit: boolean;
  details: CampaignDetails;
  /** The current deadline; extending needs one, and creators still working. */
  deadline?: string;
  canExtend: boolean;
  /** Earliest date the deadline can move to, yyyy-mm-dd. */
  minDeadline: string;
};

type Open = "edit" | "extend" | null;

/**
 * ⋯ on the campaign header: run again (its own page), edit details, extend the deadline. There's no
 * cancelling a whole campaign: each offer nobody answered yet is withdrawn on its own order.
 */
export function CampaignMenu(props: Props) {
  const { campaignId, cancelled, canEdit, deadline, canExtend } = props;
  const { t } = useI18n();
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);
  const router = useRouter();
  // After saving, the page says what changed (?done=…) and marks it.
  const saved = (what: "detailsEdited" | "deadlineExtended") => () => {
    close();
    router.replace(`/campaigns/${campaignId}?done=${what}`, { scroll: false });
  };

  return (
    <>
      <Dropdown
        align="end"
        panelClassName="w-72"
        triggerLabel={t("campaignDetail.more")}
        triggerClassName="grid size-10 place-items-center rounded-full border border-border text-text-muted transition-colors hover:bg-surface hover:text-text"
        trigger={<MoreHorizontal aria-hidden className="size-5" />}
      >
        {(closeMenu) => {
          const pick = (which: Open) => () => {
            closeMenu();
            setOpen(which);
          };
          return (
            <ul>
              <li>
                {/* Its own page: the creators, the same details, and payment; not through the cart. */}
                <MenuItem icon={Repeat} label={t("campaignDetail.runAgain")} onClick={() => (closeMenu(), router.push(`/campaigns/${campaignId}/again`))} />
              </li>
              {!cancelled && (
                <>
                  <li>
                    <MenuItem icon={Pencil} label={t("campaignDetail.editDetails")} blocked={!canEdit && t("campaignDetail.editBlocked")} onClick={pick("edit")} />
                  </li>
                  <li>
                    <MenuItem
                      icon={CalendarClock}
                      label={t("campaignDetail.extendDeadline")}
                      blocked={!deadline ? t("campaignDetail.extendNoDeadline") : !canExtend && t("campaignDetail.extendDone")}
                      onClick={pick("extend")}
                    />
                  </li>
                </>
              )}
            </ul>
          );
        }}
      </Dropdown>

      <Drawer open={open === "edit"} onClose={close} title={t("campaignDetail.editDetails")}>
        <EditDetailsForm {...props} onDone={saved("detailsEdited")} />
      </Drawer>
      <Drawer open={open === "extend"} onClose={close} title={t("campaignDetail.extendDeadline")}>
        <ExtendForm {...props} onDone={saved("deadlineExtended")} />
      </Drawer>
    </>
  );
}

function MenuItem({ icon: Icon, label, blocked, onClick }: { icon: LucideIcon; label: string; blocked?: string | false; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={!!blocked}
      onClick={onClick}
      className={cn(menuItemClass, "disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-transparent")}
    >
      <Icon aria-hidden className="size-4" />
      <span className="flex flex-col">
        {label}
        {blocked && <span className="text-caption text-text-muted">{blocked}</span>}
      </span>
    </button>
  );
}

/** Runs the server action; `onDone` fires once it succeeds (no errors back). */
function useDrawerAction(action: (prev: FormState, form: FormData) => Promise<FormState>, onDone?: () => void) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, null);
  useEffect(() => {
    if (state && Object.keys(state.errors).length === 0) onDone?.();
  }, [state, onDone]);
  return { state, run, pending };
}

function Footer({ formId, label, pending, icon }: { formId: string; label: string; pending: boolean; icon: ReactNode }) {
  return (
    <Button type="submit" form={formId} variant="primary" aria-busy={pending} disabled={pending} className="w-full">
      {icon}
      {label}
    </Button>
  );
}

/** The extra details, editable until a creator accepts. */
function EditDetailsForm({ campaignId, details, onDone }: Props & { onDone: () => void }) {
  const { t } = useI18n();
  const formId = useId();
  const { state, run, pending } = useDrawerAction(editCampaignDetails.bind(null, campaignId), onDone);
  const v = (name: string, fallback?: string) => (state ? state.values[name] : fallback);
  const err = (name: string) => {
    const key = state?.errors[name];
    return key ? t(key) : undefined;
  };
  const [refs, setRefs] = useState<string[]>(() => (details.references.length ? details.references : [""]));
  return (
    <form id={formId} action={run} noValidate className="flex flex-col gap-5">
      <p className="text-small text-text-muted">{t("campaignDetail.editDetailsHint")}</p>
      {err("form") && <FieldError>{err("form")}</FieldError>}
      <Field label={t("checkout.keyMessage")} htmlFor={`${formId}-key`} hint={t("checkout.keyMessageHint")}>
        <Input id={`${formId}-key`} name="keyMessage" maxLength={200} defaultValue={v("keyMessage", details.keyMessage)} placeholder={t("checkout.keyMessagePlaceholder")} />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 flex w-full items-center justify-between gap-3 font-medium">
          {t("checkout.references")}
          {refs.length < 5 && (
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
                onChange={(e) => setRefs((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={t("checkout.referencePlaceholder")}
                aria-invalid={!!err(`reference-${i}`)}
                className={refs.length > 1 ? "pe-12" : undefined}
              />
              {refs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRefs((list) => list.filter((_, j) => j !== i))}
                  aria-label={`${t("checkout.removeReference")} ${i + 1}`}
                  className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-text-muted hover:bg-surface"
                >
                  <X aria-hidden className="size-4" />
                </button>
              )}
            </div>
            {err(`reference-${i}`) && <FieldError>{err(`reference-${i}`)}</FieldError>}
          </div>
        ))}
      </fieldset>
      <Field label={t("checkout.mustInclude")} htmlFor={`${formId}-must`}>
        <Textarea id={`${formId}-must`} name="mustInclude" maxLength={500} className="min-h-16" defaultValue={v("mustInclude", details.mustInclude)} placeholder={t("checkout.mustIncludePlaceholder")} />
      </Field>
      <Field label={t("checkout.avoid")} htmlFor={`${formId}-avoid`}>
        <Textarea id={`${formId}-avoid`} name="avoid" maxLength={500} className="min-h-16" defaultValue={v("avoid", details.avoid)} placeholder={t("checkout.avoidPlaceholder")} />
      </Field>
      <Footer formId={formId} label={t("campaignDetail.editSave")} pending={pending} icon={<Pencil aria-hidden />} />
    </form>
  );
}

/** A later deadline; never an earlier one. */
function ExtendForm({ campaignId, deadline, minDeadline, onDone }: Props & { onDone: () => void }) {
  const { t, locale } = useI18n();
  const f = createFormatters(locale);
  const formId = useId();
  const { state, run, pending } = useDrawerAction(extendDeadline.bind(null, campaignId), onDone);
  const err = state?.errors.deadline ? t(state.errors.deadline) : undefined;
  return (
    <form id={formId} action={run} noValidate className="flex flex-col gap-5">
      <p className="text-small text-text-muted">{t("campaignDetail.extendHint")}</p>
      {deadline && <p className="font-medium">{t("campaignDetail.extendCurrent", { date: f.date(deadline) })}</p>}
      <Field label={t("campaignDetail.extendNew")} htmlFor={`${formId}-date`} error={err}>
        <DateInput id={`${formId}-date`} name="deadline" min={minDeadline} defaultValue={state?.values.deadline} aria-invalid={!!err} aria-describedby={err ? `${formId}-date-error` : undefined} />
      </Field>
      <Footer formId={formId} label={t("campaignDetail.extendSave")} pending={pending} icon={<CalendarClock aria-hidden />} />
    </form>
  );
}
