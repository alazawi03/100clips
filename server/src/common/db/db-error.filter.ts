import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";
import { ConflictError, ForbiddenError, InputError, NotFoundError } from "../errors";

/** The services' rule errors (common/errors.ts), each with its status. */
const STATUS_BY_ERROR: [new (...args: never[]) => Error, number][] = [
  [InputError, HttpStatus.BAD_REQUEST],
  [ForbiddenError, HttpStatus.FORBIDDEN],
  [NotFoundError, HttpStatus.NOT_FOUND],
  [ConflictError, HttpStatus.CONFLICT],
];

/**
 * Errors from Postgres itself: row-level security refusing a write, constraints, and the database
 * functions that are still there (raised with a code and a message for people).
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

/**
 * Constraint errors carry Postgres's wording ("violates foreign key constraint ..."). These are the
 * ones people can hit through the API, by constraint name, in words for people.
 */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  campaigns_product_id_brand_id_fkey: "Pick one of this brand's products",
  accounts_pkey: "You already have an account",
  creators_pkey: "You already have a creator profile",
  creators_handle_key: "That handle is taken",
  creators_check: "Give a name in Arabic or English",
  brands_check: "Give a name in Arabic or English",
  creator_addresses_check: "Send both latitude and longitude, or neither",
  creator_formats_creator_id_fkey: "Create your creator profile first",
  creator_socials_creator_id_fkey: "Create your creator profile first",
  creator_portfolio_creator_id_fkey: "Create your creator profile first",
  creator_addresses_creator_id_fkey: "Create your creator profile first",
  waitlist_requests_email_check: "Enter a valid email or phone number",
  waitlist_requests_phone_check: "Enter a valid email or phone number",
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
    const rule = STATUS_BY_ERROR.find(([type]) => error instanceof type);
    if (rule) {
      res.status(rule[1]).json({ statusCode: rule[1], message: (error as Error).message });
      return;
    }
    const code = (error as { code?: string })?.code;
    const status = code ? STATUS_BY_CODE[code] : undefined;
    if (status) {
      const constraint = (error as { constraint?: string }).constraint;
      const message = (constraint && CONSTRAINT_MESSAGES[constraint]) || (error as Error).message;
      res.status(status).json({ statusCode: status, message, code });
      return;
    }
    this.log.error(error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ statusCode: 500, message: "Something went wrong" });
  }
}
