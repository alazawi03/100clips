import { CircleAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const controlClass =
  "w-full rounded-[var(--radius-sm)] border border-transparent bg-surface px-3 text-text placeholder:text-text-muted focus:outline-2 focus:outline-offset-0 focus:outline-primary aria-[invalid=true]:border-error";

export function Field({ label, htmlFor, error, hint, children }: { label: ReactNode; htmlFor: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 font-medium">
        {label}
      </label>
      {children}
      {error ? <FieldError id={`${htmlFor}-error`}>{error}</FieldError> : hint ? <p className="text-small text-text-muted">{hint}</p> : null}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-center gap-1 text-small text-error">
      <CircleAlert aria-hidden className="size-4 shrink-0" />
      {children}
    </p>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "min-h-28 resize-y py-2.5 leading-6", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(controlClass, "h-11 appearance-none bg-[length:16px] bg-no-repeat pe-9", selectChevron, className)} {...props} />;
}

/** Chevron drawn on the inline end, so it mirrors with the page direction. */
export const selectChevron =
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238A8794' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[position:right_12px_center] rtl:bg-[position:left_12px_center]";
