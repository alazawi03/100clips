import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayUnique, IsIn, IsNumber, IsOptional, IsString, IsUrl, Length, Max, Min } from "class-validator";
import type { Enums } from "../../common/db/database.types";

/**
 * The fields that only apply to one product type, stored in products.details. The dashboard's
 * product form (lib/data/types.ts ProductDetails) uses the same names and values.
 */

export const APP_PLATFORMS = ["ios", "android", "web"] as const;
export const SERVICE_DELIVERIES = ["online", "at_home", "at_location"] as const;
export const VENUE_KINDS = ["cafe", "restaurant", "salon", "gym", "clinic", "other"] as const;

export class PhysicalDetails {
  @ApiPropertyOptional({ description: "Retail value of one unit, in BHD", minimum: 0 })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(9_999_999)
  value?: number;

  @ApiPropertyOptional({ maxLength: 60, example: "250 g" })
  @IsOptional() @IsString() @Length(1, 60)
  size?: string;
}

export class AppDetails {
  @ApiPropertyOptional({ format: "uri" })
  @IsOptional() @IsUrl()
  downloadLink?: string;

  @ApiPropertyOptional({ enum: APP_PLATFORMS, isArray: true })
  @IsOptional() @IsIn(APP_PLATFORMS, { each: true }) @ArrayUnique()
  platforms?: (typeof APP_PLATFORMS)[number][];
}

export class ServiceDetails {
  @ApiPropertyOptional({ enum: SERVICE_DELIVERIES, isArray: true })
  @IsOptional() @IsIn(SERVICE_DELIVERIES, { each: true }) @ArrayUnique()
  delivery?: (typeof SERVICE_DELIVERIES)[number][];
}

export class VenueDetails {
  @ApiProperty({ enum: VENUE_KINDS })
  @IsIn(VENUE_KINDS)
  kind: (typeof VENUE_KINDS)[number];

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional() @IsString() @Length(1, 200)
  location?: string;

  @ApiPropertyOptional({ maxLength: 200, example: "Daily 7am–11pm" })
  @IsOptional() @IsString() @Length(1, 200)
  hours?: string;

  @ApiPropertyOptional({ format: "uri", description: "Google Maps link" })
  @IsOptional() @IsUrl()
  mapUrl?: string;
}

export const DETAILS_BY_TYPE: Record<Enums<"product_type">, new () => object> = {
  physical: PhysicalDetails,
  app: AppDetails,
  service: ServiceDetails,
  venue: VenueDetails,
};

export type ProductDetails = PhysicalDetails | AppDetails | ServiceDetails | VenueDetails;
