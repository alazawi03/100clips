import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateAccountDto } from "./create-account.dto";

/** Settings: name and phone. Only the fields sent change; null clears one. The role never changes. */
export class UpdateAccountDto extends PartialType(OmitType(CreateAccountDto, ["role"] as const)) {}
