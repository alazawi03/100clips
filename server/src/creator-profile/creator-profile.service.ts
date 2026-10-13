import { Injectable } from "@nestjs/common";
import { Caller, Db, elevated, Queryable, userIdOf } from "../common/db/db";
import { assertOwnPath, ConflictError, InputError, NotFoundError } from "../common/errors";
import { Creator } from "../creators/entities/creator.entity";
import { CreateAddressDto, UpdateAddressDto } from "./dto/address.dto";
import { AddSampleDto, SubmitApplicationDto } from "./dto/application.dto";
import { CreateCreatorProfileDto, UpdateCreatorProfileDto } from "./dto/creator-profile.dto";
import { FormatPriceDto, SetFormatsDto, SetSocialsDto, SocialDto } from "./dto/offer-settings.dto";
import { Address, MyCreatorProfile, Sample } from "./entities/my-profile.entity";

/** Profile columns a creator may set (the database grants exactly these), in a fixed order. */
const PROFILE = ["handle", "name_ar", "name_en", "country", "city", "bio", "gender", "shows_face", "niches", "photo_path"] as const;
const ADDRESS = ["type", "label", "address_text", "latitude", "longitude"] as const;
const ADDRESS_COLUMNS = "id, type, label, address_text, latitude, longitude, created_at";
/** niches is an enum array: sent as text[] and cast, which every driver serializes the same way. */
const profileParam = (c: (typeof PROFILE)[number], n: number) => (c === "niches" ? `$${n}::text[]::public.niche[]` : `$${n}`);

/**
 * The signed-in creator's own profile. Row-level security limits every write to the caller's rows,
 * and the database caps samples (3) and addresses (5). Sending for review is checked here.
 */
@Injectable()
export class CreatorProfileService {
  constructor(private readonly db: Db) {}

  /** Undefined before the creator profile exists. */
  async get(caller: Caller): Promise<MyCreatorProfile | undefined> {
    return this.db.run(caller, (q) => this.load(q));
  }

  async create(caller: Caller, dto: CreateCreatorProfileDto): Promise<Creator> {
    assertOwnPath(caller, dto.photo_path, "photo_path");
    const sent = PROFILE.filter((c) => dto[c] !== undefined);
    const [creator] = await this.db.run(caller, async (q) => (await q.query<Creator>(
      `insert into public.creators (id${sent.map((c) => `, ${c}`).join("")})
       values ((select auth.uid())${sent.map((c, i) => `, ${profileParam(c, i + 1)}`).join("")}) returning *`,
      sent.map((c) => dto[c]),
    )).rows);
    return creator;
  }

  /** Undefined before the creator profile exists. */
  async update(caller: Caller, dto: UpdateCreatorProfileDto): Promise<Creator | undefined> {
    assertOwnPath(caller, dto.photo_path, "photo_path");
    const sent = PROFILE.filter((c) => dto[c] !== undefined);
    const [creator] = await this.db.run(caller, async (q) => (await q.query<Creator>(
      sent.length
        ? `update public.creators set ${sent.map((c, i) => `${c} = ${profileParam(c, i + 1)}`).join(", ")} where id = (select auth.uid()) returning *`
        : `select * from public.creators where id = (select auth.uid())`,
      sent.map((c) => dto[c]),
    )).rows);
    return creator;
  }

  /** Replaces the price list in one transaction. */
  async setFormats(caller: Caller, { formats }: SetFormatsDto): Promise<FormatPriceDto[]> {
    return this.db.run(caller, async (q) => {
      await q.query(`delete from public.creator_formats where creator_id = (select auth.uid())`);
      for (const f of formats) {
        await q.query(`insert into public.creator_formats (creator_id, format, price) values ((select auth.uid()), $1, $2)`, [f.format, f.price]);
      }
      return (await q.query<FormatPriceDto>(
        `select format, price from public.creator_formats where creator_id = (select auth.uid()) order by format`,
      )).rows;
    });
  }

  /** Replaces the social accounts in one transaction. */
  async setSocials(caller: Caller, { socials }: SetSocialsDto): Promise<SocialDto[]> {
    return this.db.run(caller, async (q) => {
      await q.query(`delete from public.creator_socials where creator_id = (select auth.uid())`);
      for (const s of socials) {
        await q.query(`insert into public.creator_socials (creator_id, platform, username) values ((select auth.uid()), $1, $2)`, [s.platform, s.username]);
      }
      return (await q.query<SocialDto>(
        `select platform, username from public.creator_socials where creator_id = (select auth.uid()) order by platform`,
      )).rows;
    });
  }

  async addSample(caller: Caller, { video_path }: AddSampleDto): Promise<Sample> {
    assertOwnPath(caller, video_path, "video_path");
    const [sample] = await this.db.run(caller, async (q) => (await q.query<Sample>(
      `insert into public.creator_portfolio (creator_id, video_path) values ((select auth.uid()), $1) returning id, video_path, created_at`,
      [video_path],
    )).rows);
    return sample;
  }

  async removeSample(caller: Caller, id: string): Promise<boolean> {
    const { rows } = await this.db.run(caller, (q) => q.query(`delete from public.creator_portfolio where id = $1 returning id`, [id]));
    return rows.length > 0;
  }

