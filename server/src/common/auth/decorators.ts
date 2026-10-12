import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Request } from "express";
import type { Caller } from "../db/db";

export const IS_PUBLIC = "isPublic";

/** The route works without signing in (the caller is then `anon`). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** A request after AuthGuard has decided who is calling. */
export type RequestWithCaller = Request & { caller?: Caller };

/** Who is calling: the signed-in user, or `anon` on a public route. */
export const CurrentCaller = createParamDecorator((_: unknown, context: ExecutionContext): Caller => {
  return context.switchToHttp().getRequest<RequestWithCaller>().caller ?? { role: "anon" };
});
