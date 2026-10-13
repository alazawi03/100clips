import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, Length } from "class-validator";

export class CreateAccountDto {
  /** Admins are made by hand, never through the API. */
  @ApiProperty({ enum: ["creator", "brand"], description: "Admins are made by hand, never through the API" })
  @IsIn(["creator", "brand"])
  role: "creator" | "brand";

  @ApiPropertyOptional({ minLength: 1, maxLength: 80, example: "ريم", description: "The person's name, not a brand's (brands are added with POST /brands)" })
  @IsOptional() @IsString() @Length(1, 80)
  name_ar?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 80, example: "Reem", description: "The person's name, not a brand's" })
  @IsOptional() @IsString() @Length(1, 80)
  name_en?: string;

  @ApiPropertyOptional({ minLength: 6, maxLength: 20, example: "+97333123456" })
  @IsOptional() @IsString() @Length(6, 20)
  phone?: string;
}
