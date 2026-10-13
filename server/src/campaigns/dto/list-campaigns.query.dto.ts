import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import type { Enums } from "../../common/db/database.types";
import { ENUMS } from "../../common/openapi/props";

export class ListCampaignsQueryDto {
  @ApiPropertyOptional({ format: "uuid", description: "Only this brand's campaigns" })
  @IsOptional() @IsUUID()
  brand_id?: string;

  @ApiPropertyOptional({ enum: [...ENUMS.campaign_status], enumName: "CampaignStatus" })
  @IsOptional() @IsIn([...ENUMS.campaign_status])
  status?: Enums<"campaign_status">;

  @ApiPropertyOptional({ type: "integer", minimum: 1, maximum: 100, default: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit = 50;

  @ApiPropertyOptional({ type: "integer", minimum: 0, default: 0 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  offset = 0;
}
