"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { buttonClass, type ButtonVariant } from "./buttonStyles";

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

/**
 * A button that shows it's working. A submit button does by itself while its form's action runs: a
 * spinner in place of its icon, and no second press until the server answers. Any other button does
 * when given aria-busy (a transition it started). In a form with several submit buttons, only the one
 * pressed spins (told apart by name and value); all of them wait.
 */
export function Button({ variant = "primary", className, type = "button", disabled, children, ...props }: ButtonProps) {
  const form = useFormStatus();
  const submitting = type === "submit" && form.pending;
  const pressed = submitting && (!props.name || form.data?.get(props.name) === String(props.value ?? ""));
  const busy = pressed || props["aria-busy"] === true || props["aria-busy"] === "true";
  return (
    <button type={type} className={buttonClass(variant, className)} disabled={disabled || submitting} {...props} aria-busy={busy || undefined}>
      {busy && <LoaderCircle aria-hidden className="animate-spin" />}
      {children}
    </button>
  );
}
