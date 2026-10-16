import Image from "next/image";

/** Sign-in, sign-up and onboarding: no app navigation, just the logo. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 px-4 py-10">
      <Image src="/laqta-logo-black.svg" alt="laqta" width={2205} height={960} priority className="h-7 w-auto self-start dark:hidden" />
      <Image src="/laqta-logo-white.svg" alt="laqta" width={2205} height={960} priority className="hidden h-7 w-auto self-start dark:block" />
      {children}
    </div>
  );
}
