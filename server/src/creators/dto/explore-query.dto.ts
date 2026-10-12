import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import type { Enums } from "../../common/db/database.types";
import { ENUMS } from "../../common/openapi/props";

export class ExploreQueryDto {
  @ApiPropertyOptional({ enum: [...ENUMS.niche], enumName: "Niche" })
  @IsOptional() @IsIn([...ENUMS.niche])
  niche?: Enums<"niche">;

  @ApiPropertyOptional({ type: "integer", minimum: 1, maximum: 100, default: 24 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit = 24;

  @ApiPropertyOptional({ type: "integer", minimum: 0, default: 0 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  offset = 0;
}
