import { Injectable } from "@nestjs/common";
import { Db } from "../common/db/db";
import { JoinWaitlistDto } from "./dto/join-waitlist.dto";

@Injectable()
export class WaitlistService {
  constructor(private readonly db: Db) {}

  /** join_waitlist checks the contact and stores it as an email or a phone. Runs as a visitor. */
  async join({ country, contact }: JoinWaitlistDto) {
    await this.db.run({ role: "anon" }, (q) => q.query("select public.join_waitlist($1, $2)", [country, contact]));
  }
}
