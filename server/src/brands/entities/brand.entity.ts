import { ApiProperty } from "@nestjs/swagger";
import type { Enums, Tables } from "../../common/db/database.types";
import { ApiEnum, ENUMS, text, time, uuid } from "../../common/openapi/props";

/** A brands row. `implements` makes the compiler check it against the database schema. */
export class Brand implements Tables<"brands"> {
  @ApiProperty(uuid) id: string;
  @ApiProperty(uuid) account_id: string;
  @ApiProperty(text) name_ar: string | null;
  @ApiProperty(text) name_en: string | null;
  @ApiProperty({ ...text, description: "Path in the public storage bucket" }) logo_path: string | null;
  @ApiEnum(ENUMS.industry, "Industry") industry: Enums<"industry">;
  @ApiProperty(text) about: string | null;
  @ApiProperty(text) website: string | null;
  @ApiProperty(text) instagram: string | null;
  @ApiProperty(text) tiktok: string | null;
  @ApiProperty(time) created_at: string;
  @ApiProperty(time) updated_at: string;
}
