import { ApiProperty } from "@nestjs/swagger";
import { Constants } from "../db/database.types";

/** Shared OpenAPI property settings for entities. */
export const uuid = { type: String, format: "uuid" } as const;
export const time = { type: String, format: "date-time" } as const;
export const text = { type: String, nullable: true } as const;

/** The database's enum values, from the generated types (so docs and validation follow the schema). */
export const ENUMS = Constants.public.Enums;

/** A property whose values are a database enum, named after it in the docs. */
export const ApiEnum = (values: readonly string[], name: string, extra: { nullable?: boolean; isArray?: boolean; required?: boolean } = {}) =>
  ApiProperty({ enum: [...values], enumName: name, ...extra });
