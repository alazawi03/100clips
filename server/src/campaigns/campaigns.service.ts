import { Injectable } from "@nestjs/common";
import { Caller, Db, Queryable } from "../common/db/db";
import { CampaignDetailsDto, ExtendDeadlineDto } from "./dto/campaign-details.dto";
import { CampaignSecretsDto } from "./dto/campaign-secrets.dto";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { ListCampaignsQueryDto } from "./dto/list-campaigns.query.dto";
import { UpdateCampaignDto } from "./dto/update-campaign.dto";
import { Campaign, CampaignSecrets, CampaignWithSecrets } from "./entities/campaign.entity";

/** Draft columns a brand owner may set, in a fixed order (never taken from the request). */
const COLUMNS = [
  "product_id", "title", "brief", "video_style", "deadline", "key_message", "reference_links", "must_include", "avoid", "logistics", "draft",
] as const;
type Column = (typeof COLUMNS)[number];
const JSON_COLUMNS = new Set<Column>(["logistics", "draft"]);

/** What "Run again" copies: the brief, not the deadline (it has passed) or the saved form. */
const COPIED = ["brand_id", "product_id", "title", "brief", "video_style", "key_message", "reference_links", "must_include", "avoid", "logistics"];

const placeholder = (c: Column, n: number) => (JSON_COLUMNS.has(c) ? `$${n}::jsonb` : `$${n}`);
const param = (c: Column, value: unknown) => (JSON_COLUMNS.has(c) && value != null ? JSON.stringify(value) : value);

/** Why a draft-only write changed nothing. */
export type NotWritable = "not_found" | "not_draft";
/** Why a live-only change can't happen. */
export type NotLive = "not_found" | "not_live";

/**
 * Row-level security lets owners write drafts only. A live campaign changes through the database
 * functions edit_campaign_details and extend_deadline, which record each change.
 */
@Injectable()
export class CampaignsService {
  constructor(private readonly db: Db) {}

  /** The caller's campaigns (brand owners), or the ones they have offers on (creators). Newest first. */
  async list(caller: Caller, { brand_id, status, limit, offset }: ListCampaignsQueryDto): Promise<Campaign[]> {
    return this.db.run(caller, async (q) => (await q.query<Campaign>(`
      select * from public.campaigns
      where ($1::uuid is null or brand_id = $1) and ($2::public.campaign_status is null or status = $2)
      order by created_at desc limit $3 offset $4
    `, [brand_id ?? null, status ?? null, limit, offset])).rows);
  }

  async get(caller: Caller, id: string): Promise<CampaignWithSecrets | undefined> {
    return this.db.run(caller, (q) => this.withSecrets(q, id));
  }

  /** Refused by the database (403) unless the caller owns the brand. */
  async create(caller: Caller, brandId: string, dto: CreateCampaignDto): Promise<Campaign> {
    const values = { ...dto, reference_links: dto.reference_links ?? [], logistics: dto.logistics ?? {} } as Record<Column, unknown>;
    const [campaign] = await this.db.run(caller, async (q) => (await q.query<Campaign>(
      `insert into public.campaigns (brand_id, ${COLUMNS.join(", ")})
       values ($1, ${COLUMNS.map((c, i) => placeholder(c, i + 2)).join(", ")}) returning *`,
      [brandId, ...COLUMNS.map((c) => param(c, values[c] ?? null))],
    )).rows);
    return campaign;
  }

  async update(caller: Caller, id: string, dto: UpdateCampaignDto): Promise<Campaign | NotWritable> {
    const sent = COLUMNS.filter((c) => dto[c] !== undefined);
    return this.db.run(caller, async (q) => {
      const [campaign] = (await q.query<Campaign>(
        sent.length
          ? `update public.campaigns set ${sent.map((c, i) => `${c} = ${placeholder(c, i + 2)}`).join(", ")} where id = $1 returning *`
          : `select * from public.campaigns where id = $1 and status = 'draft'`,
        [id, ...sent.map((c) => param(c, c === "reference_links" ? dto[c] ?? [] : dto[c]))],
      )).rows;
      return campaign ?? this.whyNot(q, id);
    });
  }

  async remove(caller: Caller, id: string): Promise<"deleted" | NotWritable> {
    return this.db.run(caller, async (q) => {
      const { rows } = await q.query(`delete from public.campaigns where id = $1 returning id`, [id]);
      return rows.length ? "deleted" : this.whyNot(q, id);
    });
  }

