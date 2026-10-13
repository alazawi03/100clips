import {
  Body, ConflictException, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Put, Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentCaller } from "../common/auth/decorators";
import { Caller } from "../common/db/db";
import { ApiBodyExamples, ApiErrors } from "../common/openapi/docs";
import { CampaignsService, NotWritable } from "./campaigns.service";
import { CampaignDetailsDto, ExtendDeadlineDto } from "./dto/campaign-details.dto";
import { CampaignSecretsDto } from "./dto/campaign-secrets.dto";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { ListCampaignsQueryDto } from "./dto/list-campaigns.query.dto";
import { UpdateCampaignDto } from "./dto/update-campaign.dto";
import { Campaign, CampaignSecrets, CampaignWithSecrets } from "./entities/campaign.entity";

const notWritable = (why: NotWritable) =>
  why === "not_draft"
    ? new ConflictException("Only drafts change this way. A live campaign changes through /details and /deadline.")
    : new NotFoundException("Campaign not found");

const BRIEF_EXAMPLE = {
  title: "Morning coffee ritual",
  brief: "Show how you make your morning cup with our Ethiopian beans, start to first sip.",
  video_style: "routine",
  deadline: "2026-12-01",
  key_message: "Fresh beans, roasted weekly in Muharraq",
  reference_links: ["https://www.tiktok.com/@example/video/1"],
  must_include: "The bag's label, the grinder",
  avoid: "Other coffee brands",
  logistics: { after: "keep" },
};

@ApiTags("Campaigns")
@ApiBearerAuth()
@Controller()
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get("campaigns")
  @ApiOperation({ summary: "Campaigns", description: "Brand owners: their brands' campaigns. Creators: the ones they have offers on. Newest first." })
  @ApiOkResponse({ type: [Campaign] })
  @ApiErrors(400, 401)
  list(@CurrentCaller() caller: Caller, @Query() query: ListCampaignsQueryDto): Promise<Campaign[]> {
    return this.campaigns.list(caller, query);
  }

  @Post("brands/:brandId/campaigns")
  @ApiOperation({ summary: "Start a draft", description: "Every field optional; save as the brand fills the form. The brand's owner only." })
  @ApiBodyExamples(CreateCampaignDto, { "Full brief": BRIEF_EXAMPLE, "Just a title": { title: "Morning coffee ritual" } })
  @ApiCreatedResponse({ type: Campaign })
  @ApiErrors(400, 401, 403)
  create(@CurrentCaller() caller: Caller, @Param("brandId", ParseUUIDPipe) brandId: string, @Body() body: CreateCampaignDto): Promise<Campaign> {
    return this.campaigns.create(caller, brandId, body);
  }

  @Get("campaigns/:id")
  @ApiOperation({ summary: "A campaign", description: "With its secrets for the owner, and for creators once they accepted." })
  @ApiOkResponse({ type: CampaignWithSecrets })
  @ApiErrors(400, 401, 404)
  async get(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string): Promise<CampaignWithSecrets> {
    const campaign = await this.campaigns.get(caller, id);
    if (!campaign) throw new NotFoundException("Campaign not found");
    return campaign;
  }

  @Patch("campaigns/:id")
  @ApiOperation({ summary: "Save a draft", description: "Only the fields sent change; null clears one. Drafts only (409 once live)." })
  @ApiBodyExamples(UpdateCampaignDto, { "Change the brief": { brief: BRIEF_EXAMPLE.brief }, "Clear the deadline": { deadline: null } })
  @ApiOkResponse({ type: Campaign })
  @ApiErrors(400, 401, 404, 409)
  async update(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateCampaignDto): Promise<Campaign> {
    const result = await this.campaigns.update(caller, id, body);
    if (typeof result === "string") throw notWritable(result);
    return result;
  }

  @Delete("campaigns/:id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a draft", description: "Drafts only (409 once live)." })
  @ApiNoContentResponse({ description: "Deleted" })
  @ApiErrors(400, 401, 404, 409)
  async remove(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string): Promise<void> {
    const result = await this.campaigns.remove(caller, id);
    if (result !== "deleted") throw notWritable(result);
  }

  @Post("campaigns/:id/copy")
  @ApiOperation({ summary: "Run again", description: "A new draft with the same brief and secrets, without the deadline." })
  @ApiCreatedResponse({ type: Campaign })
  @ApiErrors(400, 401, 404)
  async copy(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string): Promise<Campaign> {
    const copy = await this.campaigns.copy(caller, id);
    if (!copy) throw new NotFoundException("Campaign not found");
    return copy;
  }

  @Put("campaigns/:id/details")
  @ApiOperation({
    summary: "Edit details (live)",
    description: "Key message, references, must include, avoid. Replaces all four. Only before any creator accepts (409 after). Recorded in events.",
  })
  @ApiBodyExamples(CampaignDetailsDto, {
    "Edit details": { key_message: "Roasted this week", reference_links: [], must_include: "The bag's label", avoid: "Other coffee brands" },
  })
  @ApiOkResponse({ type: CampaignWithSecrets })
  @ApiErrors(400, 401, 404, 409)
  async editDetails(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string, @Body() body: CampaignDetailsDto): Promise<CampaignWithSecrets> {
    return this.campaigns.editDetails(caller, id, body);
  }

  @Put("campaigns/:id/deadline")
  @ApiOperation({ summary: "Extend the deadline (live)", description: "Later only. Waiting and in-progress orders on the old date move with it." })
  @ApiBodyExamples(ExtendDeadlineDto, { "A week later": { deadline: "2026-12-08" } })
  @ApiOkResponse({ type: CampaignWithSecrets })
  @ApiErrors(400, 401, 404, 409)
  async extendDeadline(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string, @Body() body: ExtendDeadlineDto): Promise<CampaignWithSecrets> {
    return this.campaigns.extendDeadline(caller, id, body);
  }

  @Put("campaigns/:id/secrets")
  @ApiOperation({ summary: "Set secrets", description: "App link, test account, code. Replaces all three. Shown to creators only once they accept." })
  @ApiBodyExamples(CampaignSecretsDto, {
    App: { access_link: "https://example.com/app", login_details: "user: test@example.com / pass: demo1234", code: null },
    "Promo code": { access_link: null, login_details: null, code: "100CLIPS" },
  })
  @ApiOkResponse({ type: CampaignSecrets })
  @ApiErrors(400, 401, 404)
  async setSecrets(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string, @Body() body: CampaignSecretsDto): Promise<CampaignSecrets> {
    const secrets = await this.campaigns.setSecrets(caller, id, body);
    if (!secrets) throw new NotFoundException("Campaign not found");
    return secrets;
  }
}
