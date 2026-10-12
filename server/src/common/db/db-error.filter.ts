import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";

/**
 * The database functions raise errors with a code and a message meant for people ("Choose an
 * address", "No revision left"). This turns them into HTTP answers with that message.
 */
const STATUS_BY_CODE: Record<string, number> = {
  "42501": HttpStatus.FORBIDDEN, // not allowed (also row-level security refusing a write)
  P0002: HttpStatus.NOT_FOUND, // not found
  "23514": HttpStatus.BAD_REQUEST, // check_violation: invalid input
  "22P02": HttpStatus.BAD_REQUEST, // invalid text representation (bad uuid, bad enum value)
  "23502": HttpStatus.BAD_REQUEST, // a required value is missing
  "23503": HttpStatus.BAD_REQUEST, // points at something that doesn't exist
  "23505": HttpStatus.CONFLICT, // already exists
  "55000": HttpStatus.CONFLICT, // wrong state for this action
};

@Catch()
export class DbErrorFilter implements ExceptionFilter {
  private readonly log = new Logger("API");

  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (error instanceof HttpException) {
      res.status(error.getStatus()).json(error.getResponse());
      return;
    }
    const code = (error as { code?: string })?.code;
    const status = code ? STATUS_BY_CODE[code] : undefined;
    if (status) {
      res.status(status).json({ statusCode: status, message: (error as Error).message, code });
      return;
    }
    this.log.error(error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ statusCode: 500, message: "Something went wrong" });
  }
}
