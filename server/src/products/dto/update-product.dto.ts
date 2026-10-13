import { ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { IsDefined, IsIn, IsObject, ValidateIf, ValidateNested } from "class-validator";
import type { Enums } from "../../common/db/database.types";
import { ENUMS } from "../../common/openapi/props";
import { CreateProductDto, DETAILS_DOC, DetailsForType } from "./create-product.dto";
import type { ProductDetails } from "./product-details.dto";

/** Only the fields sent change. `type` and `details` go together, since the details depend on the type. */
export class UpdateProductDto extends PartialType(OmitType(CreateProductDto, ["type", "details"] as const)) {
  @ApiPropertyOptional({ enum: [...ENUMS.product_type], enumName: "ProductType", description: "Send with details" })
  @ValidateIf((o: UpdateProductDto) => o.type !== undefined || o.details !== undefined)
  @IsDefined({ message: "type must be sent with details" }) @IsIn([...ENUMS.product_type])
  type?: Enums<"product_type">;

  @ApiPropertyOptional({ ...DETAILS_DOC, description: `${DETAILS_DOC.description}. Send with type.` })
  @ValidateIf((o: UpdateProductDto) => o.type !== undefined || o.details !== undefined)
  @DetailsForType(false) @IsDefined({ message: "details must be sent with type" }) @IsObject() @ValidateNested()
  details?: ProductDetails;
}
