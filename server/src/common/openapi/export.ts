import "reflect-metadata";
import { writeFileSync } from "node:fs";
import { createApp } from "../../app.module";
import type { TokenVerifier } from "../auth/token-verifier";
import type { Db } from "../db/db";
import { buildDocument } from "./docs";

/** Writes openapi.json without a database: `npm run openapi`. */
async function main() {
  const unused = () => {
    throw new Error("not used while building the spec");
  };
  const app = await createApp({ run: unused } as unknown as Db, { verify: unused } as unknown as TokenVerifier);
  writeFileSync("openapi.json", JSON.stringify(buildDocument(app), null, 2) + "\n");
  await app.close();
  console.log("Wrote openapi.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
