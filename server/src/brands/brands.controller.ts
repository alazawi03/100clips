import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentCaller } from "../common/auth/decorators";
import { Caller } from "../common/db/db";
import { ApiBodyExamples, ApiErrors } from "../common/openapi/docs";
import { BrandsService } from "./brands.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";
import { Brand } from "./entities/brand.entity";

@ApiTags("Brands")
@ApiBearerAuth()
@Controller("brands")
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  @ApiOperation({ summary: "My brands" })
  @ApiOkResponse({ type: [Brand] })
  @ApiErrors(401)
  mine(@CurrentCaller() caller: Caller): Promise<Brand[]> {
    return this.brands.mine(caller);
  }

  @Post()
  @ApiOperation({ summary: "Add a brand", description: "Brand accounts only. Needs a name in Arabic or English." })
  @ApiBodyExamples(CreateBrandDto, {
    "A roastery": {
      name_ar: "محمصة المحرق",
      name_en: "Muharraq Roastery",
      industry: "food_beverage",
      about: "Specialty coffee roasted in Muharraq.",
      website: "https://example.com",
      instagram: "muharraq.roastery",
    },
    "Name only": { name_en: "Glow Studio", industry: "health" },
  })
  @ApiCreatedResponse({ type: Brand })
  @ApiErrors(400, 401, 403)
  create(@CurrentCaller() caller: Caller, @Body() body: CreateBrandDto): Promise<Brand> {
    return this.brands.create(caller, body);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edit a brand", description: "Only the fields sent change." })
  @ApiBodyExamples(UpdateBrandDto, {
    "Change the about": { about: "Single-origin coffee, roasted weekly." },
    "Add TikTok": { tiktok: "muharraq.roastery" },
  })
  @ApiOkResponse({ type: Brand })
  @ApiErrors(400, 401, 404)
  async update(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateBrandDto): Promise<Brand> {
    const brand = await this.brands.update(caller, id, body);
    if (!brand) throw new NotFoundException("Brand not found");
    return brand;
  }
}
