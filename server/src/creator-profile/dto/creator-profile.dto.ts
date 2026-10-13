import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsOptional, IsString, Length, Matches, MaxLength } from "class-validator";
import type { Enums } from "../../common/db/database.types";
import { ENUMS } from "../../common/openapi/props";

/** The profile at sign-up. The database also requires a name in Arabic or English. */
export class CreateCreatorProfileDto {
  @ApiProperty({ pattern: "^[a-z0-9._]{2,30}$", example: "dana.glow", description: "Unique; lowercase letters, digits, . and _" })
  @Matches(/^[a-z0-9._]{2,30}$/, { message: "handle: 2-30 lowercase letters, digits, . or _" })
  handle: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 80, example: "دانة" })
  @IsOptional() @IsString() @Length(1, 80)
  name_ar?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 80, example: "Dana" })
  @IsOptional() @IsString() @Length(1, 80)
  name_en?: string;

  @ApiPropertyOptional({ pattern: "^[A-Z]{2}$", default: "BH", description: "ISO country code" })
  @IsOptional() @Matches(/^[A-Z]{2}$/)
  country?: string;

  @ApiPropertyOptional({ maxLength: 60, example: "Manama" })
  @IsOptional() @IsString() @Length(1, 60)
  city?: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional() @IsString() @MaxLength(160)
  bio?: string;

  @ApiPropertyOptional({ enum: [...ENUMS.gender], enumName: "Gender" })
  @IsOptional() @IsIn([...ENUMS.gender])
  gender?: Enums<"gender">;

  @ApiPropertyOptional({ description: "Does the creator show their face in videos?" })
  @IsOptional() @IsBoolean()
  shows_face?: boolean;

  @ApiPropertyOptional({ enum: [...ENUMS.niche], enumName: "Niche", isArray: true, maxItems: 3 })
  @IsOptional() @IsArray() @ArrayMaxSize(3) @ArrayUnique() @IsIn([...ENUMS.niche], { each: true })
  niches?: Enums<"niche">[];

  @ApiPropertyOptional({ maxLength: 300, description: "Profile photo in public-media: {your user id}/..." })
  @IsOptional() @IsString() @MaxLength(300)
  photo_path?: string;
}

/** Profile edits: only the fields sent change; null clears an optional one. */
export class UpdateCreatorProfileDto extends PartialType(CreateCreatorProfileDto) {}
