// npm run db:types: regenerates src/common/db/database.types.ts from the live Supabase schema.
// Needs a Supabase login once: `npx supabase@2 login` (or SUPABASE_ACCESS_TOKEN in the environment).
// Writes the file only if generation worked, so a failure never replaces the current types.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const PROJECT = "kwxoplenxwciacyfbqeo";
const OUT = "src/common/db/database.types.ts";

let types;
try {
  types = execSync(`npx -y supabase@2 gen types typescript --project-id ${PROJECT} --schema public`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 20 * 1024 * 1024,
  });
} catch (e) {
  console.error(e.stdout || e.stderr || e.message);
  console.error("Types not changed. If it says an access token is needed, run: npx supabase@2 login");
  process.exit(1);
}
if (!types.includes("export type Database")) {
  console.error(types);
  console.error("Types not changed: the output doesn't look like generated types.");
  process.exit(1);
}
writeFileSync(OUT, types);
console.log(`Wrote ${OUT}`);
