import { Injectable } from "@nestjs/common";
import { isAdmin, logAdminAction } from "../common/db/access";
import { Caller, Db, elevated, userIdOf } from "../common/db/db";
import { ConflictError, ForbiddenError } from "../common/errors";
import { DecideCreatorDto } from "./dto/decide-creator.dto";
import { PendingApplication } from "./entities/pending-application.entity";

/** Admin work. Every action checks the caller is an admin first, and is written to admin_log. */
@Injectable()
export class AdminService {
  constructor(private readonly db: Db) {}

  /** Creators waiting for review, oldest submission first. Undefined if the caller isn't an admin. */
  async pendingApplications(caller: Caller): Promise<PendingApplication[] | undefined> {
    return this.db.run(caller, async (q) => {
      if (!(await isAdmin(q, userIdOf(caller)))) return undefined;
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

  /**
   * Approve, ask for changes, or reject the waiting application. The verdict goes on that
   * application (the creator sees the note) and becomes the creator's status.
   */
  async decide(caller: Caller, creatorId: string, { decision, note }: DecideCreatorDto): Promise<void> {
    const adminId = userIdOf(caller);
    await this.db.run(elevated(caller), async (q) => {
      if (!(await isAdmin(q, adminId))) throw new ForbiddenError("Admins only");
      const trimmed = note?.trim() || null;
      // Only the waiting one changes; a second admin deciding at the same time finds none (409).
      const { rows } = await q.query(`
        update public.creator_approvals set decision = $2, note = $3, decided_by = $4, decided_at = now()
        where creator_id = $1 and decision is null returning id
      `, [creatorId, decision, trimmed, adminId]);
      if (!rows.length) throw new ConflictError("No application waiting");
      await q.query(`
        update public.creators set status = $2::public.creator_status,
          approved_at = case when $2::public.creator_status = 'approved' then now() else approved_at end
        where id = $1
      `, [creatorId, decision]);
      const action = decision === "approved" ? "creator_approved" : decision === "changes_requested" ? "changes_requested" : "creator_rejected";
      await logAdminAction(q, adminId, action, { kind: "creator", id: creatorId }, trimmed);
    });
  }
}
