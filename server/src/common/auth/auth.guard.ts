import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC, RequestWithCaller } from "./decorators";
import { TokenVerifier } from "./token-verifier";

/** Every route needs a Supabase access token (`Authorization: Bearer …`) unless marked @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly log = new Logger("Auth");

  constructor(
    private readonly verifier: TokenVerifier,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<RequestWithCaller>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) {
      if (isPublic) {
        req.caller = { role: "anon" };
        return true;
      }
      throw new UnauthorizedException("Sign in first");
    }
    try {
      const { userId } = await this.verifier.verify(token);
      req.caller = { role: "authenticated", userId };
      return true;
    } catch (e) {
      // Why, for whoever runs the API (expired, wrong project, not a token at all...). Never the token itself.
      this.log.warn(`Token refused: ${(e as Error).message}`);
      throw new UnauthorizedException("Your session has expired. Sign in again.");
    }
  }
}
