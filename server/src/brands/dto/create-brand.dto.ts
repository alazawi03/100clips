import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, IsUrl, Length } from "class-validator";
import type { Enums } from "../../common/db/database.types";
import { ENUMS } from "../../common/openapi/props";

/** The brand wizard. The database also requires a name in Arabic or English. */
export class CreateBrandDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 80, example: "محمصة المحرق" })
  @IsOptional() @IsString() @Length(1, 80)
  name_ar?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 80, example: "Muharraq Roastery" })
  @IsOptional() @IsString() @Length(1, 80)
  name_en?: string;

  @ApiPropertyOptional({ description: "Path in the public storage bucket" })
  @IsOptional() @IsString()
  logo_path?: string;

  @ApiProperty({ enum: [...ENUMS.industry], enumName: "Industry" })
  @IsIn([...ENUMS.industry])
  industry: Enums<"industry">;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional() @IsString() @Length(0, 300)
  about?: string;

  @ApiPropertyOptional({ format: "uri", example: "https://example.com" })
  @IsOptional() @IsUrl()
  website?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 30, description: "Username, without @" })
  @IsOptional() @IsString() @Length(1, 30)
  instagram?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 30, description: "Username, without @" })
  @IsOptional() @IsString() @Length(1, 30)
  tiktok?: string;
}
