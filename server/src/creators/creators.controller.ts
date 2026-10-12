import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentCaller } from "../common/auth/decorators";
import { Caller } from "../common/db/db";
import { ApiErrors } from "../common/openapi/docs";
import { CreatorsService } from "./creators.service";
import { ExploreQueryDto } from "./dto/explore-query.dto";
import { CreatorProfile } from "./entities/creator-profile.entity";
import { ExploreCreator } from "./entities/explore-creator.entity";

@ApiTags("Creators")
@ApiBearerAuth()
@Controller("creators")
export class CreatorsController {
  constructor(private readonly creators: CreatorsService) {}

  @Get()
  @ApiOperation({ summary: "Explore creators", description: "Approved creators brands can book, with rating and lowest price (before the fee)." })
  @ApiOkResponse({ type: [ExploreCreator] })
  @ApiErrors(400, 401)
  explore(@CurrentCaller() caller: Caller, @Query() query: ExploreQueryDto): Promise<ExploreCreator[]> {
    return this.creators.explore(caller, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Creator profile", description: "Prices, socials, portfolio, reviews and public clips. 404 if you can't see them." })
  @ApiOkResponse({ type: CreatorProfile })
  @ApiErrors(400, 401, 404)
  async profile(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string): Promise<CreatorProfile> {
    const profile = await this.creators.profile(caller, id);
    if (!profile) throw new NotFoundException("Creator not found");
    return profile;
  }
}
