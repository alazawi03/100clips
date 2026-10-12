import { ApiProperty } from "@nestjs/swagger";
import type { Enums, Tables } from "../../common/db/database.types";
import { ApiEnum, ENUMS, text, time, uuid } from "../../common/openapi/props";

/** An accounts row. `implements` makes the compiler check it against the database schema. */
export class Account implements Tables<"accounts"> {
  @ApiProperty(uuid) id: string;
  @ApiEnum(ENUMS.user_role, "Role") role: Enums<"user_role">;
  @ApiProperty(text) name_ar: string | null;
  @ApiProperty(text) name_en: string | null;
  @ApiProperty(text) phone: string | null;
  @ApiProperty(time) notifications_seen_at: string;
  @ApiProperty(time) created_at: string;
}
