"use client";

import { SendHorizontal } from "lucide-react";
import { useRef } from "react";
import { sendSupportMessage } from "@/app/actions/admin";
import { useI18n } from "@/components/i18n/I18nProvider";

/** Like the brand chat's composer, but sends as 100Clips Support. Enter sends, Shift+Enter adds a line. */
export function SupportComposer({ creatorId }: { creatorId: string }) {
  const { t } = useI18n();
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={sendSupportMessage.bind(null, creatorId)} className="flex items-end gap-2 border-t border-border p-3">
      <textarea
        name="text"
        rows={2}
        required
        aria-label={t("admin.support.placeholder")}
        placeholder={t("admin.support.placeholder")}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            form.current?.requestSubmit();
          }
        }}
        className="max-h-40 min-h-11 flex-1 resize-none rounded-[var(--radius-lg)] bg-surface px-4 py-2.5 placeholder:text-text-muted focus:outline-2 focus:outline-offset-0 focus:outline-primary"
      />
      <button type="submit" aria-label={t("admin.support.send")} className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary hover:bg-primary-hover">
        <SendHorizontal aria-hidden className="size-5 rtl:-scale-x-100" />
      </button>
    </form>
  );
}
