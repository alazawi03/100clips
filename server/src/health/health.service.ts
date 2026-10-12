import { Injectable } from "@nestjs/common";
import { Db } from "../common/db/db";

@Injectable()
export class HealthService {
  constructor(private readonly db: Db) {}

  /** Throws if the database can't be reached. */
  async pingDatabase() {
    await this.db.run({ role: "anon" }, (q) => q.query("select 1"));
  }
}
