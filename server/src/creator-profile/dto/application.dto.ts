import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class AddSampleDto {
  @ApiProperty({ maxLength: 300, description: "A sample clip in public-media: {your user id}/..." })
  @IsString() @MaxLength(300)
  video_path: string;
}

/** "Send for review". The intro can be left out on a resubmission: the previous one is sent again. */
export class SubmitApplicationDto {
  @ApiPropertyOptional({ maxLength: 300, description: "The intro video in private-docs: {your user id}/... (15-60 seconds)" })
  @IsOptional() @IsString() @MaxLength(300)
  intro_video_path?: string;
}
