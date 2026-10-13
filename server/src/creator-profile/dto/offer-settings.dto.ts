import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsIn, IsNumber, Matches, Max, Min, ValidateNested } from "class-validator";
import type { Enums } from "../../common/db/database.types";
import { ENUMS } from "../../common/openapi/props";
import { UniqueBy } from "../../common/validation/unique-by";

export class FormatPriceDto {
  @ApiProperty({ enum: [...ENUMS.content_format], enumName: "ContentFormat" })
  @IsIn([...ENUMS.content_format])
  format: Enums<"content_format">;

  @ApiProperty({ minimum: 0.001, example: 35, description: "What the creator gets per clip, in BHD (brands see it plus the fee)" })
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(9_999)
  price: number;
}

/** The formats the creator offers. Replaces the whole list; an empty list offers nothing. */
export class SetFormatsDto {
  @ApiProperty({ type: [FormatPriceDto], maxItems: 3 })
  @IsArray() @ArrayMaxSize(3) @ValidateNested({ each: true }) @Type(() => FormatPriceDto) @UniqueBy("format")
  formats: FormatPriceDto[];
}

export class SocialDto {
  @ApiProperty({ enum: [...ENUMS.social_platform], enumName: "SocialPlatform" })
  @IsIn([...ENUMS.social_platform])
  platform: Enums<"social_platform">;

  @ApiProperty({ pattern: "^[A-Za-z0-9._]{1,30}$", example: "dana.glow", description: "Without @" })
  @Matches(/^[A-Za-z0-9._]{1,30}$/, { message: "username: up to 30 letters, digits, . or _ (without @)" })
  username: string;
}

/** The creator's accounts, one per platform. Replaces the whole list. */
export class SetSocialsDto {
  @ApiProperty({ type: [SocialDto], maxItems: 2 })
  @IsArray() @ArrayMaxSize(2) @ValidateNested({ each: true }) @Type(() => SocialDto) @UniqueBy("platform")
  socials: SocialDto[];
}
