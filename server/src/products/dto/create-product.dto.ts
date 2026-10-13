import { ApiProperty, ApiPropertyOptional, getSchemaPath } from "@nestjs/swagger";
import { Expose, plainToInstance, Transform, Type } from "class-transformer";
import {
  ArrayMaxSize, IsArray, IsIn, IsNumber, IsObject, IsOptional, IsString, Length, Max, MaxLength, Min, ValidateNested,
} from "class-validator";
import type { Enums } from "../../common/db/database.types";
import { ENUMS } from "../../common/openapi/props";
import { AppDetails, DETAILS_BY_TYPE, PhysicalDetails, ProductDetails, ServiceDetails, VenueDetails } from "./product-details.dto";

export class ConcernDto {
  @ApiProperty({ maxLength: 200, example: "Is it too strong?" })
  @IsString() @Length(1, 200)
  question: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional() @IsString() @MaxLength(500)
  answer?: string;
}

/** Turns `details` into the class for the product's `type`, so its fields are checked (and unknown ones refused). */
export const DetailsForType = (defaultWhenMissing: boolean) =>
  Transform(({ value, obj }) => {
    const details = value === undefined && defaultWhenMissing ? {} : value;
    const cls = DETAILS_BY_TYPE[obj.type as Enums<"product_type">];
    return cls && details !== null && typeof details === "object" && !Array.isArray(details) ? plainToInstance(cls, details) : details;
  });

export const DETAILS_DOC = {
  description: "Fields for the product type: physical {value, size}, app {downloadLink, platforms}, service {delivery}, venue {kind, location, hours, mapUrl}",
  oneOf: [PhysicalDetails, AppDetails, ServiceDetails, VenueDetails].map((m) => ({ $ref: getSchemaPath(m) })),
};

export class CreateProductDto {
  @ApiProperty({ enum: [...ENUMS.product_type], enumName: "ProductType" })
  @IsIn([...ENUMS.product_type])
  type: Enums<"product_type">;

  @ApiProperty({ maxLength: 120, example: "Ethiopian single origin" })
  @IsString() @Length(1, 120)
  name: string;

  @ApiPropertyOptional({ type: [String], maxItems: 6, description: "Paths in the public storage bucket, first is the cover" })
  @IsOptional() @IsArray() @ArrayMaxSize(6) @IsString({ each: true }) @MaxLength(300, { each: true })
  photos?: string[];

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ minimum: 0, description: "What customers pay, in BHD. Venues have none." })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(9_999_999)
  price?: number;

  @ApiPropertyOptional({ type: [String], maxItems: 5, description: "Short selling points" })
  @IsOptional() @IsArray() @ArrayMaxSize(5) @IsString({ each: true }) @Length(1, 120, { each: true })
  benefits?: string[];

  @ApiPropertyOptional({ type: [ConcernDto], maxItems: 10, description: "What customers ask before buying" })
  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => ConcernDto)
  concerns?: ConcernDto[];

  @ApiPropertyOptional(DETAILS_DOC)
  @Expose() // so the transform also runs when details is left out
  @DetailsForType(true) @IsObject() @ValidateNested()
  details: ProductDetails;
}
