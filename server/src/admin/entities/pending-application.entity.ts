import { ApiProperty } from "@nestjs/swagger";
import { Creator } from "../../creators/entities/creator.entity";
import { Application } from "../../creator-profile/entities/my-profile.entity";
import { FormatPriceDto, SocialDto } from "../../creator-profile/dto/offer-settings.dto";

/** A creator waiting for review, with what they sent and, for comparison, their previous application. */
export class PendingApplication {
  @ApiProperty({ type: () => Creator }) creator: Creator;
  @ApiProperty({ type: () => [FormatPriceDto] }) formats: FormatPriceDto[];
  @ApiProperty({ type: () => [SocialDto] }) socials: SocialDto[];
  @ApiProperty({ type: () => Application, description: "The one waiting: intro and samples as sent" }) application: Application;
  @ApiProperty({ type: () => Application, nullable: true, description: "The one before, with its verdict" }) previous: Application | null;
}
