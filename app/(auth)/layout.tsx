import Image from "next/image";

/** Sign-in, sign-up and onboarding: no app navigation, just the logo. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 px-4 py-10">
      <Image src="/100clips-wordmark-on-light.svg" alt="100clips" width={575} height={128} priority className="h-7 w-auto self-start dark:hidden" />
      <Image src="/100clips-wordmark-on-dark.svg" alt="100clips" width={575} height={128} priority className="hidden h-7 w-auto self-start dark:block" />
      {children}
    </div>
  );
}
