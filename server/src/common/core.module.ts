import { DynamicModule, Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth/auth.guard";
import { TokenVerifier } from "./auth/token-verifier";
import { Db } from "./db/db";

/**
 * What every feature uses: the database and the token check. Global, so feature modules don't
 * import it. Both are passed in, so tests can use PGlite and fake tokens.
 */
@Global()
@Module({})
export class CoreModule {
  static with(db: Db, verifier: TokenVerifier): DynamicModule {
    return {
      module: CoreModule,
      providers: [
        { provide: Db, useValue: db },
        { provide: TokenVerifier, useValue: verifier },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
      exports: [Db, TokenVerifier],
    };
  }
}
