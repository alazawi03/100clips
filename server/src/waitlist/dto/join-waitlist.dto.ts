import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, Matches } from "class-validator";

export class JoinWaitlistDto {
  @ApiProperty({ description: "ISO country code", example: "SA", pattern: "^[A-Za-z]{2}$" })
  @Matches(/^[A-Za-z]{2}$/)
  country: string;

  /** The sheet's one box: a phone number or an email. The database sorts out which. */
  @ApiProperty({ description: "A phone number or an email", example: "+966501234567", minLength: 3, maxLength: 200 })
  @IsString()
  @Length(3, 200)
  contact: string;
}
