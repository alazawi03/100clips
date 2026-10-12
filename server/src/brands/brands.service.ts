import { Injectable } from "@nestjs/common";
import type { Tables } from "../common/db/database.types";
import { Caller, Db } from "../common/db/db";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

type BrandRow = Tables<"brands">;

/** Columns a brand owner may set, in a fixed order (never taken from the request). */
const COLUMNS = ["name_ar", "name_en", "logo_path", "industry", "about", "website", "instagram", "tiktok"] as const;

/** Row-level security limits writes to the owner's own brands, and adding to brand accounts. */
@Injectable()
export class BrandsService {
  constructor(private readonly db: Db) {}

  async mine(caller: Caller): Promise<BrandRow[]> {
    return this.db.run(caller, async (q) => (await q.query<BrandRow>(
      `select * from public.brands where account_id = (select auth.uid()) order by created_at`,
    )).rows);
  }

  async create(caller: Caller, dto: CreateBrandDto): Promise<BrandRow> {
    const [brand] = await this.db.run(caller, async (q) => (await q.query<BrandRow>(
      `insert into public.brands (account_id, ${COLUMNS.join(", ")})
       values ((select auth.uid()), ${COLUMNS.map((_, i) => `$${i + 1}`).join(", ")}) returning *`,
      COLUMNS.map((c) => dto[c] ?? null),
    )).rows);
    return brand;
  }

  /** The updated brand, or undefined if it doesn't exist or isn't the caller's. */
  async update(caller: Caller, id: string, dto: UpdateBrandDto): Promise<BrandRow | undefined> {
    const sent = COLUMNS.filter((c) => dto[c] !== undefined);
    const [brand] = await this.db.run(caller, async (q) => (await q.query<BrandRow>(
      sent.length
        ? `update public.brands set ${sent.map((c, i) => `${c} = $${i + 2}`).join(", ")} where id = $1 returning *`
        : `select * from public.brands where id = $1 and account_id = (select auth.uid())`,
      [id, ...sent.map((c) => dto[c])],
    )).rows);
    return brand;
  }
}
