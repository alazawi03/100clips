import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsDefined, IsIn, IsNumber, IsOptional, IsString, Length, Max, Min, ValidateIf } from "class-validator";
import type { Enums } from "../../common/db/database.types";
import { ENUMS } from "../../common/openapi/props";

/** A delivery address (up to 5). The pin is optional, but latitude and longitude go together. */
export class CreateAddressDto {
  @ApiProperty({ enum: [...ENUMS.address_type], enumName: "AddressType" })
  @IsIn([...ENUMS.address_type])
  type: Enums<"address_type">;

  @ApiPropertyOptional({ minLength: 1, maxLength: 40, example: "Parents' house" })
  @IsOptional() @IsString() @Length(1, 40)
  label?: string;

  @ApiProperty({ minLength: 5, maxLength: 300, example: "Building 1234, Road 4567, Block 345, Manama" })
  @IsString() @Length(5, 300)
  address_text: string;

  @ApiPropertyOptional({ minimum: -90, maximum: 90, example: 26.2235 })
  @ValidateIf((o: CreateAddressDto) => o.latitude != null || o.longitude != null)
  @IsDefined({ message: "latitude goes with longitude" }) @IsNumber() @Min(-90) @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ minimum: -180, maximum: 180, example: 50.5876 })
  @ValidateIf((o: CreateAddressDto) => o.latitude != null || o.longitude != null)
  @IsDefined({ message: "longitude goes with latitude" }) @IsNumber() @Min(-180) @Max(180)
  longitude?: number;
}

/** Only the fields sent change; null clears the label or the pin (send both). */
export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