  /** "Run again": a new draft with the same brief and secrets. */
  async copy(caller: Caller, id: string): Promise<Campaign | undefined> {
    return this.db.run(caller, async (q) => {
      const [copy] = (await q.query<Campaign>(`
        insert into public.campaigns (${COPIED.join(", ")}, copied_from)
        select ${COPIED.map((c) => `c.${c}`).join(", ")}, c.id
        from public.campaigns c join public.brands b on b.id = c.brand_id
        where c.id = $1 and b.account_id = (select auth.uid())
        returning *
      `, [id])).rows;
      if (copy) {
        await q.query(`
          insert into public.campaign_secrets (campaign_id, access_link, login_details, code)
          select $2, access_link, login_details, code from public.campaign_secrets where campaign_id = $1
        `, [id, copy.id]);
      }
      return copy;
    });
  }

  /** edit_campaign_details: live campaigns only, and 409 once a creator accepted. */
  async editDetails(caller: Caller, id: string, dto: CampaignDetailsDto): Promise<CampaignWithSecrets | NotLive> {
    return this.db.run(caller, async (q) => {
      const notLive = await this.whyNotLive(q, id);
      if (notLive) return notLive;
      await q.query(`select public.edit_campaign_details($1, $2, $3, $4, $5)`, [
        id, dto.key_message ?? null, dto.reference_links ?? null, dto.must_include ?? null, dto.avoid ?? null,
      ]);
      return (await this.withSecrets(q, id))!;
    });
  }

  /** extend_deadline: live campaigns only; 400 unless later than the current deadline and today. */
  async extendDeadline(caller: Caller, id: string, { deadline }: ExtendDeadlineDto): Promise<CampaignWithSecrets | NotLive> {
    return this.db.run(caller, async (q) => {
      const notLive = await this.whyNotLive(q, id);
      if (notLive) return notLive;
      await q.query(`select public.extend_deadline($1, $2::date)`, [id, deadline]);
      return (await this.withSecrets(q, id))!;
    });
  }

  /** The saved secrets, or undefined if the campaign isn't the caller's. */
  async setSecrets(caller: Caller, id: string, dto: CampaignSecretsDto): Promise<CampaignSecrets | undefined> {
    return this.db.run(caller, async (q) => {
      if (!(await this.ownStatus(q, id))) return undefined;
      const [secrets] = (await q.query<CampaignSecrets>(`
        insert into public.campaign_secrets (campaign_id, access_link, login_details, code) values ($1, $2, $3, $4)
        on conflict (campaign_id) do update set
          access_link = excluded.access_link, login_details = excluded.login_details, code = excluded.code
        returning access_link, login_details, code
      `, [id, dto.access_link ?? null, dto.login_details ?? null, dto.code ?? null])).rows;
      return secrets;
    });
  }

  private async withSecrets(q: Queryable, id: string): Promise<CampaignWithSecrets | undefined> {
    const [row] = (await q.query<{ campaign: CampaignWithSecrets }>(`
      select to_jsonb(c) || jsonb_build_object('secrets',
        (select to_jsonb(s) - 'campaign_id' from public.campaign_secrets s where s.campaign_id = c.id)) as campaign
      from public.campaigns c where c.id = $1
    `, [id])).rows;
    return row?.campaign;
  }

  /** The campaign's status if the caller owns it. */
  private async ownStatus(q: Queryable, id: string): Promise<string | undefined> {
    const [row] = (await q.query<{ status: string }>(`
      select c.status from public.campaigns c join public.brands b on b.id = c.brand_id
      where c.id = $1 and b.account_id = (select auth.uid())
    `, [id])).rows;
    return row?.status;
  }

  /** Before a live-only change: undefined if it may go ahead. */
  private async whyNotLive(q: Queryable, id: string): Promise<NotLive | undefined> {
    const status = await this.ownStatus(q, id);
    return !status ? "not_found" : status !== "live" ? "not_live" : undefined;
  }

  /** After a draft-only write touched no row: not the caller's campaign, or no longer a draft. */
  private async whyNot(q: Queryable, id: string): Promise<NotWritable> {
    const status = await this.ownStatus(q, id);
    return status && status !== "draft" ? "not_draft" : "not_found";
  }
}
