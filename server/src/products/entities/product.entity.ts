import { ApiProperty } from "@nestjs/swagger";
import type { Enums, Tables } from "../../common/db/database.types";
import { ApiEnum, ENUMS, text, time, uuid } from "../../common/openapi/props";
import { ConcernDto, DETAILS_DOC } from "../dto/create-product.dto";
import type { ProductDetails } from "../dto/product-details.dto";

/** A products row. concerns and details are JSON columns, so they're typed here rather than checked against the schema. */
export class Product implements Omit<Tables<"products">, "concerns" | "details"> {
  @ApiProperty(uuid) id: string;
  @ApiProperty(uuid) brand_id: string;
  @ApiEnum(ENUMS.product_type, "ProductType") type: Enums<"product_type">;
  @ApiProperty() name: string;
  @ApiProperty({ type: [String], description: "Paths in the public storage bucket, first is the cover" }) photos: string[];
  @ApiProperty(text) description: string | null;
  @ApiProperty({ type: Number, nullable: true, description: "BHD" }) price: number | null;
  @ApiProperty({ type: [String] }) benefits: string[];
  @ApiProperty({ type: [ConcernDto] }) concerns: ConcernDto[];
  @ApiProperty(DETAILS_DOC) details: ProductDetails;
  @ApiProperty(time) created_at: string;
  @ApiProperty(time) updated_at: string;
}
