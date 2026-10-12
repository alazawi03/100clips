import { ApiProperty } from "@nestjs/swagger";
import { Brand } from "../../brands/entities/brand.entity";
import { Creator } from "../../creators/entities/creator.entity";
import { Account } from "./account.entity";

/** The signed-in person, everything the apps need after sign-in. */
export class Me {
  @ApiProperty({ type: () => Account }) account: Account;
  @ApiProperty({ type: () => Creator, nullable: true, description: "Creators only" }) creator: Creator | null;
  @ApiProperty({ type: () => [Brand], description: "Brand owners only; empty for creators" }) brands: Brand[];
}
