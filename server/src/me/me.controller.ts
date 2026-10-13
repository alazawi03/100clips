import { Body, Controller, Get, NotFoundException, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentCaller } from "../common/auth/decorators";
import { Caller } from "../common/db/db";
import { ApiBodyExamples, ApiErrors } from "../common/openapi/docs";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
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
  @ApiBodyExamples(CreateAccountDto, {
    "Brand owner": { role: "brand", name_ar: "ريم", name_en: "Reem" },
    Creator: { role: "creator", name_ar: "دانة", name_en: "Dana", phone: "+97333123456" },
  })
  @ApiCreatedResponse({ type: Account })
  @ApiErrors(400, 401, 409)
  createAccount(@CurrentCaller() caller: Caller, @Body() body: CreateAccountDto): Promise<Account> {
    return this.me.createAccount(caller, body);
  }

  @Patch()
  @ApiOperation({ summary: "Edit my account", description: "Name and phone (settings). Only the fields sent change; null clears one." })
  @ApiBodyExamples(UpdateAccountDto, {
    "Name and phone": { name_en: "Reem", phone: "+97333123456" },
    "Clear the phone": { phone: null },
  })
  @ApiOkResponse({ type: Account })
  @ApiErrors(400, 401, 404)
  async updateAccount(@CurrentCaller() caller: Caller, @Body() body: UpdateAccountDto): Promise<Account> {
    const account = await this.me.updateAccount(caller, body);
    if (!account) throw new NotFoundException("No account yet. Finish signing up.");
    return account;
  }
}