import { PartialType } from "@nestjs/swagger";
import { CreateCampaignDto } from "./create-campaign.dto";

/** Saving a draft: only the fields sent change; null clears one. Live campaigns change through /details and /deadline. */
export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {}
