import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength, ValidateIf, IsNotEmpty } from "class-validator";

export const DECISIONS = ["approved", "changes_requested", "rejected"] as const;

export class DecideCreatorDto {
  @ApiProperty({ enum: DECISIONS })
  @IsIn(DECISIONS)
  decision: (typeof DECISIONS)[number];

  @ApiPropertyOptional({ maxLength: 1000, description: "Required unless approved: the creator sees it" })
  @ValidateIf((o: DecideCreatorDto) => o.decision !== "approved" || o.note != null)
  @IsString() @IsNotEmpty({ message: "Tell the creator why" }) @MaxLength(1000)
  note?: string;
}
