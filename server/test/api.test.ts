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
const [ADMIN, BRAND, CREATOR, BRAND2, CREATOR2, CREATOR3] = [1, 2, 3, 4, 5, 6].map(id);

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
  for (const u of [ADMIN, BRAND, CREATOR, BRAND2, CREATOR2, CREATOR3]) await db.seed("insert into auth.users values ($1)", [u]);
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
    assert.equal((await call("POST", "/waitlist", undefined, { country: "sa", contact: " Reem@Example.com " })).status, 204);
    assert.equal((await call("POST", "/waitlist", undefined, { country: "KW", contact: "+965 9876-5432" })).status, 204);
    const saved = await db.select("select country, email, phone from public.waitlist_requests order by created_at");
    assert.deepEqual(saved, [{ country: "SA", email: "reem@example.com", phone: null }, { country: "KW", email: null, phone: "+96598765432" }]);
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
      "DELETE /campaigns/{id}", "DELETE /products/{id}",
      "GET /brands", "GET /brands/{brandId}/products", "GET /campaigns", "GET /campaigns/{id}", "GET /creators", "GET /creators/{id}",
      "GET /health", "GET /me", "GET /products/{id}",
      "PATCH /brands/{id}", "PATCH /campaigns/{id}", "PATCH /me", "PATCH /products/{id}",
      "POST /brands", "POST /brands/{brandId}/campaigns", "POST /brands/{brandId}/products", "POST /campaigns/{id}/copy", "POST /me",
      "POST /waitlist",
      "PUT /campaigns/{id}/deadline", "PUT /campaigns/{id}/details", "PUT /campaigns/{id}/secrets",
      "GET /me/creator", "POST /me/creator", "PATCH /me/creator", "PUT /me/creator/formats", "PUT /me/creator/socials",
      "POST /me/creator/portfolio", "DELETE /me/creator/portfolio/{id}", "GET /me/creator/addresses", "POST /me/creator/addresses",
      "PATCH /me/creator/addresses/{id}", "DELETE /me/creator/addresses/{id}", "POST /me/creator/application",
      "GET /admin/applications", "POST /admin/creators/{id}/decision",
    ].sort());
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

