import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createApp } from "../src/app.module";
import { TokenVerifier } from "../src/common/auth/token-verifier";
import { PgliteDb } from "./pglite-db";

/** Tokens in tests are "user:<id>"; anything else is rejected, like an expired Supabase token. */
class FakeVerifier extends TokenVerifier {
  async verify(token: string) {
    if (!token.startsWith("user:")) throw new Error("bad token");
    return { userId: token.slice(5) };
  }
}

const id = (n: number) => `00000000-0000-0000-0000-0000000000${String(n).padStart(2, "0")}`;
const [ADMIN, BRAND, CREATOR, BRAND2] = [1, 2, 3, 4].map(id);

let app: INestApplication;
let db: PgliteDb;
let base: string;
let spec: { paths: Record<string, Record<string, unknown>>; components: { schemas: Record<string, { properties: object }> } };

/** The response has exactly the fields the OpenAPI schema documents. */
function assertShape(body: object, schema: string) {
  assert.deepEqual(Object.keys(body).sort(), Object.keys(spec.components.schemas[schema].properties).sort(), schema);
}

async function call(method: string, path: string, user?: string, body?: unknown) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { "content-type": "application/json", ...(user ? { authorization: `Bearer user:${user}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : undefined };
}

before(async () => {
  db = await PgliteDb.create();
  for (const u of [ADMIN, BRAND, CREATOR, BRAND2]) await db.seed("insert into auth.users values ($1)", [u]);
  await db.seed("insert into public.accounts (id, role) values ($1, 'admin')", [ADMIN]);
  app = await createApp(db, new FakeVerifier());
  await app.listen(0);
  base = (await app.getUrl()).replace("[::1]", "localhost");
  spec = (await (await fetch(`${base}/openapi.json`)).json()) as typeof spec;
});

after(async () => {
  await app?.close();
});

describe("public routes", () => {
  test("health works without signing in", async () => {
    assert.deepEqual((await call("GET", "/health")).body, { ok: true });
  });

  test("waitlist: anyone joins, junk is refused", async () => {
    assert.equal((await call("POST", "/waitlist", undefined, { country: "sa", contact: "reem@example.com" })).status, 204);
    const junk = await call("POST", "/waitlist", undefined, { country: "SA", contact: "not a contact" });
    assert.equal(junk.status, 400);
    assert.equal((await call("POST", "/waitlist", undefined, { country: "Saudi", contact: "x@y.com" })).status, 400);
  });

  test("everything else needs a valid token", async () => {
    assert.equal((await call("GET", "/me")).status, 401);
    const res = await fetch(`${base}/me`, { headers: { authorization: "Bearer expired" } });
    assert.equal(res.status, 401);
  });
});

describe("OpenAPI", () => {
  test("/openapi.json lists every endpoint", () => {
    const routes = Object.entries(spec.paths).flatMap(([path, ops]) => Object.keys(ops).map((m) => `${m.toUpperCase()} ${path}`));
    assert.deepEqual(routes.sort(), [
      "DELETE /products/{id}", "GET /brands", "GET /brands/{brandId}/products", "GET /creators", "GET /creators/{id}",
      "GET /health", "GET /me", "GET /products/{id}", "PATCH /brands/{id}", "PATCH /me", "PATCH /products/{id}",
      "POST /brands", "POST /brands/{brandId}/products", "POST /me", "POST /waitlist",
    ]);
  });
});

describe("signing up", () => {
  test("no account yet, then choose a role", async () => {
    assert.equal((await call("GET", "/me", BRAND)).status, 404);
    const made = await call("POST", "/me", BRAND, { role: "brand", name_en: "Roastery" });
    assert.equal(made.status, 201);
    assert.equal(made.body.role, "brand");
    assertShape(made.body, "Account");
    const me = await call("GET", "/me", BRAND);
    assert.equal(me.body.account.name_en, "Roastery");
    assert.deepEqual(me.body.brands, []);
    assert.equal(me.body.creator, null);
    assertShape(me.body, "Me");
  });

  test("nobody signs up as admin, and only once", async () => {
    assert.equal((await call("POST", "/me", BRAND2, { role: "admin" })).status, 400);
    assert.equal((await call("POST", "/me", BRAND, { role: "brand" })).status, 409);
  });

  test("settings: edit name and phone, never the role", async () => {
    assert.equal((await call("PATCH", "/me", BRAND2, { name_en: "Early" })).status, 404); // no account yet
    const edited = await call("PATCH", "/me", BRAND, { name_ar: "ريم", phone: "+97333123456" });
    assert.equal(edited.status, 200);
    assertShape(edited.body, "Account");
    assert.deepEqual([edited.body.name_en, edited.body.name_ar, edited.body.phone], ["Roastery", "ريم", "+97333123456"]);
    assert.equal((await call("PATCH", "/me", BRAND, { phone: null })).body.phone, null);
    assert.equal((await call("PATCH", "/me", BRAND, { role: "admin" })).status, 400);
    assert.equal((await call("PATCH", "/me", BRAND, { name_en: "" })).status, 400);
    assert.equal((await call("GET", "/me", BRAND)).body.account.role, "brand");
  });
  test("unknown fields are refused", async () => {
    assert.equal((await call("POST", "/me", BRAND2, { role: "brand", is_admin: true })).status, 400);
  });
});

describe("brands", () => {
  let brandId: string;

  test("a brand owner adds a brand and sees it in /me", async () => {
    const made = await call("POST", "/brands", BRAND, { name_ar: "محمصة المحرق", industry: "food_beverage" });
    assert.equal(made.status, 201);
    brandId = made.body.id;
    assertShape(made.body, "Brand");
    assert.equal((await call("GET", "/brands", BRAND)).body.length, 1);
    assert.equal((await call("GET", "/me", BRAND)).body.brands[0].id, brandId);
  });

  test("a brand needs a name", async () => {
    assert.equal((await call("POST", "/brands", BRAND, { industry: "other" })).status, 400);
  });

  test("only brand owners add brands", async () => {
    await call("POST", "/me", CREATOR, { role: "creator" });
    assert.equal((await call("POST", "/brands", CREATOR, { name_en: "Mine", industry: "other" })).status, 403);
  });

  test("the owner edits it; another account can't", async () => {
    const edited = await call("PATCH", `/brands/${brandId}`, BRAND, { about: "Specialty coffee in Muharraq" });
    assert.equal(edited.body.about, "Specialty coffee in Muharraq");
    await call("POST", "/me", BRAND2, { role: "brand" });
    assert.equal((await call("PATCH", `/brands/${brandId}`, BRAND2, { about: "hijacked" })).status, 404);
    assert.equal((await call("PATCH", "/brands/not-a-uuid", BRAND, { about: "x" })).status, 400);
  });
});

describe("products", () => {
  let brandId: string;
  let coffeeId: string;
  const coffee = {
    type: "physical",
    name: "Ethiopian single origin",
    photos: ["brand/coffee.jpg"],
    price: 4.5,
    benefits: ["Roasted weekly", "Fruity"],
    concerns: [{ question: "Is it too strong?", answer: "Medium roast" }],
    details: { value: 4.5, size: "250 g" },
  };

  before(async () => {
    brandId = (await call("GET", "/brands", BRAND)).body[0].id;
  });

  test("the owner adds a product; anyone signed in can read it", async () => {
    const made = await call("POST", `/brands/${brandId}/products`, BRAND, coffee);
    assert.equal(made.status, 201);
    assertShape(made.body, "Product");
    assert.equal(made.body.price, 4.5);
    assert.deepEqual(made.body.details, { value: 4.5, size: "250 g" });
    assert.deepEqual(made.body.concerns, coffee.concerns);
    assert.match(made.body.created_at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?[+-]\d\d:\d\d$/); // ISO, like timestamps inside JSON
    coffeeId = made.body.id;

    assert.equal((await call("GET", `/brands/${brandId}/products`, BRAND)).body.length, 1);
    assert.equal((await call("GET", `/products/${coffeeId}`, CREATOR)).body.name, coffee.name);
    assert.equal((await call("GET", `/products/${id(99)}`, BRAND)).status, 404);
  });

  test("details must fit the type", async () => {
    const add = (body: object) => call("POST", `/brands/${brandId}/products`, BRAND, body);
    assert.equal((await add({ type: "venue", name: "Muharraq branch" })).status, 400); // a venue needs its kind
    assert.equal((await add({ type: "app", name: "App", details: { kind: "cafe" } })).status, 400); // not an app field
    assert.equal((await add({ type: "physical", name: "Bag", details: { value: -1 } })).status, 400);
    assert.equal((await add({ type: "service", name: "Class", details: { delivery: ["by_drone"] } })).status, 400);
    assert.equal((await add({ type: "physical", name: "Bag", benefits: ["1", "2", "3", "4", "5", "6"] })).status, 400);
    const venue = await add({ type: "venue", name: "Muharraq branch", details: { kind: "cafe", hours: "7am–11pm" } });
    assert.equal(venue.status, 201);
    assert.deepEqual(venue.body.details, { kind: "cafe", hours: "7am–11pm" });
    const bare = await add({ type: "physical", name: "Gift card" });
    assert.equal(bare.status, 201);
    assert.deepEqual([bare.body.photos, bare.body.benefits, bare.body.concerns, bare.body.details], [[], [], [], {}]);
  });

  test("only the brand's owner adds, edits or deletes", async () => {
    assert.equal((await call("POST", `/brands/${brandId}/products`, BRAND2, coffee)).status, 403);
    assert.equal((await call("POST", `/brands/${brandId}/products`, CREATOR, coffee)).status, 403);
    assert.equal((await call("PATCH", `/products/${coffeeId}`, BRAND2, { name: "Mine" })).status, 404);
    assert.equal((await call("DELETE", `/products/${coffeeId}`, BRAND2)).status, 404);
  });

  test("edits change only the fields sent; type and details go together", async () => {
    const edited = await call("PATCH", `/products/${coffeeId}`, BRAND, { price: 5 });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.price, 5);
    assert.equal(edited.body.name, coffee.name);
    assert.equal((await call("PATCH", `/products/${coffeeId}`, BRAND, { type: "venue" })).status, 400);
    assert.equal((await call("PATCH", `/products/${coffeeId}`, BRAND, { details: { size: "1 kg" } })).status, 400);
    const retyped = await call("PATCH", `/products/${coffeeId}`, BRAND, { type: "service", details: { delivery: ["online"] } });
    assert.equal(retyped.body.type, "service");
    assert.deepEqual(retyped.body.details, { delivery: ["online"] });
  });

  test("a product in a campaign can't be deleted; others can", async () => {
    await db.seed("insert into public.campaigns (brand_id, product_id) values ($1, $2)", [brandId, coffeeId]);
    assert.equal((await call("DELETE", `/products/${coffeeId}`, BRAND)).status, 409);
    const spare = (await call("POST", `/brands/${brandId}/products`, BRAND, { type: "physical", name: "Spare" })).body;
    assert.equal((await call("DELETE", `/products/${spare.id}`, BRAND)).status, 204);
    assert.equal((await call("GET", `/products/${spare.id}`, BRAND)).status, 404);
  });
});

describe("creators", () => {
  test("explore shows only approved, complete creators", async () => {
    assert.deepEqual((await call("GET", "/creators", BRAND)).body, []);
    // A creator profile made complete and approved directly in the database, as the creator flow will.
    await db.seed(`insert into public.creators (id, name_en, handle, city, niches, photo_path, status, approved_at)
      values ($1, 'Dana', 'dana.glow', 'Manama', '{beauty}', $1::uuid::text || '/photo.jpg', 'approved', now())`, [CREATOR]);
    await db.seed(`insert into public.creator_formats (creator_id, format, price) values ($1, 'instagram_reel', 35)`, [CREATOR]);
    await db.seed(`insert into public.creator_portfolio (creator_id, video_path) values ($1, $1::uuid::text || '/s1.mp4')`, [CREATOR]);
    await db.seed(`insert into public.creator_socials (creator_id, platform, username) values ($1, 'instagram', 'dana.glow')`, [CREATOR]);

    const all = await call("GET", "/creators", BRAND);
    assert.equal(all.body.length, 1);
    assertShape(all.body[0], "ExploreCreator");
    assert.equal(all.body[0].from_price, 35);
    assert.equal(all.body[0].review_count, 0);
    assert.equal((await call("GET", "/creators?niche=food", BRAND)).body.length, 0);
    assert.equal((await call("GET", "/creators?niche=nonsense", BRAND)).status, 400);
  });

  test("a profile has prices, socials and portfolio; unknown creators are 404", async () => {
    const p = await call("GET", `/creators/${CREATOR}`, BRAND);
    assert.equal(p.status, 200);
    assertShape(p.body, "CreatorProfile");
    assertShape(p.body.creator, "PublicCreator");
    assert.equal(p.body.creator.handle, "dana.glow");
    assert.equal(p.body.formats.length, 1);
    assert.equal(p.body.socials[0].username, "dana.glow");
    assert.equal(p.body.portfolio.length, 1);
    assert.equal((await call("GET", `/creators/${id(99)}`, BRAND)).status, 404);
  });

  test("a suspended creator disappears from explore", async () => {
    await db.seed(`insert into public.suspensions (account_id, reason, suspended_by) values ($1, 'Test', $2)`, [CREATOR, ADMIN]);
    assert.equal((await call("GET", "/creators", BRAND)).body.length, 0);
    assert.equal((await call("GET", `/creators/${CREATOR}`, BRAND)).status, 404);
  });
});
