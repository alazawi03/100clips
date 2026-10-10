"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";

const subscribe = () => () => {};

/**
 * Side drawer on the inline end (left in Arabic); a full-screen sheet on phones.
 * Rendered in a portal so it can open from inside a form without nesting forms.
 * Children mount only while open, so a form inside starts fresh each time.
 * `footer` is pinned to the bottom edge, outside the scrolling body.
 */
export function Drawer({ open, onClose, title, footer, children }: { open: boolean; onClose: () => void; title: string; footer?: ReactNode; children: ReactNode }) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  // False during server render and hydration, true after: the portal needs document.body.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open, mounted]);

  if (!mounted) return null;
  return createPortal(
    <dialog
      ref={dialog}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      className="fixed inset-y-0 m-0 ms-auto me-0 h-dvh max-h-none w-full max-w-none bg-background p-0 text-text shadow-lift backdrop:bg-[var(--overlay)] sm:max-w-[520px] sm:border-s sm:border-border"
    >
      {open && (
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 className="min-w-0 truncate text-h3 font-medium">{title}</h2>
            <button type="button" onClick={onClose} aria-label={t("nav.close")} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface">
              <X aria-hidden className="size-5" />
            </button>
          </header>
          <div className={cn("flex-1 overflow-y-auto p-5", !footer && "pb-[calc(1.25rem+env(safe-area-inset-bottom))]")}>{children}</div>
          {footer && <footer className="border-t border-border bg-background px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{footer}</footer>}
        </div>
      )}
    </dialog>,
    document.body,
  );
}
