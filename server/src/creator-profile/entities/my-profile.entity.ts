import { ApiProperty } from "@nestjs/swagger";
import type { Enums, Tables } from "../../common/db/database.types";
import { ApiEnum, ENUMS, text, time, uuid } from "../../common/openapi/props";
import { Creator } from "../../creators/entities/creator.entity";
import { FormatPriceDto, SocialDto } from "../dto/offer-settings.dto";

export class Sample implements Omit<Tables<"creator_portfolio">, "creator_id"> {
  @ApiProperty(uuid) id: string;
  @ApiProperty() video_path: string;
  @ApiProperty(time) created_at: string;
}

/** A creators_addresses row: private to the creator; brands get a copy on an order they accept. */
export class Address implements Omit<Tables<"creator_addresses">, "creator_id"> {
  @ApiProperty(uuid) id: string;
  @ApiEnum(ENUMS.address_type, "AddressType") type: Enums<"address_type">;
  @ApiProperty(text) label: string | null;
  @ApiProperty() address_text: string;
  @ApiProperty({ type: Number, nullable: true }) latitude: number | null;
  @ApiProperty({ type: Number, nullable: true }) longitude: number | null;
  @ApiProperty(time) created_at: string;
}

/** The latest application as the creator sees it: what was sent and the admin's verdict. */
export class Application implements Omit<Tables<"creator_approvals">, "creator_id" | "decided_by"> {
  @ApiProperty(uuid) id: string;
  @ApiProperty() intro_video_path: string;
  @ApiProperty({ type: [String] }) sample_paths: string[];
  @ApiProperty(time) submitted_at: string;
  @ApiProperty({ enum: ["approved", "changes_requested", "rejected"], nullable: true, description: "Null while it waits" })
  decision: Enums<"creator_status"> | null;
  @ApiProperty({ ...text, description: "Why, when changes were requested or it was rejected" }) note: string | null;
  @ApiProperty({ ...time, nullable: true }) decided_at: string | null;
}

/** Everything the creator app's profile and sign-up screens need, in one query. */
export class MyCreatorProfile {
  @ApiProperty({ type: () => Creator }) creator: Creator;
  @ApiProperty({ type: () => [FormatPriceDto] }) formats: FormatPriceDto[];
  @ApiProperty({ type: () => [SocialDto] }) socials: SocialDto[];
  @ApiProperty({ type: () => [Sample], description: "Up to 3, oldest first" }) portfolio: Sample[];
  @ApiProperty({ type: () => [Address], description: "Up to 5, oldest first" }) addresses: Address[];
  @ApiProperty({ type: () => Application, nullable: true, description: "Null before the first submission" }) application: Application | null;
}
