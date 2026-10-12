import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/** Every error answer: from validation, the guard, NotFoundException or DbErrorFilter. */
export class ErrorResponse {
  @ApiProperty({ type: "integer", example: 400 })
  statusCode: number;

  @ApiProperty({
    oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
    description: "What went wrong, for people. Input checks give a list.",
    example: "Choose an address",
  })
  message: string | string[];

  @ApiPropertyOptional({ example: "Bad Request" })
  error?: string;

  @ApiPropertyOptional({ description: "Postgres error code, when the database refused", example: "23514" })
  code?: string;
}
