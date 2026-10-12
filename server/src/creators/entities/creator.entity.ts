import { ApiProperty, OmitType } from "@nestjs/swagger";
import type { Enums, Tables } from "../../common/db/database.types";
import { ApiEnum, ENUMS, text, time, uuid } from "../../common/openapi/props";

/** A creators row. `implements` makes the compiler check it against the database schema. */
export class Creator implements Tables<"creators"> {
  @ApiProperty(uuid) id: string;
  @ApiEnum(ENUMS.creator_status, "CreatorStatus") status: Enums<"creator_status">;
  @ApiProperty(text) name_ar: string | null;
  @ApiProperty(text) name_en: string | null;
  @ApiProperty() handle: string;
  @ApiProperty({ example: "BH" }) country: string;
  @ApiProperty(text) city: string | null;
  @ApiProperty(text) bio: string | null;
  @ApiEnum(ENUMS.gender, "Gender", { nullable: true }) gender: Enums<"gender"> | null;
  @ApiProperty({ type: Boolean, nullable: true }) shows_face: boolean | null;
  @ApiEnum(ENUMS.niche, "Niche", { isArray: true }) niches: Enums<"niche">[];
  @ApiProperty(text) photo_path: string | null;
  @ApiProperty({ ...time, nullable: true }) approved_at: string | null;
  @ApiProperty({ type: "integer" }) completed_orders: number;
  @ApiProperty(time) created_at: string;
  @ApiProperty(time) updated_at: string;
}

/** A creator as brands see them on a profile (no review status). */
export class PublicCreator extends OmitType(Creator, ["status"] as const) {}
