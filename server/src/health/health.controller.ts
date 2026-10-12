import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/auth/decorators";
import { HealthService } from "./health.service";

class Health {
  @ApiProperty({ example: true })
  ok: boolean;
}

@ApiTags("Public")
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "API and database are up" })
  @ApiOkResponse({ type: Health })
  async check(): Promise<Health> {
    await this.health.pingDatabase();
    return { ok: true };
  }
}
