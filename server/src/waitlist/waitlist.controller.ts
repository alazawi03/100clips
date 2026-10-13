import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiNoContentResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/auth/decorators";
import { ApiBodyExamples, ApiErrors } from "../common/openapi/docs";
import { JoinWaitlistDto } from "./dto/join-waitlist.dto";
import { WaitlistService } from "./waitlist.service";

@ApiTags("Public")
@Controller("waitlist")
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  @Public()
  @Post()
  @HttpCode(204)
  @ApiOperation({ summary: "Join the waitlist", description: "\"Tell me when you launch\" in the creator app. Works before signing in." })
  @ApiBodyExamples(JoinWaitlistDto, {
    "With an email": { country: "SA", contact: "reem@example.com" },
    "With a phone": { country: "SA", contact: "+966501234567" },
  })
  @ApiNoContentResponse({ description: "Added to the list" })
  @ApiErrors(400)
  async join(@Body() body: JoinWaitlistDto): Promise<void> {
    await this.waitlist.join(body);
  }
}
