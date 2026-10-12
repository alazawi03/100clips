import { ApiProperty } from "@nestjs/swagger";
import type { Enums } from "../../common/db/database.types";
import { ApiEnum, ENUMS, text, time, uuid } from "../../common/openapi/props";
import { PublicCreator } from "./creator.entity";

class FormatPrice {
  @ApiEnum(ENUMS.content_format, "ContentFormat") format: Enums<"content_format">;
  @ApiProperty({ description: "BHD, before the platform fee" }) price: number;
}

class Social {
  @ApiEnum(ENUMS.social_platform, "SocialPlatform") platform: Enums<"social_platform">;
  @ApiProperty() username: string;
}

class PortfolioVideo {
  @ApiProperty(uuid) id: string;
  @ApiProperty() video_path: string;
}

class Rating {
  @ApiProperty() rating: number;
  @ApiProperty({ type: "integer" }) review_count: number;
}

class Review {
  @ApiProperty(uuid) order_id: string;
  @ApiProperty(text) brand_name_ar: string | null;
  @ApiProperty(text) brand_name_en: string | null;
  @ApiProperty({ type: "integer", minimum: 1, maximum: 5 }) rating: number;
  @ApiProperty(text) review: string | null;
  @ApiProperty(time) rated_at: string;
}

class Clip {
  @ApiProperty(uuid) order_id: string;
  @ApiProperty(text) brand_name_ar: string | null;
  @ApiProperty(text) brand_name_en: string | null;
  @ApiProperty({ type: "integer", nullable: true }) views: number | null;
  @ApiProperty(time) approved_at: string;
  @ApiProperty() video_path: string;
  @ApiProperty({ type: "integer", nullable: true }) duration_sec: number | null;
}

/** Everything on a creator's profile page, built in one query. */
export class CreatorProfile {
  @ApiProperty({ type: () => PublicCreator }) creator: PublicCreator;
  @ApiProperty({ type: () => [FormatPrice] }) formats: FormatPrice[];
  @ApiProperty({ type: () => [Social] }) socials: Social[];
  @ApiProperty({ type: () => [PortfolioVideo] }) portfolio: PortfolioVideo[];
  @ApiProperty({ type: () => Rating, nullable: true, description: "Null before the first review" }) rating: Rating | null;
  @ApiProperty({ type: () => [Review] }) reviews: Review[];
  @ApiProperty({ type: () => [Clip], description: "Clips the brand agreed to show publicly" }) clips: Clip[];
}
