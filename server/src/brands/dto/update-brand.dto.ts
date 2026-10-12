import { PartialType } from "@nestjs/swagger";
import { CreateBrandDto } from "./create-brand.dto";

/** Brand settings: the same fields, all optional. Only the fields sent change. */
export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
