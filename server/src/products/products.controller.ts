import { Body, ConflictException, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiExtraModels, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentCaller } from "../common/auth/decorators";
import { Caller } from "../common/db/db";
import { ApiBodyExamples, ApiErrors } from "../common/openapi/docs";
import { CreateProductDto } from "./dto/create-product.dto";
import { AppDetails, PhysicalDetails, ServiceDetails, VenueDetails } from "./dto/product-details.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Product } from "./entities/product.entity";
import { ProductsService } from "./products.service";

@ApiTags("Products")
@ApiBearerAuth()
@ApiExtraModels(PhysicalDetails, AppDetails, ServiceDetails, VenueDetails)
@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get("brands/:brandId/products")
  @ApiOperation({ summary: "A brand's products", description: "Oldest first." })
  @ApiOkResponse({ type: [Product] })
  @ApiErrors(400, 401)
  list(@CurrentCaller() caller: Caller, @Param("brandId", ParseUUIDPipe) brandId: string): Promise<Product[]> {
    return this.products.listForBrand(caller, brandId);
  }

  @Post("brands/:brandId/products")
  @ApiOperation({ summary: "Add a product", description: "The brand's owner only. `details` must match `type`." })
  @ApiBodyExamples(CreateProductDto, {
    "Physical product": {
      type: "physical",
      name: "Ethiopian single origin",
      description: "Fruity, medium roast. 250 g bag.",
      price: 4.5,
      benefits: ["Roasted weekly", "Fruity notes"],
      concerns: [{ question: "Is it too strong?", answer: "No, it's a medium roast" }],
      details: { value: 4.5, size: "250 g" },
    },
    App: { type: "app", name: "Muharraq Rewards", details: { downloadLink: "https://example.com/app", platforms: ["ios", "android"] } },
    Service: { type: "service", name: "Home barista class", price: 25, details: { delivery: ["at_home", "online"] } },
    Venue: { type: "venue", name: "Muharraq branch", details: { kind: "cafe", location: "Muharraq, Block 208", hours: "Daily 7am–11pm" } },
  })
  @ApiCreatedResponse({ type: Product })
  @ApiErrors(400, 401, 403)
  create(@CurrentCaller() caller: Caller, @Param("brandId", ParseUUIDPipe) brandId: string, @Body() body: CreateProductDto): Promise<Product> {
    return this.products.create(caller, brandId, body);
  }

  @Get("products/:id")
  @ApiOperation({ summary: "A product" })
  @ApiOkResponse({ type: Product })
  @ApiErrors(400, 401, 404)
  async get(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string): Promise<Product> {
    const product = await this.products.get(caller, id);
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  @Patch("products/:id")
  @ApiOperation({ summary: "Edit a product", description: "Only the fields sent change. Send type and details together." })
  @ApiBodyExamples(UpdateProductDto, {
    "Change the price": { price: 5 },
    "Change the type": { type: "venue", details: { kind: "cafe", hours: "Daily 7am–11pm" } },
  })
  @ApiOkResponse({ type: Product })
  @ApiErrors(400, 401, 404)
  async update(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateProductDto): Promise<Product> {
    const product = await this.products.update(caller, id, body);
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  @Delete("products/:id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a product", description: "Not possible once a campaign features it (409)." })
  @ApiNoContentResponse({ description: "Deleted" })
  @ApiErrors(400, 401, 404, 409)
  async remove(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string): Promise<void> {
    const result = await this.products.remove(caller, id);
    if (result === "not_found") throw new NotFoundException("Product not found");
    if (result === "in_use") throw new ConflictException("A campaign features this product, so it can't be deleted");
  }
}
