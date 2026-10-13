import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize, IsArray, IsDateString, IsIn, IsObject, IsOptional, IsString, IsUrl, IsUUID, MaxLength, ValidateNested,
} from "class-validator";
import type { Enums } from "../../common/db/database.types";
import { ENUMS } from "../../common/openapi/props";
import { MaxJsonSize } from "../../common/validation/max-json-size";

/**
 * How the product reaches creators: physical {after}, venue {visitFrom, visitTo, included}. The
 * app link, test account and promo code are secrets, set with PUT /campaigns/:id/secrets.
 */
export class LogisticsDto {
  @ApiPropertyOptional({ enum: ["keep", "return"], description: "Physical products: does the creator keep it?" })
  @IsOptional() @IsIn(["keep", "return"])
  after?: "keep" | "return";

  @ApiPropertyOptional({ format: "date", description: "Venues: first day to visit" })
  @IsOptional() @IsDateString({ strict: true })
  visitFrom?: string;

  @ApiPropertyOptional({ format: "date", description: "Venues: last day to visit" })
  @IsOptional() @IsDateString({ strict: true })
  visitTo?: string;

  @ApiPropertyOptional({ maxLength: 300, description: "Venues: what the visit includes" })
  @IsOptional() @IsString() @MaxLength(300)
  included?: string;
}

/**
 * A draft: every field optional, saved as the brand fills the form. Checkout checks the brief is
 * complete (product, title, brief of 20+ characters, video style).
 */
export class CreateCampaignDto {
  @ApiPropertyOptional({ format: "uuid", description: "One of this brand's products" })
  @IsOptional() @IsUUID()
  product_id?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional() @IsString() @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ maxLength: 2000, description: "20 characters or more by checkout" })
  @IsOptional() @IsString() @MaxLength(2000)
  brief?: string;

  @ApiPropertyOptional({ enum: [...ENUMS.video_style], enumName: "VideoStyle" })
  @IsOptional() @IsIn([...ENUMS.video_style])
  video_style?: Enums<"video_style">;

  @ApiPropertyOptional({ format: "date", description: "When clips are due (after today by checkout)" })
  @IsOptional() @IsDateString({ strict: true })
  deadline?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional() @IsString() @MaxLength(200)
  key_message?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 3, description: "Links to videos like the one wanted" })
  @IsOptional() @IsArray() @ArrayMaxSize(3) @IsUrl({}, { each: true })
  reference_links?: string[];

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional() @IsString() @MaxLength(500)
  must_include?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional() @IsString() @MaxLength(500)
  avoid?: string;

  @ApiPropertyOptional({ type: LogisticsDto })
  @IsOptional() @IsObject() @ValidateNested() @Type(() => LogisticsDto)
  logistics?: LogisticsDto;

  @ApiPropertyOptional({ type: "object", additionalProperties: true, description: "The form as the dashboard saved it (fields and picked creators), up to 20 KB" })
  @IsOptional() @IsObject() @MaxJsonSize(20_000)
  draft?: Record<string, unknown>;
}
