import { Injectable } from "@nestjs/common";
import { Caller, Db } from "../common/db/db";
import { CreateAccountDto } from "./dto/create-account.dto";
import { Account } from "./entities/account.entity";
import { Me } from "./entities/me.entity";

@Injectable()
export class MeService {
  constructor(private readonly db: Db) {}

  /** Account, creator profile and brands in one query, or undefined before the account exists. */
  async get(caller: Caller): Promise<Me | undefined> {
    const [row] = await this.db.run(caller, async (q) => (await q.query<Me>(`
      select to_jsonb(a) as account,
        (select to_jsonb(c) from public.creators c where c.id = a.id) as creator,
        coalesce((select jsonb_agg(to_jsonb(b) order by b.created_at) from public.brands b where b.account_id = a.id), '[]') as brands
      from public.accounts a where a.id = (select auth.uid())
    `)).rows);
    return row;
  }

  /** The database refuses a second account (409) and the admin role. */
  async createAccount(caller: Caller, dto: CreateAccountDto): Promise<Account> {
    const [account] = await this.db.run(caller, async (q) => (await q.query<Account>(
      `insert into public.accounts (id, role, name_ar, name_en, phone) values ((select auth.uid()), $1, $2, $3, $4) returning *`,
      [dto.role, dto.name_ar ?? null, dto.name_en ?? null, dto.phone ?? null],
    )).rows);
    return account;
  }
}
