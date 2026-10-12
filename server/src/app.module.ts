import { DynamicModule, INestApplication, Module, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { BrandsModule } from "./brands/brands.module";
import { TokenVerifier } from "./common/auth/token-verifier";
import { CoreModule } from "./common/core.module";
import { Db } from "./common/db/db";
import { DbErrorFilter } from "./common/db/db-error.filter";
import { setupDocs } from "./common/openapi/docs";
import { CreatorsModule } from "./creators/creators.module";
import { HealthModule } from "./health/health.module";
import { MeModule } from "./me/me.module";
import { WaitlistModule } from "./waitlist/waitlist.module";

/** The whole API: the shared core plus one module per feature. */
@Module({})
export class AppModule {
  static with(db: Db, verifier: TokenVerifier): DynamicModule {
    return {
      module: AppModule,
      imports: [CoreModule.with(db, verifier), HealthModule, WaitlistModule, MeModule, CreatorsModule, BrandsModule],
    };
  }
}

export async function createApp(db: Db, verifier: TokenVerifier, corsOrigins: string[] = []): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.with(db, verifier), { logger: ["error", "warn"] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new DbErrorFilter());
  app.enableCors({ origin: corsOrigins });
  setupDocs(app);
  return app;
}
