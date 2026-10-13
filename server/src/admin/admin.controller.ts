import { Body, Controller, ForbiddenException, Get, HttpCode, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentCaller } from "../common/auth/decorators";
import { Caller } from "../common/db/db";
import { ApiBodyExamples, ApiErrors } from "../common/openapi/docs";
import { AdminService } from "./admin.service";
import { DecideCreatorDto } from "./dto/decide-creator.dto";
import { PendingApplication } from "./entities/pending-application.entity";

@ApiTags("Admin")
@ApiBearerAuth()
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("applications")
  @ApiOperation({ summary: "Creators waiting for review", description: "Admins only. Oldest first, with the previous application to compare." })
  @ApiOkResponse({ type: [PendingApplication] })
  @ApiErrors(401, 403)
  async pending(@CurrentCaller() caller: Caller): Promise<PendingApplication[]> {
    const list = await this.admin.pendingApplications(caller);
    if (!list) throw new ForbiddenException("Admins only");
    return list;
  }

  @Post("creators/:id/decision")
  @HttpCode(204)
  @ApiOperation({ summary: "Decide on an application", description: "Admins only. A note is required unless approved; the creator sees it." })
  @ApiBodyExamples(DecideCreatorDto, {
    Approve: { decision: "approved" },
    "Ask for changes": { decision: "changes_requested", note: "Please add a sample filmed in daylight." },
    Reject: { decision: "rejected", note: "Samples don't meet our quality bar yet." },
  })
  @ApiNoContentResponse({ description: "Decided; the creator's status changed" })
  @ApiErrors(400, 401, 403, 409)
  async decide(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string, @Body() body: DecideCreatorDto): Promise<void> {
    await this.admin.decide(caller, id, body);
  }
}
