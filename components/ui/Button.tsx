import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { buttonClass, type ButtonVariant } from "./buttonStyles";

export { buttonClass, type ButtonVariant } from "./buttonStyles";
/** A client component: it shows its form is working (ActionButton.tsx). */
export { Button } from "./ActionButton";

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; children: ReactNode };

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
