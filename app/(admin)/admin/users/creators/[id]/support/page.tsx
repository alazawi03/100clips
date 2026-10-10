import { notFound } from "next/navigation";
import { SupportComposer } from "@/components/admin/SupportComposer";
import { SupportAvatar, SupportName } from "@/components/admin/SupportIdentity";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { supportThreads } from "@/lib/admin/data";
import { DEMO_TODAY } from "@/lib/data/account";
import { getCreator } from "@/lib/data/creators";
import { cn } from "@/lib/cn";
import { getI18n } from "@/lib/i18n/server";

/** The creator's chat with 100Clips Support. Admins write as the official account, never as themselves. */
export default async function AdminSupportChatPage({ params }: PageProps<"/admin/users/creators/[id]/support">) {
  const { id } = await params;
  const creator = getCreator(id);
  if (!creator) notFound();
  const { t, f } = await getI18n();
  const name = f.pick(creator.name);
  const messages = supportThreads[id] ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={t("admin.support.title", { name })} back={{ href: `/admin/users/creators/${id}`, label: name }} />
      <Card className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <SupportAvatar />
          <div className="min-w-0">
            <SupportName />
            <p className="text-small text-text-muted">{t("admin.support.writingAs")}</p>
          </div>
        </div>
        <ol className="flex min-h-64 flex-col gap-3 p-4">
          {messages.length === 0 && <li className="m-auto max-w-sm text-center text-small text-text-muted">{t("admin.support.empty", { name })}</li>}
          {messages.map((m) => {
            const mine = m.from === "support";
            return (
              <li key={m.id} className={cn("flex max-w-[80%] items-end gap-2", mine ? "ms-auto flex-row-reverse" : "me-auto")}>
                {mine ? <SupportAvatar className="size-7" /> : <Avatar id={creator.id} name={name} size="xs" />}
                <div className={cn("rounded-[var(--radius-lg)] px-3.5 py-2", mine ? "bg-primary text-on-primary" : "bg-surface")}>
                  <p dir="auto" className="whitespace-pre-wrap">{m.text}</p>
                  <p className={cn("mt-1 text-caption", mine ? "opacity-70" : "text-text-muted")}>{f.messageTime(m.at, DEMO_TODAY)}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <SupportComposer creatorId={id} />
      </Card>
    </div>
  );
}