  async addresses(caller: Caller): Promise<Address[]> {
    return this.db.run(caller, async (q) => (await q.query<Address>(
      `select ${ADDRESS_COLUMNS} from public.creator_addresses where creator_id = (select auth.uid()) order by created_at`,
    )).rows);
  }

  async addAddress(caller: Caller, dto: CreateAddressDto): Promise<Address> {
    const [address] = await this.db.run(caller, async (q) => (await q.query<Address>(
      `insert into public.creator_addresses (creator_id, ${ADDRESS.join(", ")})
       values ((select auth.uid()), ${ADDRESS.map((_, i) => `$${i + 1}`).join(", ")}) returning ${ADDRESS_COLUMNS}`,
      ADDRESS.map((c) => dto[c] ?? null),
    )).rows);
    return address;
  }

  /** Undefined if the address doesn't exist or isn't the caller's. */
  async updateAddress(caller: Caller, id: string, dto: UpdateAddressDto): Promise<Address | undefined> {
    const sent = ADDRESS.filter((c) => dto[c] !== undefined);
    const [address] = await this.db.run(caller, async (q) => (await q.query<Address>(
      sent.length
        ? `update public.creator_addresses set ${sent.map((c, i) => `${c} = $${i + 2}`).join(", ")} where id = $1 returning ${ADDRESS_COLUMNS}`
        : `select ${ADDRESS_COLUMNS} from public.creator_addresses where id = $1`,
      [id, ...sent.map((c) => dto[c])],
    )).rows);
    return address;
  }

  async removeAddress(caller: Caller, id: string): Promise<boolean> {
    const { rows } = await this.db.run(caller, (q) => q.query(`delete from public.creator_addresses where id = $1 returning id`, [id]));
    return rows.length > 0;
  }

  /**
   * "Send for review": at sign-up, or again after changes were requested or a rejection. Checks the
   * profile is complete, then keeps the intro and samples as they are now, for the admin to judge.
   * The status and the application are the admin's to change, so this runs as the service role.
   */
  async submit(caller: Caller, { intro_video_path }: SubmitApplicationDto): Promise<MyCreatorProfile> {
    assertOwnPath(caller, intro_video_path, "intro_video_path");
    const userId = userIdOf(caller);
    return this.db.run(elevated(caller), async (q) => {
      // Locked, so two taps on "Send" make one application.
      const [creator] = (await q.query<Creator>(`select * from public.creators where id = $1 for update`, [userId])).rows;
      if (!creator) throw new NotFoundError("No creator profile yet. Create it first.");
      if (!["incomplete", "changes_requested", "rejected"].includes(creator.status)) throw new ConflictError("Already sent");

      // Left out on a resubmission: the previous intro is sent again.
      const [previous] = (await q.query<{ intro_video_path: string }>(
        `select intro_video_path from public.creator_approvals where creator_id = $1 order by submitted_at desc limit 1`, [userId],
      )).rows;
      const intro = intro_video_path ?? previous?.intro_video_path;
      const [has] = (await q.query<{ sample: boolean; social: boolean; price: boolean }>(`
        select exists (select 1 from public.creator_portfolio where creator_id = $1) as sample,
          exists (select 1 from public.creator_socials where creator_id = $1) as social,
          exists (select 1 from public.creator_formats where creator_id = $1) as price
      `, [userId])).rows;
      const missing = [
        !intro && "an intro video",
        !has.sample && "a sample clip",
        !has.social && "a social account",
        !creator.city && "your city",
        creator.niches.length === 0 && "your niches",
        !has.price && "your prices",
      ].filter(Boolean);
      if (missing.length) throw new InputError(`Still needed: ${missing.join(", ")}`);

      await q.query(`update public.creators set status = 'pending' where id = $1`, [userId]);
      await q.query(`
        insert into public.creator_approvals (creator_id, intro_video_path, sample_paths)
        values ($1, $2, array(select video_path from public.creator_portfolio where creator_id = $1 order by created_at))
      `, [userId, intro]);
      return (await this.load(q))!;
    });
  }

  private async load(q: Queryable): Promise<MyCreatorProfile | undefined> {
    const [row] = (await q.query<MyCreatorProfile>(`
      select to_jsonb(c) as creator,
        coalesce((select jsonb_agg(jsonb_build_object('format', f.format, 'price', f.price) order by f.format) from public.creator_formats f where f.creator_id = c.id), '[]') as formats,
        coalesce((select jsonb_agg(jsonb_build_object('platform', s.platform, 'username', s.username) order by s.platform) from public.creator_socials s where s.creator_id = c.id), '[]') as socials,
        coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'video_path', p.video_path, 'created_at', p.created_at) order by p.created_at) from public.creator_portfolio p where p.creator_id = c.id), '[]') as portfolio,
        coalesce((select jsonb_agg(to_jsonb(a) - 'creator_id' order by a.created_at) from public.creator_addresses a where a.creator_id = c.id), '[]') as addresses,
        (select to_jsonb(ap) - 'creator_id' - 'decided_by' from public.creator_approvals ap where ap.creator_id = c.id order by ap.submitted_at desc limit 1) as application
      from public.creators c where c.id = (select auth.uid())
    `)).rows;
    return row;
  }
}
