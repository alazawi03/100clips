import { Injectable } from "@nestjs/common";
import { Db } from "../common/db/db";
import { JoinWaitlistDto } from "./dto/join-waitlist.dto";

@Injectable()
export class WaitlistService {
  constructor(private readonly db: Db) {}

  /**
   * The sheet's one box holds an email or a phone: an @ means email (stored lowercase), anything
   * else is a phone (spaces, dashes and brackets removed). The table's checks refuse junk (400).
   * Visitors can't write the table, so this runs as the service role.
   */
  async join({ country, contact }: JoinWaitlistDto) {
    const value = contact.trim();
    const [email, phone] = value.includes("@") ? [value.toLowerCase(), null] : [null, value.replace(/[\s()-]/g, "")];
    await this.db.run({ role: "service_role" }, (q) =>
      q.query(`insert into public.waitlist_requests (country, email, phone) values ($1, $2, $3)`, [country.toUpperCase(), email, phone]));
  }
}