describe("campaigns", () => {
  let brandId: string;
  let productId: string;
  let draftId: string;
  const brief = {
    title: "Morning coffee ritual",
    brief: "Show how you make your morning cup with our beans, start to first sip.",
    video_style: "routine",
    deadline: "2099-12-01",
    key_message: "Roasted weekly",
    reference_links: ["https://www.tiktok.com/@example/video/1"],
    logistics: { after: "keep" },
  };

  before(async () => {
    brandId = (await call("GET", "/brands", BRAND)).body[0].id;
    productId = (await call("POST", `/brands/${brandId}/products`, BRAND, { type: "physical", name: "Campaign beans" })).body.id;
  });

  test("the owner starts a draft and fills it in", async () => {
    const started = await call("POST", `/brands/${brandId}/campaigns`, BRAND, { title: "Morning coffee ritual" });
    assert.equal(started.status, 201);
    assertShape(started.body, "Campaign");
    assert.equal(started.body.status, "draft");
    assert.deepEqual([started.body.reference_links, started.body.logistics, started.body.events], [[], {}, []]);
    draftId = started.body.id;

    const saved = await call("PATCH", `/campaigns/${draftId}`, BRAND, { ...brief, product_id: productId, draft: { values: { title: "x" }, picks: [] } });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.deadline, "2099-12-01");
    assert.deepEqual(saved.body.logistics, { after: "keep" });
    assert.equal((await call("PATCH", `/campaigns/${draftId}`, BRAND, { deadline: null })).body.deadline, null);
    const drafts = (await call("GET", `/campaigns?brand_id=${brandId}&status=draft`, BRAND)).body;
    assert.ok(drafts.some((c: { id: string }) => c.id === draftId) && drafts.every((c: { status: string }) => c.status === "draft"));
  });

  test("drafts are checked field by field", async () => {
    const save = (body: object) => call("PATCH", `/campaigns/${draftId}`, BRAND, body);
    assert.equal((await save({ reference_links: ["https://a.com", "https://b.com", "https://c.com", "https://d.com"] })).status, 400);
    assert.equal((await save({ video_style: "dance" })).status, 400);
    assert.equal((await save({ deadline: "12/01/2099" })).status, 400);
    assert.equal((await save({ logistics: { after: "keep", shipping: "dhl" } })).status, 400);
    assert.equal((await save({ draft: { big: "x".repeat(21_000) } })).status, 400);
    // Another brand's product, refused by the database with words for people.
    await call("POST", "/brands", BRAND2, { name_en: "Other", industry: "other" });
    const otherBrand = (await call("GET", "/brands", BRAND2)).body[0].id;
    const otherProduct = (await call("POST", `/brands/${otherBrand}/products`, BRAND2, { type: "physical", name: "Theirs" })).body.id;
    const wrong = await save({ product_id: otherProduct });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.body.message, "Pick one of this brand's products");
  });

  test("only the owner sees and changes drafts", async () => {
    assert.equal((await call("POST", `/brands/${brandId}/campaigns`, BRAND2, { title: "Mine" })).status, 403);
    assert.equal((await call("GET", `/campaigns/${draftId}`, BRAND2)).status, 404);
    assert.equal((await call("PATCH", `/campaigns/${draftId}`, BRAND2, { title: "Mine" })).status, 404);
    assert.equal((await call("DELETE", `/campaigns/${draftId}`, BRAND2)).status, 404);
    assert.equal((await call("PUT", `/campaigns/${draftId}/secrets`, BRAND2, { code: "X" })).status, 404);
    assert.deepEqual((await call("GET", "/campaigns", CREATOR)).body, []);
  });

  test("secrets, and Run again", async () => {
    const secrets = await call("PUT", `/campaigns/${draftId}/secrets`, BRAND, { access_link: "https://example.com/app", code: "100CLIPS" });
    assert.equal(secrets.status, 200);
    assert.deepEqual(secrets.body, { access_link: "https://example.com/app", login_details: null, code: "100CLIPS" });
    const full = await call("GET", `/campaigns/${draftId}`, BRAND);
    assertShape(full.body, "CampaignWithSecrets");
    assert.equal(full.body.secrets.code, "100CLIPS");

    await call("PATCH", `/campaigns/${draftId}`, BRAND, { deadline: "2099-12-01" });
    const copy = await call("POST", `/campaigns/${draftId}/copy`, BRAND);
    assert.equal(copy.status, 201);
    assert.deepEqual([copy.body.copied_from, copy.body.title, copy.body.deadline, copy.body.draft], [draftId, brief.title, null, null]);
    assert.equal((await call("GET", `/campaigns/${copy.body.id}`, BRAND)).body.secrets.code, "100CLIPS");
    assert.equal((await call("DELETE", `/campaigns/${copy.body.id}`, BRAND)).status, 204);
    assert.equal((await call("GET", `/campaigns/${copy.body.id}`, BRAND)).status, 404);
  });

  test("a live campaign changes only through details and deadline", async () => {
    assert.equal((await call("PUT", `/campaigns/${draftId}/details`, BRAND, { key_message: "x" })).status, 409); // still a draft
    // Paying makes it live; checkout comes with the cart, so it's set directly here.
    await db.seed("update public.campaigns set status = 'live', launched_at = now(), draft = null where id = $1", [draftId]);
    // An offer waiting on it (offers come with checkout), from a creator made directly here.
    await db.seed("insert into public.accounts (id, role) values ($1, 'creator')", [CREATOR3]);
    await db.seed("insert into public.creators (id, handle, name_en) values ($1, 'third.one', 'Third')", [CREATOR3]);
    const [{ id: orderId }] = await db.select<{ id: string }>(
      "insert into public.orders (campaign_id, brand_id, creator_id, format, amount, deadline) values ($1, $2, $3, 'instagram_reel', 20, '2099-12-01') returning id",
      [draftId, brandId, CREATOR3],
    );

    assert.equal((await call("PATCH", `/campaigns/${draftId}`, BRAND, { title: "Changed" })).status, 409);
    assert.equal((await call("DELETE", `/campaigns/${draftId}`, BRAND)).status, 409);

    const edited = await call("PUT", `/campaigns/${draftId}/details`, BRAND, { key_message: "Roasted this week", must_include: "The label" });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.key_message, "Roasted this week");
    assert.deepEqual(edited.body.reference_links, []); // left out, so cleared
    assert.equal(edited.body.events[0].type, "details_edited");
    assert.deepEqual(edited.body.events[0].changes.map((c: { field: string }) => c.field), ["keyMessage", "references", "mustInclude"]);
    const same = await call("PUT", `/campaigns/${draftId}/details`, BRAND, { key_message: "Roasted this week", must_include: "The label" });
    assert.equal(same.body.events.length, 1); // nothing changed, nothing recorded

    assert.equal((await call("PUT", `/campaigns/${draftId}/deadline`, BRAND, { deadline: "2099-11-01" })).status, 400); // earlier
    const moved = await call("PUT", `/campaigns/${draftId}/deadline`, BRAND, { deadline: "2099-12-08" });
    assert.equal(moved.status, 200);
    assert.equal(moved.body.deadline, "2099-12-08");
    assert.equal(moved.body.events[1].type, "deadline_moved");
    // The waiting offer was on the old date, so it moved too, with a note in its history.
    assert.deepEqual(await db.select("select deadline from public.orders where id = $1", [orderId]), [{ deadline: "2099-12-08" }]);
    assert.deepEqual(
      await db.select("select type, actor, actor_id, data from public.order_events where order_id = $1", [orderId]),
      [{ type: "deadline_moved", actor: "brand", actor_id: BRAND, data: { from: "2099-12-01", to: "2099-12-08" } }],
    );
    // Once a creator accepts, the details are fixed.
    await db.seed("update public.orders set status = 'in_progress', accepted_at = now() where id = $1", [orderId]);
    const locked = await call("PUT", `/campaigns/${draftId}/details`, BRAND, { key_message: "Changed again" });
    assert.deepEqual([locked.status, locked.body.message], [409, "A creator already accepted"]);
    assert.equal((await call("PUT", `/campaigns/${draftId}/deadline`, BRAND2, { deadline: "2099-12-09" })).status, 404);
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
    assert.deepEqual(all.body[0].niches, ["beauty"]);
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

describe("creator sign-up and review", () => {
  const own = (file: string) => `${CREATOR2}/${file}`;
  const profile = () => call("GET", "/me/creator", CREATOR2);

  test("a creator account makes its profile; brands can't", async () => {
    assert.equal((await call("POST", "/me/creator", BRAND, { handle: "not.me", name_en: "X" })).status, 403);
    await call("POST", "/me", CREATOR2, { role: "creator", phone: "+97333999888" });
    assert.equal((await profile()).status, 404);
    const made = await call("POST", "/me/creator", CREATOR2, { handle: "sara.makes", name_en: "Sara", city: "Riffa", niches: ["food"] });
    assert.equal(made.status, 201);
    assertShape(made.body, "Creator");
    assert.deepEqual([made.body.status, made.body.country, made.body.niches], ["incomplete", "BH", ["food"]]); // niches is a list, not "{food}"
    assert.equal((await call("POST", "/me/creator", CREATOR2, { handle: "sara.two", name_en: "Sara" })).body.message, "You already have a creator profile");
    const taken = await call("PATCH", "/me/creator", CREATOR2, { handle: "dana.glow" });
    assert.deepEqual([taken.status, taken.body.message], [409, "That handle is taken"]);
    assert.equal((await call("PATCH", "/me/creator", CREATOR2, { handle: "Sara!" })).status, 400);
    assert.equal((await call("PATCH", "/me/creator", CREATOR2, { niches: ["food", "travel", "tech", "gaming"] })).status, 400);
  });

  test("sending too early says what's missing", async () => {
    const early = await call("POST", "/me/creator/application", CREATOR2, { intro_video_path: own("intro.mp4") });
    assert.equal(early.status, 400);
    assert.equal(early.body.message, "Still needed: a sample clip, a social account, your prices");
  });

  test("prices and socials replace the whole list", async () => {
    const dup = [{ format: "instagram_reel", price: 20 }, { format: "instagram_reel", price: 25 }];
    assert.equal((await call("PUT", "/me/creator/formats", CREATOR2, { formats: dup })).status, 400);
    assert.equal((await call("PUT", "/me/creator/formats", CREATOR2, { formats: [{ format: "tiktok_video", price: 0 }] })).status, 400);
    const prices = await call("PUT", "/me/creator/formats", CREATOR2, { formats: [{ format: "tiktok_video", price: 30 }, { format: "instagram_reel", price: 25.5 }] });
    assert.deepEqual(prices.body, [{ format: "tiktok_video", price: 30 }, { format: "instagram_reel", price: 25.5 }]); // in the enum's order
    assert.equal((await call("PUT", "/me/creator/socials", CREATOR2, { socials: [{ platform: "instagram", username: "@sara" }] })).status, 400);
    const socials = await call("PUT", "/me/creator/socials", CREATOR2, { socials: [{ platform: "tiktok", username: "sara.makes" }] });
    assert.deepEqual(socials.body, [{ platform: "tiktok", username: "sara.makes" }]);
  });

  test("samples: own uploads only, at most 3", async () => {
    const theirs = await call("POST", "/me/creator/portfolio", CREATOR2, { video_path: `${CREATOR}/s1.mp4` });
    assert.equal(theirs.status, 400);
    assert.match(theirs.body.message, /your own upload/);
    const ids = [];
    for (const n of [1, 2, 3]) ids.push((await call("POST", "/me/creator/portfolio", CREATOR2, { video_path: own(`s${n}.mp4`) })).body.id);
    const fourth = await call("POST", "/me/creator/portfolio", CREATOR2, { video_path: own("s4.mp4") });
    assert.deepEqual([fourth.status, fourth.body.message], [400, "At most 3 samples"]);
    assert.equal((await call("DELETE", `/me/creator/portfolio/${ids[2]}`, CREATOR2)).status, 204);
    assert.equal((await call("DELETE", `/me/creator/portfolio/${ids[2]}`, CREATOR2)).status, 404);
    assert.equal((await call("PATCH", "/me/creator", CREATOR2, { photo_path: `${CREATOR}/photo.jpg` })).status, 400);
    assert.equal((await call("PATCH", "/me/creator", CREATOR2, { photo_path: own("photo.jpg") })).status, 200);
  });

  test("addresses are private to the creator", async () => {
    assert.equal((await call("POST", "/me/creator/addresses", CREATOR2, { type: "home", address_text: "Villa 12, Riffa", latitude: 26.1 })).status, 400);
    const added = await call("POST", "/me/creator/addresses", CREATOR2, { type: "home", address_text: "Villa 12, Road 33, Riffa", latitude: 26.13, longitude: 50.55 });
    assert.equal(added.status, 201);
    assertShape(added.body, "Address");
    const renamed = await call("PATCH", `/me/creator/addresses/${added.body.id}`, CREATOR2, { label: "Parents' house", latitude: null, longitude: null });
    assert.deepEqual([renamed.body.label, renamed.body.latitude], ["Parents' house", null]);
    assert.equal((await call("PATCH", `/me/creator/addresses/${added.body.id}`, BRAND, { label: "x" })).status, 404);
    assert.equal((await call("GET", "/me/creator/addresses", CREATOR2)).body.length, 1);
  });

  test("send for review, then the admin decides", async () => {
    assert.equal((await call("POST", "/me/creator/application", CREATOR2, { intro_video_path: `${CREATOR}/intro.mp4` })).status, 400);
    const sent = await call("POST", "/me/creator/application", CREATOR2, { intro_video_path: own("intro.mp4") });
    assert.equal(sent.status, 201);
    assertShape(sent.body, "MyCreatorProfile");
    assert.equal(sent.body.creator.status, "pending");
    assert.deepEqual([sent.body.application.decision, sent.body.application.sample_paths.length], [null, 2]);
    assert.equal((await call("POST", "/me/creator/application", CREATOR2, {})).status, 409); // already sent

    assert.equal((await call("GET", "/admin/applications", BRAND)).status, 403);
    const waiting = await call("GET", "/admin/applications", ADMIN);
    assert.equal(waiting.status, 200);
    assert.equal(waiting.body[0].creator.handle, "sara.makes");
    assertShape(waiting.body[0], "PendingApplication");

    const decide = (body: object, who = ADMIN) => call("POST", `/admin/creators/${CREATOR2}/decision`, who, body);
    assert.equal((await decide({ decision: "approved" }, BRAND)).status, 403);
    assert.equal((await decide({ decision: "changes_requested" })).status, 400); // needs a note
    assert.equal((await decide({ decision: "changes_requested", note: "Add a daylight sample." })).status, 204);
    const told = (await profile()).body;
    assert.deepEqual([told.creator.status, told.application.note], ["changes_requested", "Add a daylight sample."]);

    assert.equal((await call("POST", "/me/creator/application", CREATOR2, {})).status, 201); // same intro again
    const intros = await db.select<{ p: string }>("select intro_video_path p from public.creator_approvals where creator_id = $1", [CREATOR2]);
    assert.deepEqual(intros.map((r) => r.p), [own("intro.mp4"), own("intro.mp4")]);
    assert.equal((await decide({ decision: "approved" })).status, 204);
    assert.equal((await decide({ decision: "approved" })).status, 409); // nothing waiting
    assert.deepEqual(
      await db.select("select admin_id, action, note from public.admin_log where target_id = $1 order by at", [CREATOR2]),
      [{ admin_id: ADMIN, action: "changes_requested", note: "Add a daylight sample." }, { admin_id: ADMIN, action: "creator_approved", note: null }],
    );
    const explore = (await call("GET", "/creators", BRAND)).body;
    assert.ok(explore.some((c: { handle: string }) => c.handle === "sara.makes"));
  });
});