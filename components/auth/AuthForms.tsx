"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { sendPasswordReset, signIn, signUp, updatePassword, type AuthFormState } from "@/app/actions/auth";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Field, FieldError, Input } from "@/components/ui/Form";
import { Notice } from "@/components/ui/Notice";
import { createClient } from "@/lib/supabase/client";

/** The form's error, under the fields: Supabase answers for the whole form, not one field. */
function FormError({ state }: { state: AuthFormState }) {
  const { t } = useI18n();
  return state?.error ? <FieldError>{t(state.error)}</FieldError> : null;
}

function EmailField({ state, autoFocus }: { state: AuthFormState; autoFocus?: boolean }) {
  const { t } = useI18n();
  return (
    <Field label={t("auth.email")} htmlFor="email">
      <Input id="email" name="email" type="email" autoComplete="email" dir="ltr" required autoFocus={autoFocus} defaultValue={state?.values?.email} />
    </Field>
  );
}

function PasswordField({ autoComplete, label }: { autoComplete: "current-password" | "new-password"; label?: string }) {
  const { t } = useI18n();
  return (
    <Field label={label ?? t("auth.password")} htmlFor="password" hint={autoComplete === "new-password" ? t("auth.passwordHint") : undefined}>
      <Input id="password" name="password" type="password" autoComplete={autoComplete} dir="ltr" required minLength={autoComplete === "new-password" ? 8 : undefined} />
    </Field>
  );
}

/** "Continue with Google": the browser goes to Google, then back through /auth/callback. */
export function GoogleButton({ next }: { next: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const { error } = await createClient().auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) setBusy(false);
      }}
    >
      <svg aria-hidden viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
      </svg>
      {t("auth.google")}
    </Button>
  );
}

function Or() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 text-small text-text-muted">
      <span className="h-px flex-1 bg-border" />
      {t("auth.or")}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function LoginForm({ next, linkError }: { next: string; linkError?: boolean }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(signIn, linkError ? { error: "auth.errors.linkExpired" } : null);
  return (
    <div className="flex flex-col gap-6">
      <GoogleButton next={next} />
      <Or />
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <EmailField state={state} autoFocus />
        <PasswordField autoComplete="current-password" />
        <Link href="/forgot-password" className="w-fit text-small text-primary hover:underline">
          {t("auth.forgot")}
        </Link>
        <FormError state={state} />
        <Button type="submit" disabled={pending}>
          {t("auth.loginButton")}
        </Button>
      </form>
      <p className="text-small text-text-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          {t("auth.signupLink")}
        </Link>
      </p>
    </div>
  );
}

export function SignupForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(signUp, null);
  if (state?.sentTo) {
    return (
      <Notice tone="info">
        <span className="block font-medium">{t("auth.checkEmailTitle")}</span>
        {t("auth.checkEmail", { email: state.sentTo })}
      </Notice>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <GoogleButton next="/onboarding" />
      <Or />
      <form action={action} className="flex flex-col gap-4">
        <Field label={t("auth.name")} htmlFor="name">
          <Input id="name" name="name" autoComplete="name" required autoFocus defaultValue={state?.values?.name} />
        </Field>
        <EmailField state={state} />
        <PasswordField autoComplete="new-password" />
        <FormError state={state} />
        <Button type="submit" disabled={pending}>
          {t("auth.signupButton")}
        </Button>
      </form>
      <p className="text-small text-text-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("auth.loginLink")}
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(sendPasswordReset, null);
  return (
    <div className="flex flex-col gap-6">
      {state?.sentTo ? (
        <Notice tone="info">{t("auth.linkSent", { email: state.sentTo })}</Notice>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <EmailField state={state} autoFocus />
          <FormError state={state} />
          <Button type="submit" disabled={pending}>
            {t("auth.sendLink")}
          </Button>
        </form>
      )}
      <Link href="/login" className="w-fit text-small text-primary hover:underline">
        {t("auth.backToLogin")}
      </Link>
    </div>
  );
}

export function ResetPasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(updatePassword, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <PasswordField autoComplete="new-password" label={t("auth.newPassword")} />
      <FormError state={state} />
      <Button type="submit" disabled={pending}>
        {t("auth.savePassword")}
      </Button>
    </form>
  );
}
