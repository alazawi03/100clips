"use client";

import { SendHorizontal } from "lucide-react";
import { useActionState, useRef } from "react";
import { sendChatMessage } from "@/app/actions/messages";
import { useI18n } from "@/components/i18n/I18nProvider";

/** Enter sends, Shift+Enter adds a line. React clears the box after the action; if sending fails, the text comes back. */
export function Composer({ conversationId, defaultText }: { conversationId: string; defaultText?: string }) {
  const { t } = useI18n();
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(sendChatMessage.bind(null, conversationId), undefined);
  const text = state?.text ?? defaultText;
  return (
    <form ref={form} action={action} className="flex flex-col gap-1 border-t border-border p-3">
      {state?.failed && (
        <p role="alert" className="px-2 text-small text-error">
          {t("chat.sendFailed")}
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          key={state?.text ?? "draft"}
          name="text"
          rows={text ? 3 : 1}
          required
          defaultValue={text}
          autoFocus={!!text}
          aria-label={t("chat.placeholder")}
          placeholder={t("chat.placeholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (!pending) form.current?.requestSubmit();
            }
          }}
          className="max-h-40 min-h-11 flex-1 resize-none rounded-[var(--radius-lg)] bg-surface px-4 py-2.5 placeholder:text-text-muted focus:outline-2 focus:outline-offset-0 focus:outline-primary"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={t("chat.send")}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          <SendHorizontal aria-hidden className="size-5 rtl:-scale-x-100" />
        </button>
      </div>
    </form>
  );
}
