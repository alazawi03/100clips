// Access and flow tests for the Supabase schema, run against PGlite (Postgres in WebAssembly) with
// stand-ins for what Supabase provides (roles, auth.uid(), the storage schema).
// Run: npm run test:db   (or: node supabase/tests/db.test.mjs [migrations dir])
// Every migration is applied except the cron one: PGlite has no pg_cron.
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
process.on("unhandledRejection", (e) => { console.log("ERROR:", e.message, e.where ?? ""); process.exit(2); });

const dir = process.argv[2] ?? fileURLToPath(new URL("../migrations", import.meta.url));
const db = new PGlite();

// What Supabase provides before our migrations run.
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  create schema auth; grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  create schema storage; grant usage on schema storage to anon, authenticated, service_role;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text, owner uuid);
  alter table storage.objects enable row level security;
  grant all on storage.objects to authenticated;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant execute on function storage.foldername(text) to authenticated;
`);

// Every migration in order, except pg_cron's (PGlite has no pg_cron).
for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql") && !f.endsWith("_cron.sql")).sort()) {
  await db.exec(readFileSync(`${dir}/${f}`, "utf8"));
  console.log("applied", f);
}

let pass = 0;
let fail = 0;
const ok = (cond, label) => {
  if (cond) pass++;
  else {
    fail++;
    console.log("FAIL:", label);
  }
};

async function as(uid, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec(uid === "service" ? "set local role service_role" : `set local role authenticated; select set_config('request.jwt.claim.sub', '${uid}', true);`);
    return tx.query(sql, params);
  });
}
async function denied(uid, sql, params, label) {
  try {
    const r = await as(uid, sql, params);
    // An RLS-filtered update/delete "succeeds" with 0 rows.
    ok(r.affectedRows === 0 && (r.rows ?? []).length === 0, `${label} (should fail, got ${JSON.stringify(r.rows)} / ${r.affectedRows})`);
  } catch {
    pass++;
  }
}
const one = async (uid, sql, params) => (await as(uid, sql, params)).rows[0];
const su = (sql, params) => db.query(sql, params);

const id = (n) => `00000000-0000-0000-0000-00000000000${n}`;
const [ADMIN, BRAND, CREATOR, CREATOR2, BRAND2] = [1, 2, 3, 4, 5].map(id);
for (const u of [ADMIN, BRAND, CREATOR, CREATOR2, BRAND2]) await su(`insert into auth.users values ($1)`, [u]);
await su(`insert into public.accounts (id, role) values ($1, 'admin')`, [ADMIN]);

// ---- Creator signs up
for (const [c, handle] of [[CREATOR, "dana.glow"], [CREATOR2, "omar.eats"]]) {
  await as(c, `insert into accounts (id, role, phone) values ($1, 'creator', '+97339001122')`, [c]);
  await as(c, `insert into creators (id, name_ar, name_en, handle, city, bio, gender, shows_face, niches, photo_path)
    values ($1, 'دانة', 'Dana', $2, 'Manama', 'Honest skincare', 'female', true, '{beauty}', $1::uuid::text || '/photo.jpg')`, [c, handle]);
  await as(c, `insert into creator_socials (creator_id, platform, username) values ($1, 'instagram', $2)`, [c, handle]);

  await as(c, `insert into creator_portfolio (creator_id, video_path) select $1, $1::uuid::text || '/s' || n || '.mp4' from generate_series(1, 3) n`, [c]);
  await denied(c, `insert into creator_portfolio (creator_id, video_path) values ($1, $1::uuid::text || '/s4.mp4') returning id`, [c], "a 4th sample");
  await as(c, `insert into creator_formats (creator_id, format, price) values ($1, 'instagram_reel', 35), ($1, 'tiktok_video', 30)`, [c]);
  await as(c, `insert into creator_addresses (creator_id, type, address_text, latitude, longitude) values ($1, 'home', 'Villa 12, Road 3, Block 338, Manama', 26.2235, 50.5876)`, [c]);
  await denied(c, `insert into creator_addresses (creator_id, address_text) values ($1, 'Somewhere in Riffa') returning id`, [c], "address without a type");
  await denied(c, `insert into creator_addresses (creator_id, type, address_text, latitude) values ($1, 'work', 'Office, Seef', 26.2) returning id`, [c], "pin with only latitude");
}
await denied(CREATOR, `update creators set status = 'approved' where id = $1 returning id`, [CREATOR], "creator approves self");
await denied(CREATOR, `update creators set completed_orders = 99 where id = $1 returning id`, [CREATOR], "creator edits order count");
await denied(CREATOR, `insert into creator_socials (creator_id, platform, username) values ($1, 'instagram', 'dana.again') returning creator_id`, [CREATOR], "two Instagram accounts");
await denied(CREATOR, `insert into creator_socials (creator_id, platform, username) values ($1, 'tiktok', 'x') returning creator_id`, [CREATOR2], "adds a social to another creator");
await denied(CREATOR, `insert into accounts (id, role) values ($1, 'admin')`, [CREATOR2], "self-made admin");

// Sending for review and the admin's verdict are API actions (server/test). Set up here as they leave it.
const apply = (c) => db.exec(`
  update creators set status = 'pending' where id = $1;
  insert into creator_approvals (creator_id, intro_video_path, sample_paths)
  values ($1, $1::uuid::text || '/intro.mp4', array(select video_path from creator_portfolio where creator_id = $1 order by created_at))`.replace(/\$1/g, `'${c}'`));
const decide = (c, decision, note = null) => db.exec(`
  update creator_approvals set decision = '${decision}', note = ${note ? `'${note}'` : "null"}, decided_by = '${ADMIN}', decided_at = now() where creator_id = '${c}' and decision is null;
  update creators set status = '${decision}', approved_at = case when '${decision}' = 'approved' then now() else approved_at end where id = '${c}'`);
await apply(CREATOR);
await apply(CREATOR2);
ok((await one(BRAND, `select count(*)::int n from creators`)).n === 0, "brand can't see pending creators");
await decide(CREATOR2, "changes_requested", "Samples have music");
await apply(CREATOR2);
await decide(CREATOR, "approved");
await decide(CREATOR2, "approved");
await denied(CREATOR, `update creators set status = 'approved' where id = $1 returning id`, [CREATOR2], "creator approves another");
{
  const apps = (await as(CREATOR2, `select decision, note, cardinality(sample_paths) n, decided_by from creator_approvals where creator_id = $1 order by submitted_at`, [CREATOR2])).rows;
  ok(apps.length === 2 && apps[0].decision === 'changes_requested' && apps[0].note === 'Samples have music' && apps[1].decision === 'approved' && apps[0].n === 3 && apps[1].decided_by === ADMIN, `each submission kept with its verdict (${JSON.stringify(apps)})`);
  ok((await one(CREATOR, `select count(*)::int n from creator_approvals where creator_id = $1`, [CREATOR2])).n === 0, "creators can't read others' applications");
  await denied(CREATOR2, `update creator_approvals set decision = 'approved' returning id`, [], "creator edits own application");
  await as(CREATOR2, `insert into storage.objects (bucket_id, name) values ('public-media', $1::uuid::text || '/new.jpg'), ('public-media', $1::uuid::text || '/s1.mp4')`, [CREATOR2]);
  await denied(CREATOR2, `delete from storage.objects where name = $1::uuid::text || '/s1.mp4' returning id`, [CREATOR2], "deletes a sample sent for review");
  ok((await as(CREATOR2, `delete from storage.objects where name = $1::uuid::text || '/new.jpg' returning id`, [CREATOR2])).rows.length === 1, "deletes an unrelated own file");
}
{
  const intros = (await as(CREATOR2, `select intro_video_path p from creator_approvals where creator_id = $1`, [CREATOR2])).rows;
  ok(intros.length === 2 && intros.every((r) => r.p === `${CREATOR2}/intro.mp4`), "resubmission reuses the previous intro");
}
await as(CREATOR, `update creator_socials set username = 'dana.new' where creator_id = $1 and platform = 'instagram'`, [CREATOR]);

// ---- Brand onboarding
for (const b of [BRAND, BRAND2]) {
  await as(b, `insert into accounts (id, role) values ($1, 'brand')`, [b]);
}
const acct = BRAND;
await denied(CREATOR, `insert into brands (account_id, name_en, industry) values ($1, 'x', 'other') returning id`, [CREATOR], "creator creates a brand");
await denied(CREATOR, `update accounts set role = 'admin' where id = $1 returning id`, [CREATOR], "change own role");
const brand = (await one(BRAND, `insert into brands (account_id, name_ar, industry, about) values ($1, 'محمصة المحرق', 'food_beverage', 'Coffee') returning id`, [acct])).id;
await as(BRAND, `insert into brand_registrations (brand_id, cr_number, vat_certificate_path) values ($1, '12345-1', $2::uuid::text || '/vat.pdf')`, [brand, BRAND]);
await denied(BRAND2, `update brand_registrations set cr_number = 'x' where brand_id = $1 returning brand_id`, [brand], "other brand edits registration");
ok((await one(BRAND2, `select count(*)::int n from brand_registrations`)).n === 0, "other brands can't read the CR");
ok((await one(CREATOR, `select count(*)::int n from brand_registrations`)).n === 0, "creators can't read the CR");
ok((await one(ADMIN, `select cr_number from brand_registrations where brand_id = $1`, [brand])).cr_number === '12345-1', "admins read the CR");

await as(BRAND, `update accounts set name_ar = 'محمصة', name_en = 'Roastery' where id = $1`, [BRAND]);
await denied(BRAND, `update accounts set name_ar = ' ', name_en = '' where id = $1 returning id`, [BRAND], "account name can't be blank");
await denied(BRAND, `insert into brands (account_id, industry) values ($1, 'other') returning id`, [acct], "brand needs a name");
const product = (await one(BRAND, `insert into products (brand_id, type, name, price, benefits, details) values ($1, 'physical', 'Cardamom coffee', 4.5, '{Fresh}', '{"value": 4.5, "size": "250g"}') returning id`, [brand])).id;
ok((await one(BRAND, `select count(*)::int n from bookable_creators`)).n === 2, "explore shows approved creators");
const fav = (await one(BRAND, `insert into creator_lists (account_id, is_favorites) values ($1, true) returning id`, [acct])).id;
await as(BRAND, `insert into creator_list_items (list_id, creator_id) values ($1, $2)`, [fav, CREATOR]);
await denied(BRAND, `insert into creator_list_items (list_id, creator_id) values ($1, $2) returning list_id`, [fav, CREATOR], "same creator twice in a list");
await denied(BRAND2, `insert into creator_list_items (list_id, creator_id) values ($1, $2) returning list_id`, [fav, CREATOR2], "adds to another account's list");
ok((await one(BRAND2, `select count(*)::int n from creator_list_items`)).n === 0, "list items are private");
await denied(BRAND, `insert into creator_lists (account_id, is_favorites) values ($1, true)`, [acct], "second favourites list");
ok((await one(BRAND2, `select count(*)::int n from creator_lists`)).n === 0, "lists are private");

// ---- Draft, top-up, checkout
const camp = (await one(BRAND, `insert into campaigns (brand_id, product_id, title, brief, video_style, deadline, logistics, draft)
  values ($1, $2, 'Morning coffee', 'Show the first sip and the branch sign clearly.', 'review', current_date + 10, '{"after":"return"}', '{"values":{}}') returning id`, [brand, product])).id;
await as(BRAND, `insert into campaign_secrets (campaign_id, code) values ($1, 'SIP10')`, [camp]);
await denied(BRAND2, `update campaigns set title = 'x' where id = $1 returning id`, [camp], "other brand edits draft");

const topUp = (await one(BRAND, `select start_top_up(50) id`)).id;
await denied(BRAND, `select confirm_payment($1, 'tap', 'x')`, [topUp], "brand confirms own payment");
await as("service", `select confirm_payment($1, 'tap', 'chg_1')`, [topUp]);
const bal = async () => Number((await one(BRAND, `select balance from balances`)).balance);
ok((await bal()) === 50, "top-up adds 50");

// Cart: one row per creator and format, quantity 1-3.
await as(BRAND, `insert into cart_items (account_id, creator_id, format) values ($1, $2, 'instagram_reel'), ($1, $2, 'tiktok_video')`, [acct, CREATOR]);
await denied(BRAND, `insert into cart_items (account_id, creator_id, format) values ($1, $2, 'instagram_reel') returning id`, [acct, CREATOR], "same creator and format twice in the cart");
await as(BRAND, `update cart_items set quantity = quantity + 1 where account_id = $1 and creator_id = $2 and format = 'instagram_reel'`, [acct, CREATOR]);
await denied(BRAND, `update cart_items set quantity = 4 where account_id = $1 returning id`, [acct], "quantity above 3");
await denied(BRAND2, `select * from cart_items`, [], "another account reads the cart");
await denied(BRAND, `select checkout($1, $2, true)`, [camp, JSON.stringify([{ creator_id: CREATOR, format: "instagram_reel" }, { creator_id: CREATOR, format: "tiktok_video" }])], "two videos from one creator in one campaign");

// 35 + 3.5 and 30 + 3 = 71.5: 50 from balance, 21.5 by card.
const pay = (await one(BRAND, `select checkout($1, $2, true) id`, [camp, JSON.stringify([
  { creator_id: CREATOR, format: "instagram_reel", note: "Focus on the first sip" },
  { creator_id: CREATOR2, format: "tiktok_video" },
])])).id;
const p = await one(BRAND, `select total, from_balance, by_card, status from payments where id = $1`, [pay]);
ok(Number(p.total) === 71.5 && Number(p.from_balance) === 50 && p.status === "pending", `checkout split ${JSON.stringify(p)}`);
ok((await one(BRAND, `select count(*)::int n from orders`)).n === 0, "no orders before the card is paid");
await as("service", `select confirm_payment($1, 'tap', 'chg_2')`, [pay]);
ok((await bal()) === 0, `balance used up (${await bal()})`);
ok((await one(BRAND, `select status from campaigns where id = $1`, [camp])).status === "live", "draft became live");
await denied(BRAND, `update campaigns set title = 'x' where id = $1 returning id`, [camp], "brand edits live campaign directly");
const order = (await one(CREATOR, `select id, amount from orders`)).id;
const order2 = (await one(CREATOR2, `select id from orders`)).id;
ok((await one(CREATOR, `select count(*)::int n from orders`)).n === 1, "creator sees only own order");
ok((await one(CREATOR, `select count(*)::int n from order_fees`)).n === 0, "creator can't see the fee");
ok(Number((await one(BRAND, `select fee from order_fees where order_id = $1`, [order])).fee) === 3.5, "brand sees the fee");
ok((await one(CREATOR, `select count(*)::int n from campaign_secrets`)).n === 0, "secrets hidden before accepting");
ok((await one(CREATOR, `select title from campaigns`)).title === "Morning coffee", "creator reads the brief");
ok((await one(BRAND2, `select count(*)::int n from orders`)).n === 0, "other brand sees no orders");

// ---- Edit details while nobody accepted, then accept
await denied(BRAND, `update campaigns set key_message = 'x' where id = $1 returning id`, [camp], "brand writes a live campaign directly");
await denied(CREATOR, `select accept_offer($1)`, [order], "accept physical without address");
const addr = (await one(CREATOR, `select id from creator_addresses`)).id;
await as(CREATOR, `select accept_offer($1, $2, '2026-10')`, [order, addr]);
ok((await one(BRAND, `select ship_to->>'phone' phone from orders where id = $1`, [order])).phone === "+97339001122", "brand gets address copy with phone");
ok((await one(BRAND, `select ship_to->>'type' t, (ship_to->>'latitude')::float lat from orders where id = $1`, [order])).lat === 26.2235, "address copy has type and pin");
ok((await one(BRAND, `select count(*)::int n from creator_addresses`)).n === 0, "addresses stay private");
ok((await one(CREATOR, `select code from campaign_secrets`))?.code === "SIP10", "secrets after accepting");
await denied(CREATOR, `update orders set status = 'approved' where id = $1 returning id`, [order], "creator writes order");
await denied(CREATOR, `select approve_order($1)`, [order], "creator approves own order");

// ---- Chat
const conv = (await one(CREATOR, `select id from conversations`)).id;
await as(BRAND, `insert into messages (conversation_id, sender, sender_id, body) values ($1, 'creator', $2, 'Hello Dana')`, [conv, BRAND]);
ok((await one(CREATOR, `select sender from messages`)).sender === "brand", "sender side set by the database");
await denied(BRAND2, `insert into messages (conversation_id, sender, sender_id, body) values ($1, 'brand', $2, 'hi')`, [conv, BRAND2], "outsider writes in chat");
await as(CREATOR, `insert into reports (conversation_id, reporter, reported_by, reason) values ($1, 'creator', $2, 'off_platform')`, [conv, CREATOR]);
await denied(CREATOR, `insert into reports (conversation_id, reporter, reported_by, reason) values ($1, 'creator', $2, 'payment')`, [conv, CREATOR], "order reason on a chat report");
await as(CREATOR, `update conversations set creator_read_at = now(), brand_read_at = '2000-01-01' where id = $1`, [conv]);
ok((await one(BRAND, `select brand_read_at from conversations where id = $1`, [conv])).brand_read_at === null, "a side can't move the other side's read marker");
await denied(CREATOR, `update conversations set brand_id = null where id = $1 returning id`, [conv], "change who is in a chat");
ok((await one(ADMIN, `select count(*)::int n from messages`)).n === 1, "admin reads reported chat");

// ---- Ship, receive, upload, revision, approve
await denied(CREATOR, `select submit_clip($1, $1::uuid::text || '/v1.mp4')`, [order], "upload before receiving");
await as(BRAND, `select mark_sent($1, 'Our driver, Thursday')`, [order]);
await as(CREATOR, `select confirm_received($1)`, [order]);
await as(CREATOR, `insert into storage.objects (bucket_id, name) values ('clips', $1::uuid::text || '/v1.mp4')`, [order]);
await denied(CREATOR2, `insert into storage.objects (bucket_id, name) values ('clips', $1::uuid::text || '/x.mp4')`, [order], "other creator uploads to order");
await as(CREATOR, `select submit_clip($1, $1::uuid::text || '/v1.mp4', 40, 80000000, 'Filmed at the branch', 'SPARK123', 30)`, [order]);
ok((await one(BRAND, `select ad_code, status from orders where id = $1`, [order])).status === "delivered", "delivered");
ok((await one(BRAND, `select count(*)::int n from storage.objects where bucket_id = 'clips'`)).n === 1, "brand can read the clip file");
ok((await one(BRAND2, `select count(*)::int n from storage.objects where bucket_id = 'clips'`)).n === 0, "other brand can't read the clip yet");
await denied(BRAND, `select request_revision($1, 'short')`, [order], "revision note too short");
await as(BRAND, `select request_revision($1, 'Show the cup in the first 3 seconds')`, [order]);
await denied(BRAND, `select request_revision($1, 'Show the cup in the first 3 seconds')`, [order], "second revision");
await as(CREATOR, `insert into storage.objects (bucket_id, name) values ('clips', $1::uuid::text || '/v2.mp4')`, [order]);
await as(CREATOR, `select submit_clip($1, $1::uuid::text || '/v2.mp4', 38)`, [order]);
await as(BRAND, `select approve_order($1, 5::smallint, 'Great clip')`, [order]);
await denied(BRAND, `select rate_order($1, 1::smallint)`, [order], "change a rating");
const creatorBal = async (c) => Number((await one(c, `select balance from balances`))?.balance ?? 0);
ok((await creatorBal(CREATOR)) === 35, "creator earned 35");
ok((await one(BRAND2, `select count(*)::int n from public_clips`)).n === 1, "approved clip visible to other brands");
ok((await one(BRAND2, `select count(*)::int n from storage.objects where bucket_id = 'clips'`)).n === 1, "and its file (latest version)");
ok((await one(BRAND, `select rating from creator_ratings where creator_id = $1`, [CREATOR])).rating == 5, "rating view");
ok((await one(BRAND2, `select review from creator_reviews where creator_id = $1`, [CREATOR])).review === "Great clip", "other brands read the review");
ok((await one(BRAND2, `select count(*)::int n from orders`)).n === 0, "but not the order");
ok((await one(BRAND, `select count(*)::int n from order_clips where order_id = $1`, [order])).n === 2, "two versions kept");
await denied(CREATOR, `insert into order_clips (order_id, version, video_path) values ($1, 2, 'x/y.mp4') returning id`, [order], "creator writes a clip row directly");
ok((await one(BRAND2, `select count(*)::int n from order_clips`)).n === 0, "other brands can't read order clips");
ok((await one(BRAND2, `select video_path from public_clips`)).video_path === `${order}/v2.mp4`, "public clip is the approved version");
ok((await one(BRAND, `select completed_orders from creators where id = $1`, [CREATOR])).completed_orders === 1, "completed count");
await as(BRAND, `select mark_returned($1)`, [order]);
await as(CREATOR, `select mark_approval_seen($1)`, [order]);

// ---- Expiry refunds the second offer and closes nothing (one order approved)
await su(`update orders set created_at = now() - interval '97 hours' where id = $1`, [order2]);
await denied(CREATOR2, `select accept_offer($1, null)`, [order2], "accept an expired offer");
ok((await as("service", `select expire_offers() n`)).rows[0].n === 1, "one offer expired");
ok((await bal()) === 33, `refund 33 to balance (${await bal()})`);
ok((await one(BRAND, `select status from campaigns where id = $1`, [camp])).status === "live", "campaign stays live");

// ---- Invite onto the live campaign, auto-approve
const pay2 = (await one(BRAND, `select checkout($1, $2, true) id`, [camp, JSON.stringify([{ creator_id: CREATOR2, format: "tiktok_video" }])])).id;
ok((await one(BRAND, `select status from payments where id = $1`, [pay2])).status === "paid", "balance-only checkout pays at once");
const order3 = (await one(CREATOR2, `select id from orders where status = 'pending'`)).id;
const addr2 = (await one(CREATOR2, `select id from creator_addresses`)).id;
await as(CREATOR2, `select accept_offer($1, $2)`, [order3, addr2]);
await as(BRAND, `select mark_sent($1)`, [order3]);
await as(CREATOR2, `select confirm_received($1)`, [order3]);
await as(CREATOR2, `insert into storage.objects (bucket_id, name) values ('clips', $1::uuid::text || '/v1.mp4')`, [order3]);
await as(CREATOR2, `select submit_clip($1, $1::uuid::text || '/v1.mp4')`, [order3]);
await su(`update orders set delivered_at = now() - interval '8 days' where id = $1`, [order3]);
ok((await as("service", `select auto_approve_orders() n`)).rows[0].n === 1, "auto-approved after 7 days");
ok((await one(BRAND, `select approved_by from orders where id = $1`, [order3])).approved_by === "system", "approved by system");

// ---- Deadlines ("Extend deadline" is an API action; this is what it leaves behind.)
await su(`update campaigns set deadline = current_date + 20 where id = $1`, [camp]);

// ---- Money out
await denied(BRAND, `select request_withdrawal(10)`, [], "withdraw without a bank account");
await as(BRAND, `select set_bank_account('Muharraq Roastery WLL', 'BH67 BMAG 0000 1299 1234 56')`);
await as("service", `select confirm_payment($1, 'tap', 'chg_3')`, [(await one(BRAND, `select start_top_up(40) id`)).id]);
const balBefore = await bal();
const wd = (await one(BRAND, `select request_withdrawal(10) id`)).id;
await denied(BRAND, `select request_withdrawal(1000)`, [], "withdraw more than the balance");
ok((await bal()) === balBefore - 10, "withdrawal leaves the balance");
await as(ADMIN, `select reject_withdrawal($1, 'Name does not match')`, [wd]);
ok((await bal()) === balBefore, "rejected withdrawal comes back");
const wd2 = (await one(BRAND, `select request_withdrawal(5) id`)).id;
await as(ADMIN, `select send_withdrawal($1, 'BMAG-1')`, [wd2]);
ok((await one(BRAND, `select iban from bank_transfers where id = $1`, [wd2])).iban === "BH67BMAG00001299123456", "IBAN copied when sent");

await denied(ADMIN, `select mark_payout_paid($1, array[$2]::uuid[], 'TRF1')`, [CREATOR, order], "payout without creator bank");
await as(CREATOR, `select set_bank_account('Dana Al Sayed', 'BH67BMAG00001299654321')`);
await as(CREATOR, `select set_bank_account('Dana Al Sayed', 'BH67BMAG00001299999999')`);
ok((await one(ADMIN, `select count(*)::int n from bank_accounts where account_id = $1`, [CREATOR])).n === 2, "bank history kept");
await as(ADMIN, `select mark_payout_paid($1, array[$2]::uuid[], 'TRF1')`, [CREATOR, order]);
await denied(ADMIN, `select mark_payout_paid($1, array[$2]::uuid[], 'TRF2')`, [CREATOR, order], "pay the same order twice");
ok((await one(CREATOR, `select count(*)::int n from payout_orders where order_id = $1`, [order])).n === 1, "creator sees which orders were paid");
ok((await one(BRAND, `select count(*)::int n from payout_orders`)).n === 0, "brands can't see payouts");
await denied(ADMIN, `insert into payout_orders (transfer_id, order_id) select id, $1 from bank_transfers where kind = 'payout' limit 1 returning order_id`, [order], "an order in two payouts");
ok((await creatorBal(CREATOR)) === 0, "creator balance after payout");
ok((await one(CREATOR, `select iban from bank_transfers where kind = 'payout'`)).iban === "BH67BMAG00001299999999", "payout to current IBAN");
ok((await one(CREATOR, `select count(*)::int n from bank_transfers where kind = 'withdrawal'`)).n === 0, "creator sees no brand withdrawals");

// ---- Reports, support, suspension
await as(BRAND, `insert into reports (order_id, reporter, reported_by, reason, details) values ($1, 'brand', $2, 'product_issue', 'Cup was damaged')`, [order, BRAND]);
await denied(BRAND, `insert into reports (order_id, reporter, reported_by, reason) values ($1, 'brand', $2, 'other')`, [order, BRAND], "second open report");
await as(CREATOR, `insert into reports (order_id, reporter, reported_by, reason) values ($1, 'creator', $2, 'brand_conduct')`, [order, CREATOR]);
await denied(CREATOR, `insert into reports (order_id, reporter, reported_by, reason) values ($1, 'brand', $2, 'other')`, [order3, CREATOR], "report as the other side");
const rep = (await one(ADMIN, `select id from reports where reporter = 'brand'`)).id;
await as(ADMIN, `select resolve_report($1, 'Refunded the cup')`, [rep]);
const sup = (await one(CREATOR, `insert into conversations (brand_id, creator_id) values (null, $1) returning id`, [CREATOR])).id;
await as(ADMIN, `insert into messages (conversation_id, sender, sender_id, body) values ($1, 'brand', $2, 'Was the bank change you?')`, [sup, ADMIN]);
await as(CREATOR, `insert into messages (conversation_id, sender, sender_id, body) values ($1, 'admin', $2, 'Yes')`, [sup, CREATOR]);
ok((await as(CREATOR, `select sender from messages where conversation_id = $1 order by created_at, sender`, [sup])).rows.map((r) => r.sender).sort().join() === "admin,creator", "support chat sides set by the database");
ok((await one(BRAND, `select count(*)::int n from conversations where brand_id is null`)).n === 0, "brands can't see support chats");
await denied(CREATOR2, `insert into conversations (brand_id, creator_id) values (null, $1)`, [CREATOR], "open someone else's support chat");

await as(ADMIN, `select suspend('creator', $1, 'Off-platform deals')`, [CREATOR2]);
ok((await one(BRAND2, `select count(*)::int n from bookable_creators`)).n === 1, "suspended creator hidden");
ok((await one(BRAND, `select count(*)::int n from creators where id = $1`, [CREATOR2])).n === 1, "but still visible to brands they worked with");
await as(ADMIN, `select suspend('account', $1, 'Chargebacks')`, [acct]);
const c2 = (await one(BRAND, `insert into campaigns (brand_id, product_id, title, brief, video_style) values ($1, $2, 'Again', 'Same as before, a new season of the coffee.', 'ad') returning id`, [brand, product])).id;
await denied(BRAND, `select checkout($1, $2, true)`, [c2, JSON.stringify([{ creator_id: CREATOR, format: "instagram_reel" }])], "suspended account pays");
ok((await one(ADMIN, `select count(*)::int n from admin_log`)).n === 6, "admin actions logged"); // creator decisions are logged by the API

// ---- Waitlist and anon
// Joining is an API action (as the service role); the table refuses junk on its own.
await as("service", `insert into waitlist_requests (country, email) values ('SA', 'reem@example.com')`);
await denied("service", `insert into waitlist_requests (country, phone) values ('SA', 'notacontact') returning id`, [], "waitlist rejects junk");
ok((await one(ADMIN, `select count(*)::int n from waitlist_requests`)).n === 1, "admins read the waitlist");
await db.transaction(async (tx) => {
  await tx.exec("set local role anon");
  let blocked = false;
  try { await tx.query(`insert into waitlist_requests (country, email) values ('SA', 'x@y.com')`); } catch { blocked = true; }
  ok(blocked, "anon can't insert into the waitlist directly");
}).catch(() => {});
await denied("00000000-0000-0000-0000-000000000009", `select * from orders`, [], "stranger reads orders");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);








