import { Body, Controller, Get, NotFoundException, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentCaller } from "../common/auth/decorators";
import { Caller } from "../common/db/db";
import { ApiErrors } from "../common/openapi/docs";
import { CreateAccountDto } from "./dto/create-account.dto";
import { Account } from "./entities/account.entity";
import { Me } from "./entities/me.entity";
import { MeService } from "./me.service";

@ApiTags("Me")
@ApiBearerAuth()
@Controller("me")
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  @ApiOperation({ summary: "The signed-in person", description: "Their account, creator profile (creators) and brands (brand owners)." })
  @ApiOkResponse({ type: Me })
  @ApiErrors(401, 404)
  async get(@CurrentCaller() caller: Caller): Promise<Me> {
    const me = await this.me.get(caller);
    if (!me) throw new NotFoundException("No account yet. Finish signing up.");
    return me;
  }

  @Post()
  @ApiOperation({ summary: "Create my account", description: "First step after signing in for the first time: creator or brand." })
  @ApiCreatedResponse({ type: Account })
  @ApiErrors(400, 401, 409)
  createAccount(@CurrentCaller() caller: Caller, @Body() body: CreateAccountDto): Promise<Account> {
    return this.me.createAccount(caller, body);
  }
}
