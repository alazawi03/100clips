import { ApiProperty } from "@nestjs/swagger";
import type { Enums, Tables } from "../../common/db/database.types";
import { ApiEnum, ENUMS, text, uuid } from "../../common/openapi/props";

type ExploreRow = Pick<
  Tables<"bookable_creators">,
  "id" | "name_ar" | "name_en" | "handle" | "city" | "bio" | "gender" | "niches" | "photo_path" | "completed_orders" | "rating" | "review_count" | "from_price"
>;

/** A card on Explore: a bookable_creators row (approved, complete, not suspended). */
export class ExploreCreator implements ExploreRow {
  @ApiProperty(uuid) id: string;
  @ApiProperty(text) name_ar: string | null;
  @ApiProperty(text) name_en: string | null;
  @ApiProperty() handle: string;
  @ApiProperty(text) city: string | null;
  @ApiProperty(text) bio: string | null;
  @ApiEnum(ENUMS.gender, "Gender", { nullable: true }) gender: Enums<"gender"> | null;
  @ApiEnum(ENUMS.niche, "Niche", { isArray: true }) niches: Enums<"niche">[];
  @ApiProperty(text) photo_path: string | null;
  @ApiProperty({ type: "integer" }) completed_orders: number;
  @ApiProperty({ type: Number, nullable: true, description: "Average stars, null before the first review" }) rating: number | null;
  @ApiProperty({ type: "integer" }) review_count: number;
  @ApiProperty({ type: Number, nullable: true, description: "Lowest format price in BHD, before the platform fee" }) from_price: number | null;
}
