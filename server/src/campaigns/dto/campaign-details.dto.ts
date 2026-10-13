import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsDateString, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

/**
 * "Edit details" on a live campaign, before any creator accepts. Replaces all four: a field left
 * out is cleared. Each change is recorded in the campaign's events.
 */
export class CampaignDetailsDto {
  @ApiPropertyOptional({ maxLength: 200, nullable: true })
  @IsOptional() @IsString() @MaxLength(200)
  key_message?: string | null;

  @ApiPropertyOptional({ type: [String], maxItems: 3 })
  @IsOptional() @IsArray() @ArrayMaxSize(3) @IsUrl({}, { each: true })
  reference_links?: string[] | null;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional() @IsString() @MaxLength(500)
  must_include?: string | null;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional() @IsString() @MaxLength(500)
  avoid?: string | null;
}

/** "Extend deadline" on a live campaign: a date later than the current one and after today. */
export class ExtendDeadlineDto {
  @ApiProperty({ format: "date", example: "2026-12-01" })
  @IsDateString({ strict: true })
  deadline: string;
}
