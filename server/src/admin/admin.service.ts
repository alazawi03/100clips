import { Injectable } from "@nestjs/common";
import { Caller, Db, Queryable } from "../common/db/db";
import { DecideCreatorDto } from "./dto/decide-creator.dto";
import { PendingApplication } from "./entities/pending-application.entity";

/**
 * Admin work. Row-level security already shows admins everything and the admin functions check
 * the role themselves; the explicit check here turns "nothing visible" into a clear 403.
 */
@Injectable()
export class AdminService {
  constructor(private readonly db: Db) {}

  /** Creators waiting for review, oldest submission first. Undefined if the caller isn't an admin. */
  async pendingApplications(caller: Caller): Promise<PendingApplication[] | undefined> {
    return this.db.run(caller, async (q) => {
      if (!(await this.isAdmin(q))) return undefined;
      return (await q.query<PendingApplication>(`
        select to_jsonb(c) as creator,
          coalesce((select jsonb_agg(jsonb_build_object('format', f.format, 'price', f.price) order by f.format) from public.creator_formats f where f.creator_id = c.id), '[]') as formats,
          coalesce((select jsonb_agg(jsonb_build_object('platform', s.platform, 'username', s.username) order by s.platform) from public.creator_socials s where s.creator_id = c.id), '[]') as socials,
          to_jsonb(a) - 'creator_id' - 'decided_by' as application,
          (select to_jsonb(p) - 'creator_id' - 'decided_by' from public.creator_approvals p
            where p.creator_id = c.id and p.decision is not null order by p.submitted_at desc limit 1) as previous
        from public.creator_approvals a join public.creators c on c.id = a.creator_id
        where a.decision is null
        order by a.submitted_at
      `)).rows;
    });
  }

  /** decide_creator: approve, ask for changes, or reject the waiting application (409 if none waits). */
  async decide(caller: Caller, creatorId: string, { decision, note }: DecideCreatorDto): Promise<void> {
    await this.db.run(caller, (q) => q.query(`select public.decide_creator($1, $2, $3)`, [creatorId, decision, note ?? null]));
  }

  private async isAdmin(q: Queryable): Promise<boolean> {
    const { rows } = await q.query(`select 1 from public.accounts where id = (select auth.uid()) and role = 'admin'`);
    return rows.length > 0;
  }
}
