import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

/**
 * What only creators who accepted may see. Replaces all three: a field left out is cleared.
 */
export class CampaignSecretsDto {
  @ApiPropertyOptional({ format: "uri", nullable: true, description: "App download link (a booking page later)" })
  @IsOptional() @IsUrl()
  access_link?: string | null;

  @ApiPropertyOptional({ maxLength: 500, nullable: true, description: "An app's test account" })
  @IsOptional() @IsString() @MaxLength(500)
  login_details?: string | null;

  @ApiPropertyOptional({ maxLength: 100, nullable: true, description: "Promo, voucher or booking code" })
  @IsOptional() @IsString() @MaxLength(100)
  code?: string | null;
}
