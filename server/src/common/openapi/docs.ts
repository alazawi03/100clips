import { applyDecorators, INestApplication } from "@nestjs/common";
import { ApiResponse, DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { ErrorResponse } from "./error-response";

const ERROR_MEANING: Record<number, string> = {
  400: "Invalid input",
  401: "Not signed in, or the session expired",
  403: "Not allowed",
  404: "Not found, or not yours",
  409: "Already exists, or the wrong state for this",
};

/** The error answers an endpoint can give, all shaped like ErrorResponse. */
export const ApiErrors = (...statuses: number[]) =>
  applyDecorators(...statuses.map((status) => ApiResponse({ status, description: ERROR_MEANING[status], type: ErrorResponse })));

export function buildDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle("100clips API")
    .setDescription(
      "For the brand dashboard and the creator app. Sign in with Supabase Auth and send the access token " +
        "as `Authorization: Bearer <token>`. Each request runs as that user in Postgres, so row-level security decides what they see.",
    )
    .setVersion("0.1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Supabase access token" })
    .build();
  return SwaggerModule.createDocument(app, config);
}

/** Interactive docs at /docs and the spec at /openapi.json (import it into Apidog or Postman). Both public. */
export function setupDocs(app: INestApplication) {
  SwaggerModule.setup("docs", app, () => buildDocument(app), { jsonDocumentUrl: "openapi.json", yamlDocumentUrl: "openapi.yaml" });
}
