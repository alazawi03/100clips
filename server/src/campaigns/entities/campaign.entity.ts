import { ApiProperty } from "@nestjs/swagger";
import type { Enums, Tables } from "../../common/db/database.types";
import { ApiEnum, ENUMS, text, time, uuid } from "../../common/openapi/props";
import { LogisticsDto } from "../dto/create-campaign.dto";

const date = { type: String, format: "date", nullable: true } as const;

/** A campaigns row. logistics, draft and events are JSON columns, typed here rather than checked against the schema. */
export class Campaign implements Omit<Tables<"campaigns">, "logistics" | "draft" | "events"> {
  @ApiProperty(uuid) id: string;
  @ApiProperty(uuid) brand_id: string;
  @ApiEnum(ENUMS.campaign_status, "CampaignStatus") status: Enums<"campaign_status">;
  @ApiProperty({ ...uuid, nullable: true }) product_id: string | null;
  @ApiProperty(text) title: string | null;
  @ApiProperty(text) brief: string | null;
  @ApiEnum(ENUMS.video_style, "VideoStyle", { nullable: true }) video_style: Enums<"video_style"> | null;
  @ApiProperty(date) deadline: string | null;
  @ApiProperty(text) key_message: string | null;
  @ApiProperty({ type: [String] }) reference_links: string[];
  @ApiProperty(text) must_include: string | null;
  @ApiProperty(text) avoid: string | null;
  @ApiProperty({ type: LogisticsDto }) logistics: LogisticsDto;
  @ApiProperty({ type: "object", additionalProperties: true, nullable: true, description: "A draft's saved form; null once live" })
  draft: Record<string, unknown> | null;
  @ApiProperty({ ...uuid, nullable: true, description: "\"Run again\": the campaign this was copied from" }) copied_from: string | null;
  @ApiProperty({
    type: "array",
    items: { type: "object", additionalProperties: true },
    description: "Changes after paying, oldest first: {type: details_edited, at, changes: [{field, before, after}]} or {type: deadline_moved, at, from, to}",
  })
  events: Record<string, unknown>[];
  @ApiProperty(time) created_at: string;
  @ApiProperty({ ...time, nullable: true }) launched_at: string | null;
  @ApiProperty({ ...time, nullable: true }) cancelled_at: string | null;
  @ApiProperty(time) updated_at: string;
}

export class CampaignSecrets {
  @ApiProperty(text) access_link: string | null;
  @ApiProperty(text) login_details: string | null;
  @ApiProperty(text) code: string | null;
}

/** One campaign with its secrets: null until set, or when the caller may not see them (offers still waiting). */
export class CampaignWithSecrets extends Campaign {
  @ApiProperty({ type: () => CampaignSecrets, nullable: true }) secrets: CampaignSecrets | null;
}
