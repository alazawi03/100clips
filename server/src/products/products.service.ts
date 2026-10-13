import { Injectable } from "@nestjs/common";
import { Caller, Db } from "../common/db/db";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Product } from "./entities/product.entity";

/** Columns a brand owner may set, in a fixed order (never taken from the request). */
const COLUMNS = ["type", "name", "photos", "description", "price", "benefits", "concerns", "details"] as const;
type Column = (typeof COLUMNS)[number];
const JSON_COLUMNS = new Set<Column>(["concerns", "details"]);

const placeholder = (c: Column, n: number) => (JSON_COLUMNS.has(c) ? `$${n}::jsonb` : `$${n}`);
const param = (c: Column, value: unknown) => (JSON_COLUMNS.has(c) && value != null ? JSON.stringify(value) : value);

/** Anyone signed in can read products; row-level security limits writes to the brand's owner. */
@Injectable()
export class ProductsService {
  constructor(private readonly db: Db) {}

  async listForBrand(caller: Caller, brandId: string): Promise<Product[]> {
    return this.db.run(caller, async (q) => (await q.query<Product>(
      `select * from public.products where brand_id = $1 order by created_at`, [brandId],
    )).rows);
  }

  async get(caller: Caller, id: string): Promise<Product | undefined> {
    const [product] = await this.db.run(caller, async (q) => (await q.query<Product>(
      `select * from public.products where id = $1`, [id],
    )).rows);
    return product;
  }

  /** Refused by the database (403) unless the caller owns the brand. */
  async create(caller: Caller, brandId: string, dto: CreateProductDto): Promise<Product> {
    const values: Record<Column, unknown> = {
      ...dto,
      photos: dto.photos ?? [],
      benefits: dto.benefits ?? [],
      concerns: dto.concerns ?? [],
      description: dto.description ?? null,
      price: dto.price ?? null,
    };
    const [product] = await this.db.run(caller, async (q) => (await q.query<Product>(
      `insert into public.products (brand_id, ${COLUMNS.join(", ")})
       values ($1, ${COLUMNS.map((c, i) => placeholder(c, i + 2)).join(", ")}) returning *`,
      [brandId, ...COLUMNS.map((c) => param(c, values[c]))],
    )).rows);
    return product;
  }

  /** The updated product, or undefined if it doesn't exist or isn't the caller's. */
  async update(caller: Caller, id: string, dto: UpdateProductDto): Promise<Product | undefined> {
    const sent = COLUMNS.filter((c) => dto[c] !== undefined);
    const [product] = await this.db.run(caller, async (q) => (await q.query<Product>(
      sent.length
        ? `update public.products set ${sent.map((c, i) => `${c} = ${placeholder(c, i + 2)}`).join(", ")} where id = $1 returning *`
        : `select p.* from public.products p join public.brands b on b.id = p.brand_id where p.id = $1 and b.account_id = (select auth.uid())`,
      [id, ...sent.map((c) => param(c, dto[c]))],
    )).rows);
    return product;
  }

  /** "in_use" when a campaign features the product: campaigns keep their product. */
  async remove(caller: Caller, id: string): Promise<"deleted" | "not_found" | "in_use"> {
    try {
      const { rows } = await this.db.run(caller, (q) => q.query(`delete from public.products where id = $1 returning id`, [id]));
      return rows.length ? "deleted" : "not_found";
    } catch (e) {
      if ((e as { code?: string }).code === "23503") return "in_use";
      throw e;
    }
  }
}
