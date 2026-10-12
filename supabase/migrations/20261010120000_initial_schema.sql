-- 100clips schema v2: the brand dashboard (100clips-brands), the creator app (100clips-creators)
-- and the admin panel share this database.
--
-- Conventions
--   * Money is BHD, which has 3 decimal places (fils): numeric(10,3).
--   * Names typed in two boxes (account, creator and brand names) are two columns, name_ar and name_en,
--     with at least one filled in. Everything typed in one box (bios, briefs, product text) is plain text.
--   * Files are Supabase Storage paths, not URLs (see the storage migration).
--   * Nobody writes orders, money or statuses directly. The apps call the functions at the end of this
--     file, which check who is asking and what state things are in, then write the history.
--   * Balances are never stored: they are sums of the ledger.
--
-- Rules from the review (October 2026)
--   * One order = one video in one format. One revision included. 10% service fee on top, paid by the brand.
--   * Offers expire after 96 hours; clips not reviewed within 7 days are approved automatically.
--   * Refunds go to the brand's balance. Creators are paid out by 100clips (no creator withdrawals).
--   * Chat opens when a creator accepts an order, never before.
--   * Creators apply with an intro video, samples, city, niches and prices; brands see them once
--     approved, with a photo and at least one sample, in an active market and not suspended.

-- ---------- Enums ----------

create type public.user_role as enum ('creator', 'brand', 'admin');
-- Who did something. "system" is the scheduled jobs (offer expiry, auto-approval).
create type public.actor as enum ('creator', 'brand', 'admin', 'system');
create type public.niche as enum ('general', 'beauty', 'food', 'fashion', 'family', 'fitness', 'travel', 'tech', 'gaming');
create type public.gender as enum ('female', 'male');
create type public.content_format as enum ('tiktok_video', 'instagram_reel', 'instagram_story');
create type public.social_platform as enum ('instagram', 'tiktok');
create type public.address_type as enum ('home', 'work');
-- incomplete: signing up. pending: sent for review. The admin moves it on from there.
create type public.creator_status as enum ('incomplete', 'pending', 'changes_requested', 'rejected', 'approved');
create type public.industry as enum ('food_beverage', 'fashion', 'tech', 'real_estate', 'automotive', 'health', 'education', 'home_living', 'other');
create type public.product_type as enum ('physical', 'app', 'service', 'venue');
create type public.video_style as enum ('ad', 'review', 'routine', 'unboxing', 'howto', 'other');
-- Only draft and cancelled are stored. Pending / in progress / completed come from the orders.
create type public.campaign_status as enum ('draft', 'live', 'cancelled');
create type public.order_status as enum ('pending', 'in_progress', 'delivered', 'approved', 'declined', 'cancelled');
create type public.decline_reason as enum ('busy', 'not_my_niche', 'other', 'expired');
create type public.order_event_type as enum (
  'offered', 'accepted', 'declined', 'expired', 'cancelled', 'sent', 'received', 'uploaded',
  'revision_requested', 'approved', 'returned', 'ad_code_added', 'deadline_moved', 'deadline_passed'
);
create type public.payment_kind as enum ('checkout', 'top_up');
create type public.payment_status as enum ('pending', 'paid', 'failed');
-- Positive amounts add to the balance, negative ones take from it.
--   brand:   top_up +, card_payment + (the card part of a checkout), charge - (per order), refund +,
--            withdrawal -, withdrawal_returned +
--   creator: earning + (per approved order), payout -
create type public.ledger_type as enum ('top_up', 'card_payment', 'charge', 'refund', 'earning', 'payout', 'withdrawal', 'withdrawal_returned', 'adjustment');
create type public.transfer_kind as enum ('withdrawal', 'payout');
create type public.transfer_status as enum ('requested', 'sent', 'rejected');
-- Chats: off_platform, abuse, spam, other. Orders: the rest, and other.
create type public.report_reason as enum ('off_platform', 'abuse', 'spam', 'not_delivered', 'not_as_agreed', 'product_issue', 'creator_conduct', 'brand_conduct', 'payment', 'other');
create type public.report_status as enum ('open', 'resolved');
create type public.admin_action as enum (
  'creator_approved', 'changes_requested', 'creator_rejected', 'suspended', 'unsuspended',
  'login_reset', 'deadline_extended', 'order_cancelled', 'payout_sent', 'withdrawal_sent', 'withdrawal_rejected',
  'report_resolved'
);

-- ---------- Helpers ----------

-- Kept out of the API schema so these can't be called as RPCs.
create schema private;
grant usage on schema private to authenticated;

-- A name in Arabic and English with at least one of them filled in.
create function public.has_name(ar text, en text) returns boolean
language sql immutable set search_path = '' as $$
  select length(trim(coalesce(ar, ''))) > 0 or length(trim(coalesce(en, ''))) > 0
$$;

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Business constants, in one place.
create function private.fee_rate() returns numeric language sql immutable as $$ select 0.10 $$;
create function private.offer_window() returns interval language sql immutable as $$ select interval '96 hours' $$;
create function private.auto_approve_after() returns interval language sql immutable as $$ select interval '7 days' $$;
-- Countries 100clips runs in (lib/data/markets.ts in the brand app). Everywhere else is the waitlist:
-- creators can sign up there, brands can't find them, and brands can't register there.
create function private.is_active_market(country text) returns boolean language sql immutable as $$ select country = any(array['BH']) $$;

-- ---------- People ----------

-- Everyone who signs in: creators, brand owners and the 100clips team. Email and phone sign-in live
-- in auth.users. For a brand owner this row is also the brand account: one login, one balance,
-- several brands. (Several people per brand account would come later, as an account_members table.)
create table public.accounts (
  id uuid primary key references auth.users on delete cascade,
  role public.user_role not null,
  -- Brand owners: the account name, in both languages. Creators keep their name on creators.
  name_ar text,
  name_en text,
  phone text,
  -- Notifications newer than this show as new (the bell).
  notifications_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check ((name_ar is null and name_en is null) or public.has_name(name_ar, name_en))
);

-- "Not in Bahrain?" in the creator app. The sheet has one box ("Your number or email");
-- join_waitlist puts it in email when it has an @, otherwise in phone.
create table public.waitlist_requests (
  id uuid primary key default gen_random_uuid(),
  country char(2) not null check (country ~ '^[A-Z]{2}$'),
  email text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  phone text check (phone ~ '^\+?[0-9]{6,15}$'),
  created_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);


create table public.creators (
  id uuid primary key references public.accounts on delete cascade,
  status public.creator_status not null default 'incomplete',
  name_ar text,
  name_en text,
  handle text not null unique check (handle ~ '^[a-z0-9._]{2,30}$'),
  country char(2) not null default 'BH' check (country ~ '^[A-Z]{2}$'),
  -- Typed freely in the profile.
  city text,
  bio text check (length(bio) <= 160),
  gender public.gender,
  shows_face boolean,
  niches public.niche[] not null default '{}' check (cardinality(niches) <= 3),
  photo_path text,
  approved_at timestamptz,
  -- Kept up to date when orders are approved, because orders are private.
  completed_orders integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (public.has_name(name_ar, name_en))
);
create index creators_status_idx on public.creators (status);
create index creators_niches_idx on public.creators using gin (niches);

-- What a creator offers, with a price per clip (what the creator gets; brands see it plus the fee).
create table public.creator_formats (
  creator_id uuid not null references public.creators on delete cascade,
  format public.content_format not null,
  price numeric(10, 3) not null check (price > 0),
  primary key (creator_id, format)
);

-- The creator's Instagram / TikTok usernames, one per platform. At least one is needed to apply.
create table public.creator_socials (
  creator_id uuid not null references public.creators on delete cascade,
  platform public.social_platform not null,
  username text not null check (username ~ '^[A-Za-z0-9._]{1,30}$'),
  primary key (creator_id, platform)
);

-- Up to 3 sample clips: reviewed at sign-up, then shown on the profile, oldest first.
create table public.creator_portfolio (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators on delete cascade,
  video_path text not null,
  created_at timestamptz not null default now()
);
create index creator_portfolio_creator_id_idx on public.creator_portfolio (creator_id);

create function private.limit_portfolio() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.creator_portfolio where creator_id = new.creator_id) >= 3 then
    raise exception 'At most 3 samples' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger creator_portfolio_limit before insert on public.creator_portfolio for each row execute function private.limit_portfolio();

-- Delivery addresses, up to 5. Private: brands get a copy on the order when the creator accepts.
-- The sheet: type chips (home / work), an optional name under them ("Parents' house"), the address
-- text, and a pin on the map.
create table public.creator_addresses (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators on delete cascade,
  type public.address_type not null,
  label text check (length(trim(label)) between 1 and 40),
  address_text text not null check (length(address_text) between 5 and 300),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);
create index creator_addresses_creator_id_idx on public.creator_addresses (creator_id);

create function private.limit_addresses() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.creator_addresses where creator_id = new.creator_id) >= 5 then
    raise exception 'At most 5 addresses' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger creator_addresses_limit before insert on public.creator_addresses for each row execute function private.limit_addresses();

-- Each time a creator sends their application: the intro and samples as they were, and the admin's
-- verdict on that version. The admin compares it with the one before; the creator sees the latest note.
-- Files named here are never deleted (see the storage migration).
create table public.creator_approvals (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators on delete cascade,
  intro_video_path text not null,
  sample_paths text[] not null check (cardinality(sample_paths) between 1 and 3),
  submitted_at timestamptz not null default now(),
  -- Null while it waits.
  decision public.creator_status check (decision in ('approved', 'changes_requested', 'rejected')),
  note text,
  decided_by uuid references public.accounts,
  decided_at timestamptz,
  check ((decision is null) = (decided_at is null)),
  check (decision is null or decision = 'approved' or length(trim(coalesce(note, ''))) > 0)
);
create index creator_approvals_creator_id_idx on public.creator_approvals (creator_id, submitted_at desc);
create unique index creator_approvals_one_waiting on public.creator_approvals (creator_id) where decision is null;

-- ---------- Brands and products ----------

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts on delete cascade,
  name_ar text,
  name_en text,
  logo_path text,
  industry public.industry not null,
  about text check (length(about) <= 300),
  website text,
  instagram text,
  tiktok text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (public.has_name(name_ar, name_en))
);
create index brands_account_id_idx on public.brands (account_id);

-- A brand's registration in Bahrain, both optional. Kept apart from brands so only the owner and
-- admins see it; the VAT certificate file sits in the private-docs bucket.
create table public.brand_registrations (
  brand_id uuid primary key references public.brands on delete cascade,
  cr_number text,
  vat_certificate_path text,
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands on delete cascade,
  type public.product_type not null,
  name text not null check (length(trim(name)) > 0),
  photos text[] not null default '{}',
  description text,
  -- What customers pay. Venues have none. (A physical product's unit value is in details.)
  price numeric(10, 3) check (price >= 0),
  benefits text[] not null default '{}' check (cardinality(benefits) <= 5),
  -- [{ "question": "...", "answer": "..." }]
  concerns jsonb not null default '[]' check (jsonb_typeof(concerns) = 'array'),
  -- The fields for the type: physical {value, size}, app {downloadLink, platforms},
  -- service {delivery}, venue {kind, location, hours, mapUrl}.
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets campaigns check their product belongs to their brand.
  unique (id, brand_id)
);
create index products_brand_id_idx on public.products (brand_id);

-- ---------- Finding creators ----------

-- One row per creator and format, with how many videos. Adding the same format again bumps quantity.
-- Checkout empties it. (Checkout still takes one video per creator per campaign for now.)
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts on delete cascade,
  creator_id uuid not null references public.creators on delete cascade,
  format public.content_format not null,
  quantity smallint not null default 1 check (quantity between 1 and 3),
  added_at timestamptz not null default now(),
  unique (account_id, creator_id, format)
);

-- "Favourites" (exactly one per account, made on first use) and the brand's own named lists.
create table public.creator_lists (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts on delete cascade,
  name text not null default '',
  is_favorites boolean not null default false,
  created_at timestamptz not null default now(),
  check (is_favorites or length(trim(name)) > 0)
);
create unique index creator_lists_one_favorites on public.creator_lists (account_id) where is_favorites;
create index creator_lists_account_id_idx on public.creator_lists (account_id);

-- The creators in each list (the page shows the newest first). A deleted creator drops out.
create table public.creator_list_items (
  list_id uuid not null references public.creator_lists on delete cascade,
  creator_id uuid not null references public.creators on delete cascade,
  added_at timestamptz not null default now(),
  primary key (list_id, creator_id)
);
create index creator_list_items_creator_id_idx on public.creator_list_items (creator_id);


-- ---------- Campaigns ----------

-- One brief for one product, sent to one or more creators. Drafts can be half filled in;
-- once paid ("live") the brief is complete.
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands on delete cascade,
  status public.campaign_status not null default 'draft',
  product_id uuid,
  title text,
  brief text,
  video_style public.video_style,
  -- When clips are due. Each order gets a copy, which an admin can move for one creator.
  deadline date,
  key_message text,
  reference_links text[] not null default '{}' check (cardinality(reference_links) <= 3),
  must_include text,
  avoid text,
  -- How the product reaches creators. physical {after: keep|return}, venue {visitFrom, visitTo, included}.
  -- The app link, test account and promo code are in campaign_secrets.
  logistics jsonb not null default '{}' check (jsonb_typeof(logistics) = 'object'),
  -- A draft's form as it was saved (every field by name) and its picked creators.
  draft jsonb check (draft is null or jsonb_typeof(draft) = 'object'),
  -- "Run again": the campaign this one was copied from.
  copied_from uuid references public.campaigns on delete set null,
  -- Changes after paying, oldest first: {type: details_edited, at, changes: [{field, before, after}]}
  -- (only before anyone accepted) or {type: deadline_moved, at, from, to} (later only).
  events jsonb not null default '[]' check (jsonb_typeof(events) = 'array'),
  created_at timestamptz not null default now(),
  launched_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz not null default now(),
  foreign key (product_id, brand_id) references public.products (id, brand_id) on delete restrict,
  check (status = 'draft' or (product_id is not null and length(trim(title)) > 0 and length(trim(brief)) >= 20 and video_style is not null))
);
create index campaigns_brand_id_idx on public.campaigns (brand_id, status);

-- Only for creators who accepted: hidden from offers that are still waiting.
create table public.campaign_secrets (
  campaign_id uuid primary key references public.campaigns on delete cascade,
  -- App download link today; a booking page for a venue or service later.
  access_link text,
  -- An app's test account (username and password).
  login_details text,
  -- A promo, voucher or booking code.
  code text
);


-- ---------- Money in ----------

-- One card checkout or wallet top-up. The balance part (if any) and the card part make up the total.
-- Orders are created only once the payment is paid (straight away when the balance covers it all).
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts on delete restrict,
  kind public.payment_kind not null,
  campaign_id uuid references public.campaigns on delete restrict,
  total numeric(10, 3) not null check (total > 0),
  from_balance numeric(10, 3) not null default 0 check (from_balance >= 0),
  by_card numeric(10, 3) not null default 0 check (by_card >= 0),
  -- Checkout: [{creator_id, format, note}], turned into orders when paid.
  picks jsonb,
  status public.payment_status not null default 'pending',
  -- The card provider is still to be chosen.
  provider text,
  provider_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check (total = from_balance + by_card),
  check (kind = 'top_up' or (campaign_id is not null and picks is not null)),
  check (kind = 'checkout' or from_balance = 0)
);
create index payments_account_id_idx on public.payments (account_id, created_at desc);

-- ---------- Orders ----------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Shown as "ord-1043".
  number bigint generated always as identity (start with 1001) unique,
  campaign_id uuid not null references public.campaigns on delete restrict,
  brand_id uuid not null references public.brands on delete restrict,
  creator_id uuid not null references public.creators on delete restrict,
  payment_id uuid references public.payments on delete restrict,
  format public.content_format not null,
  -- The creator's price, fixed when ordered. The fee is in order_fees (creators never see it).
  amount numeric(10, 3) not null check (amount > 0),
  -- The brand's note to this creator, sent with the offer.
  note text,
  status public.order_status not null default 'pending',
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Answer
  accepted_at timestamptz,
  -- Which wording of the rules the creator agreed to.
  terms_version text,
  -- A copy of the creator's address and phone, made on accepting (physical products only).
  ship_to jsonb,
  decline_reason public.decline_reason,
  decline_note text,
  declined_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by public.actor,

  -- Shipping (physical products)
  sent_at timestamptz,
  -- Instead of a tracking number: "with our driver, Thursday".
  ship_note text check (length(ship_note) <= 200),
  received_at timestamptz,
  returned_at timestamptz,

  -- Clip and review
  delivered_at timestamptz,
  revision_requested_at timestamptz,
  revision_note text,
  approved_at timestamptz,
  -- brand, or system when approved automatically.
  approved_by public.actor,
  ad_code text,
  ad_code_expires_at timestamptz,
  -- Whether other brands can see the approved clip on the creator's card.
  clip_public boolean not null default true,
  views integer check (views >= 0),
  views_updated_at timestamptz,
  -- The creator saw the approval celebration.
  creator_seen_approval_at timestamptz,
  -- The brand's stars and comment, given when approving (or stars later). Locked once given.
  rating smallint check (rating between 1 and 5),
  review text check (length(review) <= 500),
  rated_at timestamptz,

  unique (id, brand_id, creator_id),
  check (status <> 'declined' or decline_reason is not null),
  check (status <> 'cancelled' or cancelled_by is not null)
);
create index orders_brand_id_idx on public.orders (brand_id, status);
create index orders_creator_id_idx on public.orders (creator_id, status);
create index orders_campaign_id_idx on public.orders (campaign_id);
-- One live order per creator per campaign.
create unique index orders_one_per_creator on public.orders (campaign_id, creator_id) where status not in ('declined', 'cancelled');

-- Each clip the creator uploads for an order: version 1, and version 2 after the revision.
create table public.order_clips (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  version smallint not null check (version in (1, 2)),
  -- In the clips bucket, under the order's folder.
  video_path text not null,
  duration_sec integer check (duration_sec > 0),
  size_bytes bigint check (size_bytes > 0),
  -- The creator's note for the brand.
  note text,
  uploaded_at timestamptz not null default now(),
  unique (order_id, version)
);
create index order_clips_video_path_idx on public.order_clips (video_path);

-- 100clips' service fee on each order. Brands and admins only.
create table public.order_fees (
  order_id uuid primary key references public.orders on delete cascade,
  fee numeric(10, 3) not null check (fee >= 0)
);

-- What happened to an order, in order. Both apps' timelines and notifications come from here.
create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  type public.order_event_type not null,
  actor public.actor not null,
  actor_id uuid references public.accounts,
  data jsonb not null default '{}',
  at timestamptz not null default now()
);
create index order_events_order_id_idx on public.order_events (order_id, at);

-- ---------- Money ----------

-- One bank account per owner (a creator or a brand account) at a time; replaced ones stay as
-- history (the admin sees changes).
create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts on delete cascade,
  holder_name text not null check (length(trim(holder_name)) > 0),
  iban text not null check (iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$'),
  created_at timestamptz not null default now(),
  replaced_at timestamptz
);
create unique index bank_accounts_current on public.bank_accounts (account_id) where replaced_at is null;

-- Money 100clips sends to a bank account by hand: a brand's withdrawal from its balance (it leaves the
-- balance when requested; sent or rejected later), or a payout to a creator for approved orders.
create table public.bank_transfers (
  id uuid primary key default gen_random_uuid(),
  kind public.transfer_kind not null,
  -- Withdrawals: the brand account. Payouts: the creator.
  account_id uuid not null references public.accounts on delete restrict,
  amount numeric(10, 3) not null check (amount > 0),
  status public.transfer_status not null default 'requested',
  requested_at timestamptz not null default now(),
  sent_at timestamptz,
  bank_ref text,
  -- The bank account it went to, copied when sent.
  iban text,
  holder_name text,
  -- Why a withdrawal was rejected, shown to the brand.
  reject_note text,
  handled_by uuid references public.accounts,
  check (
    (kind = 'withdrawal' and amount >= 1)
    or (kind = 'payout' and status = 'sent')
  ),
  check (status <> 'sent' or (bank_ref is not null and iban is not null)),
  check (status <> 'rejected' or reject_note is not null)
);
create index bank_transfers_account_id_idx on public.bank_transfers (account_id, requested_at desc);

-- The approved orders a payout covers. An order can be paid out only once.
create table public.payout_orders (
  transfer_id uuid not null references public.bank_transfers on delete restrict,
  order_id uuid not null unique references public.orders on delete restrict,
  primary key (transfer_id, order_id)
);
-- Every movement of money, for a brand account or a creator. Balances are its sums.
create table public.ledger (
  id uuid primary key default gen_random_uuid(),
  -- A brand account or a creator (their account id).
  account_id uuid not null references public.accounts on delete restrict,
  type public.ledger_type not null,
  amount numeric(10, 3) not null check (amount <> 0),
  order_id uuid references public.orders on delete restrict,
  payment_id uuid references public.payments on delete restrict,
  transfer_id uuid references public.bank_transfers on delete restrict,
  note text,
  created_at timestamptz not null default now()
);
create index ledger_account_id_idx on public.ledger (account_id, created_at desc);

-- ---------- Chat and support ----------

-- One chat per brand and creator, opened when the creator accepts an order. A chat with no brand is
-- the creator's support chat with the 100clips team (one per creator).
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands on delete cascade,
  creator_id uuid not null references public.creators on delete cascade,
  -- The order that opened it.
  order_id uuid references public.orders on delete set null,
  -- Unread counts: messages newer than each side's last visit. The brand side is the 100clips team
  -- in a support chat.
  brand_read_at timestamptz,
  creator_read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (brand_id, creator_id)
);
create index conversations_creator_id_idx on public.conversations (creator_id);
create unique index conversations_one_support on public.conversations (creator_id) where brand_id is null;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  -- admin: the 100clips team, in a support chat.
  sender public.actor not null check (sender in ('brand', 'creator', 'admin')),
  sender_id uuid not null references public.accounts on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_conversation_id_idx on public.messages (conversation_id, created_at);

-- "Report" in a chat (the messages stay visible) or "Report a problem" on an order, from either side.
-- One open report per side per order.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations on delete cascade,
  order_id uuid references public.orders on delete cascade,
  reporter public.actor not null check (reporter in ('brand', 'creator')),
  reported_by uuid not null references public.accounts,
  reason public.report_reason not null,
  details text check (length(details) <= 1000),
  status public.report_status not null default 'open',
  -- The admin's reply, shown to whoever reported it.
  resolution text,
  resolved_by uuid references public.accounts,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(conversation_id, order_id) = 1),
  check (
    (conversation_id is not null and reason in ('off_platform', 'abuse', 'spam', 'other'))
    or (order_id is not null and reason in ('not_delivered', 'not_as_agreed', 'product_issue', 'creator_conduct', 'brand_conduct', 'payment', 'other'))
  )
);
create unique index reports_one_open_per_order on public.reports (order_id, reporter) where status = 'open' and order_id is not null;
-- ---------- Admin ----------

-- A suspended creator can't be found or booked; a suspended account can't pay for new work.
-- Orders already running carry on. Lifted suspensions stay as history.
create table public.suspensions (
  id uuid primary key default gen_random_uuid(),
  -- A creator or a brand account.
  account_id uuid not null references public.accounts on delete cascade,
  reason text not null check (length(trim(reason)) > 0),
  suspended_by uuid not null references public.accounts,
  suspended_at timestamptz not null default now(),
  lifted_by uuid references public.accounts,
  lifted_at timestamptz
);
create unique index suspensions_active on public.suspensions (account_id) where lifted_at is null;

-- Everything an admin did.
create table public.admin_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.accounts,
  action public.admin_action not null,
  target_kind text not null check (target_kind in ('creator', 'account', 'brand', 'order', 'transfer', 'report')),
  target_id uuid not null,
  note text,
  -- A bank reference, a new date or an amount.
  detail text,
  at timestamptz not null default now()
);
create index admin_log_target_idx on public.admin_log (target_kind, target_id, at desc);

-- ---------- Updated-at ----------

create trigger creators_updated_at before update on public.creators for each row execute function public.set_updated_at();
create trigger brands_updated_at before update on public.brands for each row execute function public.set_updated_at();
create trigger brand_registrations_updated_at before update on public.brand_registrations for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger campaigns_updated_at before update on public.campaigns for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

-- ---------- Access helpers ----------

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.accounts where id = (select auth.uid()) and role = 'admin')
$$;

create function private.my_account_id() returns uuid
language sql stable security definer set search_path = '' as $$
  -- The signed-in user's own row, when they're a brand owner.
  select id from public.accounts where id = (select auth.uid()) and role = 'brand'
$$;

create function private.owns_brand(brand uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.brands b where b.id = brand and b.account_id = (select auth.uid()))
$$;

create function private.account_of_brand(brand uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select account_id from public.brands where id = brand
$$;

create function private.creator_suspended(creator uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.suspensions where account_id = creator and lifted_at is null)
$$;

create function private.account_suspended(account uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.suspensions where account_id = account and lifted_at is null)
$$;

-- Brands can find and book this creator.
create function private.is_bookable(creator uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.creators c
    where c.id = creator
      and private.is_active_market(c.country)
      and c.status = 'approved'
      and c.photo_path is not null
      and exists (select 1 from public.creator_portfolio s where s.creator_id = c.id)
      and exists (select 1 from public.creator_formats f where f.creator_id = c.id)
      and not private.creator_suspended(c.id)
  )
$$;

-- The signed-in brand owner has an order with this creator (so keeps seeing them on that order).
create function private.works_with_me(creator uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.orders o where o.creator_id = creator and private.owns_brand(o.brand_id))
$$;

-- The signed-in creator has an order on this campaign; `accepted` limits it to accepted ones.
create function private.creator_on_campaign(campaign uuid, accepted boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.orders o
    where o.campaign_id = campaign and o.creator_id = (select auth.uid())
      and (not accepted or o.status in ('in_progress', 'delivered', 'approved'))
  )
$$;

create function private.can_see_order(ord uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.orders o
    where o.id = ord and (o.creator_id = (select auth.uid()) or private.owns_brand(o.brand_id) or private.is_admin())
  )
$$;

create function private.in_conversation(conversation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conversation and (
      c.creator_id = (select auth.uid()) or private.owns_brand(c.brand_id) or (c.brand_id is null and private.is_admin())
    )
  )
$$;

create function private.account_balance(account uuid) returns numeric
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(amount), 0) from public.ledger where account_id = account
$$;


-- ---------- Row level security ----------

alter table public.waitlist_requests enable row level security;
alter table public.accounts enable row level security;
alter table public.creators enable row level security;
alter table public.creator_formats enable row level security;
alter table public.creator_socials enable row level security;
alter table public.creator_portfolio enable row level security;
alter table public.creator_addresses enable row level security;
alter table public.creator_approvals enable row level security;
alter table public.brands enable row level security;
alter table public.brand_registrations enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.creator_lists enable row level security;
alter table public.creator_list_items enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_secrets enable row level security;
alter table public.payments enable row level security;
alter table public.orders enable row level security;
alter table public.order_fees enable row level security;
alter table public.order_events enable row level security;
alter table public.order_clips enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.bank_transfers enable row level security;
alter table public.payout_orders enable row level security;
alter table public.ledger enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.suspensions enable row level security;
alter table public.admin_log enable row level security;

-- Columns people may write themselves. Everything else (roles, statuses, counts) goes
-- through the functions below.
revoke insert, update on public.accounts from anon, authenticated;
grant insert (id, role, name_ar, name_en, phone) on public.accounts to authenticated;
grant update (name_ar, name_en, phone, notifications_seen_at) on public.accounts to authenticated;
revoke insert, update on public.creators from anon, authenticated;
grant insert (id, name_ar, name_en, handle, country, city, bio, gender, shows_face, niches, photo_path) on public.creators to authenticated;
grant update (name_ar, name_en, handle, country, city, bio, gender, shows_face, niches, photo_path) on public.creators to authenticated;
revoke insert, update on public.conversations from anon, authenticated;
grant insert (brand_id, creator_id) on public.conversations to authenticated;
grant update (brand_read_at, creator_read_at) on public.conversations to authenticated;

-- People: your own row. Nobody can make themselves an admin or change their role.
create policy "Read own account" on public.accounts for select to authenticated using (id = (select auth.uid()) or private.is_admin());
create policy "Create own account" on public.accounts for insert to authenticated with check (id = (select auth.uid()) and role <> 'admin');
create policy "Update own account" on public.accounts for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Admins read the waitlist" on public.waitlist_requests for select to authenticated using (private.is_admin());

-- Creators: themselves, admins, brands while bookable, and brands that have worked with them.
create policy "Read visible creators" on public.creators for select to authenticated using (
  id = (select auth.uid()) or private.is_admin() or private.is_bookable(id) or private.works_with_me(id)
);
create policy "Creator signs up" on public.creators for insert to authenticated with check (
  id = (select auth.uid()) and exists (select 1 from public.accounts where id = (select auth.uid()) and role = 'creator')
);
create policy "Creator updates own profile" on public.creators for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- A creator's prices, accounts and samples are visible wherever the creator is.
create policy "Read prices of visible creators" on public.creator_formats for select to authenticated using (exists (select 1 from public.creators c where c.id = creator_id));
create policy "Creator manages own prices" on public.creator_formats for all to authenticated using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));

create policy "Read socials of visible creators" on public.creator_socials for select to authenticated using (exists (select 1 from public.creators c where c.id = creator_id));
create policy "Creator manages own socials" on public.creator_socials for all to authenticated using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));
create policy "Read samples of visible creators" on public.creator_portfolio for select to authenticated using (exists (select 1 from public.creators c where c.id = creator_id));
create policy "Creator manages own samples" on public.creator_portfolio for all to authenticated using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));

create policy "Creator manages own addresses" on public.creator_addresses for all to authenticated using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));
-- Written only by submit_application and decide_creator.
create policy "Creator and admins read applications" on public.creator_approvals for select to authenticated using (creator_id = (select auth.uid()) or private.is_admin());


-- Brands and products: owners manage them; signed-in users read them (creators see who they work for).
create policy "Signed-in users read brands" on public.brands for select to authenticated using (true);
create policy "Owner adds brands" on public.brands for insert to authenticated with check (account_id = private.my_account_id());
create policy "Owner updates brands" on public.brands for update to authenticated using (private.owns_brand(id)) with check (account_id = private.my_account_id());
create policy "Owner deletes brands" on public.brands for delete to authenticated using (private.owns_brand(id));
create policy "Owner and admins read registration" on public.brand_registrations for select to authenticated using (private.owns_brand(brand_id) or private.is_admin());
create policy "Owner manages registration" on public.brand_registrations for all to authenticated using (private.owns_brand(brand_id)) with check (private.owns_brand(brand_id));

create policy "Signed-in users read products" on public.products for select to authenticated using (true);
create policy "Owner manages products" on public.products for all to authenticated using (private.owns_brand(brand_id)) with check (private.owns_brand(brand_id));

-- Cart and lists belong to the account.
create policy "Own cart" on public.cart_items for all to authenticated using (account_id = private.my_account_id()) with check (account_id = private.my_account_id());
create policy "Own lists" on public.creator_lists for all to authenticated using (account_id = private.my_account_id()) with check (account_id = private.my_account_id());
create policy "Own list items" on public.creator_list_items for all to authenticated
  using (exists (select 1 from public.creator_lists l where l.id = list_id and l.account_id = private.my_account_id()))
  with check (exists (select 1 from public.creator_lists l where l.id = list_id and l.account_id = private.my_account_id()));

-- Campaigns: the brand, admins, and creators with an offer on it. Brands write drafts only;
-- a live campaign changes through checkout, edit_campaign_details and extend_deadline.
create policy "Read own or offered campaigns" on public.campaigns for select to authenticated using (
  private.owns_brand(brand_id) or private.is_admin() or private.creator_on_campaign(id, false)
);
create policy "Owner adds drafts" on public.campaigns for insert to authenticated with check (private.owns_brand(brand_id) and status = 'draft');
create policy "Owner edits drafts" on public.campaigns for update to authenticated
  using (private.owns_brand(brand_id) and status = 'draft') with check (private.owns_brand(brand_id) and status = 'draft');
create policy "Owner deletes drafts" on public.campaigns for delete to authenticated using (private.owns_brand(brand_id) and status = 'draft');

create policy "Read secrets once accepted" on public.campaign_secrets for select to authenticated using (
  private.creator_on_campaign(campaign_id, true) or private.is_admin()
  or exists (select 1 from public.campaigns c where c.id = campaign_id and private.owns_brand(c.brand_id))
);
create policy "Owner manages secrets" on public.campaign_secrets for all to authenticated
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and private.owns_brand(c.brand_id)))
  with check (exists (select 1 from public.campaigns c where c.id = campaign_id and private.owns_brand(c.brand_id)));


-- Orders and everything on them: the brand, the creator and admins. Written by functions only.
create policy "Read own orders" on public.orders for select to authenticated using (
  creator_id = (select auth.uid()) or private.owns_brand(brand_id) or private.is_admin()
);
create policy "Brand reads fees" on public.order_fees for select to authenticated using (
  private.is_admin() or exists (select 1 from public.orders o where o.id = order_id and private.owns_brand(o.brand_id))
);
create policy "Read events of own orders" on public.order_events for select to authenticated using (private.can_see_order(order_id));
-- Written only by submit_clip.
create policy "Read clips of own orders" on public.order_clips for select to authenticated using (private.can_see_order(order_id));

-- Money: your own, and admins.
create policy "Read own payments" on public.payments for select to authenticated using (account_id = private.my_account_id() or private.is_admin());
create policy "Read own bank accounts" on public.bank_accounts for select to authenticated using (
  account_id = (select auth.uid()) or private.is_admin()
);
create policy "Read own transfers" on public.bank_transfers for select to authenticated using (
  account_id = (select auth.uid()) or private.is_admin()
);
-- Written only by mark_payout_paid.
create policy "Read own payout orders" on public.payout_orders for select to authenticated using (
  exists (select 1 from public.bank_transfers t where t.id = transfer_id and (t.account_id = (select auth.uid()) or private.is_admin()))
);
create policy "Read own ledger" on public.ledger for select to authenticated using (
  account_id = (select auth.uid()) or private.is_admin()
);

-- Chat: the two sides (the 100clips team is the other side of support chats). Admins read a brand
-- chat only once it's reported. Chats open through accept_offer; creators open their own support chat.
-- The sides are checked on the row itself (not through in_conversation) so a chat just opened can be read back.
create policy "Participants read conversations" on public.conversations for select to authenticated using (
  creator_id = (select auth.uid()) or private.owns_brand(brand_id) or (brand_id is null and private.is_admin()) or (private.is_admin() and exists (select 1 from public.reports r where r.conversation_id = id))
);
create policy "Open a support chat" on public.conversations for insert to authenticated with check (
  brand_id is null and (creator_id = (select auth.uid()) or private.is_admin())
);
create policy "Participants mark chats read" on public.conversations for update to authenticated
  using (creator_id = (select auth.uid()) or private.owns_brand(brand_id) or (brand_id is null and private.is_admin()))
  with check (creator_id = (select auth.uid()) or private.owns_brand(brand_id) or (brand_id is null and private.is_admin()));
create policy "Participants read messages" on public.messages for select to authenticated using (
  private.in_conversation(conversation_id) or (private.is_admin() and exists (select 1 from public.reports r where r.conversation_id = messages.conversation_id))
);
create policy "Participants send messages" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and private.in_conversation(conversation_id)
);

-- Each side moves only its own read marker.
create function private.guard_read_markers() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.creator_id = (select auth.uid()) then
    new.brand_read_at = old.brand_read_at;
  else
    new.creator_read_at = old.creator_read_at;
  end if;
  return new;
end;
$$;
create trigger conversations_read_markers before update on public.conversations for each row execute function private.guard_read_markers();

-- The sender side comes from who is sending, not from the app.
create function private.set_message_sender() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.sender = case
    when exists (select 1 from public.conversations c where c.id = new.conversation_id and c.creator_id = new.sender_id) then 'creator'::public.actor
    when exists (select 1 from public.conversations c where c.id = new.conversation_id and c.brand_id is null) then 'admin'::public.actor
    else 'brand'::public.actor
  end;
  new.created_at = now();
  return new;
end;
$$;
create trigger messages_sender before insert on public.messages for each row execute function private.set_message_sender();

create policy "Sides report chats and orders" on public.reports for insert to authenticated with check (
  reported_by = (select auth.uid()) and status = 'open' and resolution is null
  and (
    (conversation_id is not null and private.in_conversation(conversation_id))
    or exists (
      select 1 from public.orders o where o.id = order_id
        and ((reporter = 'creator' and o.creator_id = (select auth.uid())) or (reporter = 'brand' and private.owns_brand(o.brand_id)))
    )
  )
);
create policy "Read own reports" on public.reports for select to authenticated using (
  private.is_admin() or reported_by = (select auth.uid()) or exists (
    select 1 from public.orders o where o.id = order_id
      and ((reporter = 'creator' and o.creator_id = (select auth.uid())) or (reporter = 'brand' and private.owns_brand(o.brand_id)))
  )
);
create policy "Read own or all suspensions" on public.suspensions for select to authenticated using (
  private.is_admin() or account_id = (select auth.uid())
);
create policy "Admins read the log" on public.admin_log for select to authenticated using (private.is_admin());

-- ---------- Views ----------

-- Reviews and ratings sit on orders, which are private, so these two run as their owner and show only
-- the review itself: the brand's name, stars, comment and date.
create view public.creator_reviews as
  select o.id as order_id, o.creator_id, b.name_ar as brand_name_ar, b.name_en as brand_name_en, o.rating, o.review, o.rated_at
  from public.orders o join public.brands b on b.id = o.brand_id
  where o.rating is not null;
revoke all on public.creator_reviews from anon;
grant select on public.creator_reviews to authenticated;

create view public.creator_ratings as
  select creator_id, round(avg(rating), 1) as rating, count(*) as review_count
  from public.orders where rating is not null
  group by creator_id;
revoke all on public.creator_ratings from anon;
grant select on public.creator_ratings to authenticated;

-- Each owner's balance: a brand account's wallet, or a creator's earnings not yet paid out.
create view public.balances with (security_invoker = true) as
  select account_id, sum(amount)::numeric(10, 3) as balance
  from public.ledger
  group by account_id;

-- Explore: bookable creators with their rating and lowest price (before the fee).
create view public.bookable_creators with (security_invoker = true) as
  select c.*, r.rating, coalesce(r.review_count, 0) as review_count,
    (select min(f.price) from public.creator_formats f where f.creator_id = c.id) as from_price
  from public.creators c
  left join public.creator_ratings r on r.creator_id = c.id
  where private.is_bookable(c.id);

-- Approved clips other brands may see on creator cards: the brand allowed it and the creator is bookable.
-- Runs as its owner (orders are private), so the filter here is the whole rule.
create view public.public_clips as
  select o.id as order_id, o.creator_id, b.name_ar as brand_name_ar, b.name_en as brand_name_en, o.views, o.approved_at,
    v.video_path, v.duration_sec
  from public.orders o
  join public.brands b on b.id = o.brand_id
  -- The latest version is the one that was approved.
  join lateral (select c.video_path, c.duration_sec from public.order_clips c where c.order_id = o.id order by c.version desc limit 1) v on true
  where o.status = 'approved' and o.clip_public and private.is_bookable(o.creator_id);
revoke all on public.public_clips from anon;
grant select on public.public_clips to authenticated;

-- ---------- Internal steps ----------

create function private.log_event(ord uuid, kind public.order_event_type, who public.actor, details jsonb default '{}')
returns void language sql security definer set search_path = '' as $$
  insert into public.order_events (order_id, type, actor, actor_id, data)
  values (ord, kind, who, case when who = 'system' then null else (select auth.uid()) end, details)
$$;

create function private.admin_did(what public.admin_action, kind text, target uuid, note text default null, detail text default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.admin_log (admin_id, action, target_kind, target_id, note, detail)
  values ((select auth.uid()), what, kind, target, note, detail)
$$;

-- Loads an order for a change, locked, after checking the caller is on the right side of it.
create function private.order_for(ord uuid, side public.actor) returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
begin
  select * into o from public.orders where id = ord for update;
  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  if (side = 'creator' and o.creator_id is distinct from (select auth.uid()))
     or (side = 'brand' and not private.owns_brand(o.brand_id))
     or (side = 'admin' and not private.is_admin()) then
    raise exception 'Not allowed on this order' using errcode = '42501';
  end if;
  return o;
end;
$$;

create function private.product_of(o public.orders) returns public.products
language sql stable security definer set search_path = '' as $$
  select p.* from public.campaigns c join public.products p on p.id = c.product_id where c.id = o.campaign_id
$$;

-- Everything the brand paid for this order goes back to its balance.
create function private.refund(o public.orders) returns void
language sql security definer set search_path = '' as $$
  insert into public.ledger (account_id, type, amount, order_id)
  select private.account_of_brand(o.brand_id), 'refund'::public.ledger_type, o.amount + coalesce(f.fee, 0), o.id
  from (select 1) one left join public.order_fees f on f.order_id = o.id
$$;

-- Every offer was declined, expired or withdrawn: the campaign is over.
create function private.close_campaign_if_empty(campaign uuid) returns void
language sql security definer set search_path = '' as $$
  update public.campaigns set status = 'cancelled', cancelled_at = now()
  where id = campaign and status = 'live'
    and exists (select 1 from public.orders where campaign_id = campaign)
    and not exists (select 1 from public.orders where campaign_id = campaign and status not in ('declined', 'cancelled'))
$$;

-- Approval releases the creator's pay into their balance.
create function private.approve(o public.orders, who public.actor) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.orders set status = 'approved', approved_at = now(), approved_by = who where id = o.id;
  insert into public.ledger (account_id, type, amount, order_id) values (o.creator_id, 'earning', o.amount, o.id);
  update public.creators set completed_orders = completed_orders + 1 where id = o.creator_id;
  perform private.log_event(o.id, 'approved', who);
end;
$$;

-- A paid payment does its job: tops up, or launches the campaign and sends the offers.
create function private.complete_payment(pay uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  p public.payments;
  c public.campaigns;
  pick jsonb;
  price numeric;
  fee numeric;
  new_order uuid;
begin
  select * into p from public.payments where id = pay for update;
  if p.status <> 'pending' then
    raise exception 'Payment already handled' using errcode = '55000';
  end if;
  update public.payments set status = 'paid', paid_at = now() where id = pay;

  if p.kind = 'top_up' then
    insert into public.ledger (account_id, type, amount, payment_id) values (p.account_id, 'top_up', p.total, p.id);
    return;
  end if;

  if p.by_card > 0 then
    insert into public.ledger (account_id, type, amount, payment_id) values (p.account_id, 'card_payment', p.by_card, p.id);
  end if;

  select * into c from public.campaigns where id = p.campaign_id for update;
  if c.status = 'draft' then
    update public.campaigns set status = 'live', launched_at = now(), draft = null where id = c.id;
  end if;

  for pick in select * from jsonb_array_elements(p.picks) loop
    select f.price into price from public.creator_formats f
    where f.creator_id = (pick ->> 'creator_id')::uuid and f.format = (pick ->> 'format')::public.content_format;
    fee = round(price * private.fee_rate(), 3);
    insert into public.orders (campaign_id, brand_id, creator_id, payment_id, format, amount, note, deadline)
    values (c.id, c.brand_id, (pick ->> 'creator_id')::uuid, p.id, (pick ->> 'format')::public.content_format, price, nullif(trim(pick ->> 'note'), ''), c.deadline)
    returning id into new_order;
    insert into public.order_fees (order_id, fee) values (new_order, fee);
    insert into public.ledger (account_id, type, amount, order_id, payment_id) values (p.account_id, 'charge', -(price + fee), new_order, p.id);
    perform private.log_event(new_order, 'offered', 'brand');
  end loop;

  if private.account_balance(p.account_id) < 0 then
    raise exception 'Balance too low' using errcode = 'check_violation';
  end if;
  delete from public.cart_items where account_id = p.account_id and creator_id in (select (x ->> 'creator_id')::uuid from jsonb_array_elements(p.picks) x);
end;
$$;

-- ---------- Waitlist ----------

-- "Tell me when you launch": one box for a number or an email. With an @ it's an email; otherwise
-- spaces, dashes and brackets are dropped and it's a phone number.
create function public.join_waitlist(country text, contact text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c text = trim(join_waitlist.contact);
begin
  if position('@' in c) > 0 then
    insert into public.waitlist_requests (country, email) values (upper(join_waitlist.country), lower(c));
  else
    insert into public.waitlist_requests (country, phone) values (upper(join_waitlist.country), regexp_replace(c, '[\s()-]', '', 'g'));
  end if;
end;
$$;

-- ---------- Creator actions ----------

-- "Send for review" at the end of sign-up, or again after changes were requested or a rejection.
-- intro_video_path: the intro just uploaded to private-docs (15-60 seconds, "I'm available on 100Clips").
-- Left out on a resubmission, the previous intro is sent again.
create function public.submit_application(intro_video_path text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c public.creators;
  intro text;
begin
  select * into c from public.creators where id = (select auth.uid()) for update;
  if not found then
    raise exception 'No creator profile' using errcode = 'P0002';
  end if;
  if c.status not in ('incomplete', 'changes_requested', 'rejected') then
    raise exception 'Already sent' using errcode = '55000';
  end if;
  intro = coalesce(submit_application.intro_video_path,
    (select a.intro_video_path from public.creator_approvals a where a.creator_id = c.id order by a.submitted_at desc limit 1));
  if intro is not null and split_part(intro, '/', 1) <> c.id::text then
    raise exception 'The intro must be your own upload' using errcode = '42501';
  end if;
  if intro is null or c.city is null or cardinality(c.niches) = 0
     or not exists (select 1 from public.creator_portfolio where creator_id = c.id)
     or not exists (select 1 from public.creator_socials where creator_id = c.id)
     or not exists (select 1 from public.creator_formats where creator_id = c.id) then
    raise exception 'Intro video, a sample, a social account, city, niches and prices are needed' using errcode = 'check_violation';
  end if;
  update public.creators set status = 'pending' where id = c.id;
  insert into public.creator_approvals (creator_id, intro_video_path, sample_paths)
  values (c.id, intro, array(select s.video_path from public.creator_portfolio s where s.creator_id = c.id order by s.created_at));
end;
$$;

create function public.accept_offer(order_id uuid, address_id uuid default null, terms_version text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'creator');
  a public.creator_addresses;
  conversation uuid;
begin
  if o.status <> 'pending' or o.created_at + private.offer_window() <= now() then
    raise exception 'This offer can no longer be accepted' using errcode = '55000';
  end if;
  if (private.product_of(o)).type = 'physical' then
    select * into a from public.creator_addresses where id = address_id and creator_id = o.creator_id;
    if not found then
      raise exception 'Choose an address' using errcode = 'check_violation';
    end if;
  end if;
  update public.orders set
    status = 'in_progress', accepted_at = now(), terms_version = accept_offer.terms_version,
    ship_to = case when a.id is null then null else jsonb_build_object(
      'type', a.type, 'label', a.label, 'address', a.address_text, 'latitude', a.latitude, 'longitude', a.longitude,
      'phone', (select phone from public.accounts where id = o.creator_id)
    ) end
  where id = o.id;
  insert into public.conversations (brand_id, creator_id, order_id) values (o.brand_id, o.creator_id, o.id)
  on conflict (brand_id, creator_id) do nothing;
  perform private.log_event(o.id, 'accepted', 'creator');
end;
$$;

create function public.decline_offer(order_id uuid, reason public.decline_reason default 'other', note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'creator');
begin
  if o.status <> 'pending' then
    raise exception 'Only a waiting offer can be declined' using errcode = '55000';
  end if;
  if reason = 'expired' then
    raise exception 'Not a reason a creator gives' using errcode = 'check_violation';
  end if;
  update public.orders set status = 'declined', decline_reason = reason, decline_note = nullif(trim(decline_offer.note), ''), declined_at = now() where id = o.id;
  perform private.refund(o);
  perform private.log_event(o.id, 'declined', 'creator', jsonb_build_object('reason', reason));
  perform private.close_campaign_if_empty(o.campaign_id);
end;
$$;

create function public.confirm_received(order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'creator');
begin
  if o.status <> 'in_progress' or o.sent_at is null or o.received_at is not null then
    raise exception 'Nothing to confirm' using errcode = '55000';
  end if;
  update public.orders set received_at = now() where id = o.id;
  perform private.log_event(o.id, 'received', 'creator');
end;
$$;

create function public.set_ad_code(order_id uuid, code text, valid_days integer) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'creator');
begin
  if o.status not in ('in_progress', 'delivered', 'approved') then
    raise exception 'No clip to add a code to' using errcode = '55000';
  end if;
  if valid_days not in (7, 30, 60, 365) or length(trim(code)) = 0 then
    raise exception 'Invalid ad code' using errcode = 'check_violation';
  end if;
  update public.orders set ad_code = trim(code), ad_code_expires_at = now() + make_interval(days => valid_days) where id = o.id;
  perform private.log_event(o.id, 'ad_code_added', 'creator');
end;
$$;

-- The file is uploaded to the clips bucket first; this records it and sends it to the brand.
create function public.submit_clip(
  order_id uuid, video_path text, duration_sec integer default null, size_bytes bigint default null,
  note text default null, ad_code text default null, ad_code_days integer default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'creator');
  next_version integer := (select count(*) + 1 from public.order_clips c where c.order_id = o.id);
begin
  if o.status <> 'in_progress' then
    raise exception 'Not waiting for a clip' using errcode = '55000';
  end if;
  if (private.product_of(o)).type = 'physical' and o.received_at is null then
    raise exception 'Confirm the product arrived first' using errcode = '55000';
  end if;
  if next_version > 1 and o.revision_requested_at is null or next_version > 2 then
    raise exception 'No more versions' using errcode = '55000';
  end if;
  if split_part(video_path, '/', 1) <> o.id::text then
    raise exception 'Upload the clip under the order''s folder' using errcode = 'check_violation';
  end if;
  insert into public.order_clips (order_id, version, video_path, duration_sec, size_bytes, note)
  values (o.id, next_version, submit_clip.video_path, submit_clip.duration_sec, submit_clip.size_bytes, nullif(trim(submit_clip.note), ''));
  update public.orders set status = 'delivered', delivered_at = now() where id = o.id;
  perform private.log_event(o.id, 'uploaded', 'creator', jsonb_build_object('version', next_version));
  if ad_code is not null and length(trim(ad_code)) > 0 then
    perform public.set_ad_code(o.id, ad_code, coalesce(ad_code_days, 30));
  end if;
end;
$$;

-- The celebration was shown.
create function public.mark_approval_seen(order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'creator');
begin
  update public.orders set creator_seen_approval_at = coalesce(creator_seen_approval_at, now()) where id = o.id and status = 'approved';
end;
$$;

-- ---------- Brand actions ----------

-- Pays for offers on a campaign: a draft (New campaign, Checkout, Run again) or a live one (Invite).
-- picks: [{"creator_id": "...", "format": "instagram_reel", "note": "..."}]. Returns the payment;
-- if by_card > 0 it waits for the card provider (confirm_payment), otherwise the offers go now.
create function public.checkout(campaign_id uuid, picks jsonb, use_balance boolean default true) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  account uuid := private.my_account_id();
  c public.campaigns;
  pick jsonb;
  price numeric;
  total numeric := 0;
  from_balance numeric := 0;
  pay uuid;
begin
  select * into c from public.campaigns where id = checkout.campaign_id for update;
  if not found or not private.owns_brand(c.brand_id) then
    raise exception 'Campaign not found' using errcode = 'P0002';
  end if;
  if private.account_suspended(account) then
    raise exception 'Account suspended' using errcode = '42501';
  end if;
  if c.status = 'cancelled' then
    raise exception 'Campaign cancelled' using errcode = '55000';
  end if;
  if c.status = 'draft' and (c.product_id is null or length(trim(coalesce(c.title, ''))) = 0 or length(trim(coalesce(c.brief, ''))) < 20 or c.video_style is null) then
    raise exception 'Finish the brief first' using errcode = 'check_violation';
  end if;
  if c.deadline is not null and c.deadline <= current_date then
    raise exception 'The deadline has passed' using errcode = 'check_violation';
  end if;
  if jsonb_typeof(picks) <> 'array' or jsonb_array_length(picks) = 0 then
    raise exception 'Pick at least one creator' using errcode = 'check_violation';
  end if;
  -- Checked here, before any card is charged: orders_one_per_creator would refuse it after payment.
  if (select count(distinct x ->> 'creator_id') from jsonb_array_elements(picks) x) < jsonb_array_length(picks) then
    raise exception 'One video per creator per campaign for now' using errcode = 'check_violation';
  end if;
  for pick in select * from jsonb_array_elements(picks) loop
    if not private.is_bookable((pick ->> 'creator_id')::uuid) then
      raise exception 'Creator not available' using errcode = 'check_violation';
    end if;
    price = null;
    select f.price into price from public.creator_formats f
    where f.creator_id = (pick ->> 'creator_id')::uuid and f.format = (pick ->> 'format')::public.content_format;
    if price is null then
      raise exception 'Creator doesn''t offer that format' using errcode = 'check_violation';
    end if;
    total = total + price + round(price * private.fee_rate(), 3);
  end loop;
  if use_balance then
    from_balance = least(greatest(private.account_balance(account), 0), total);
  end if;
  insert into public.payments (account_id, kind, campaign_id, total, from_balance, by_card, picks)
  values (account, 'checkout', c.id, total, from_balance, total - from_balance, picks)
  returning id into pay;
  if total = from_balance then
    perform private.complete_payment(pay);
  end if;
  return pay;
end;
$$;

-- "Top up wallet": a card payment that adds to the balance once the provider confirms it.
create function public.start_top_up(amount numeric) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  pay uuid;
begin
  if private.my_account_id() is null or amount < 1 then
    raise exception 'Invalid top-up' using errcode = 'check_violation';
  end if;
  insert into public.payments (account_id, kind, total, by_card) values (private.my_account_id(), 'top_up', round(amount, 3), round(amount, 3))
  returning id into pay;
  return pay;
end;
$$;

-- Called by the card provider's webhook (service role only).
create function public.confirm_payment(payment_id uuid, provider text, provider_ref text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.payments set provider = confirm_payment.provider, provider_ref = confirm_payment.provider_ref where id = payment_id;
  perform private.complete_payment(payment_id);
end;
$$;

create function public.fail_payment(payment_id uuid, provider text, provider_ref text) returns void
language sql security definer set search_path = '' as $$
  update public.payments set status = 'failed', provider = fail_payment.provider, provider_ref = fail_payment.provider_ref
  where id = payment_id and status = 'pending'
$$;

-- Extra details can change only while nobody has accepted, so no creator is held to something new.
create function public.edit_campaign_details(campaign_id uuid, key_message text, reference_links text[], must_include text, avoid text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c public.campaigns;
  changes jsonb := '[]';
begin
  select * into c from public.campaigns where id = edit_campaign_details.campaign_id for update;
  if not found or not private.owns_brand(c.brand_id) then
    raise exception 'Campaign not found' using errcode = 'P0002';
  end if;
  if c.status <> 'live' or exists (select 1 from public.orders o where o.campaign_id = c.id and o.status in ('in_progress', 'delivered', 'approved')) then
    raise exception 'A creator already accepted' using errcode = '55000';
  end if;
  if c.key_message is distinct from key_message then
    changes = changes || jsonb_build_object('field', 'keyMessage', 'before', c.key_message, 'after', key_message);
  end if;
  if c.reference_links is distinct from coalesce(reference_links, '{}') then
    changes = changes || jsonb_build_object('field', 'references', 'before', to_jsonb(c.reference_links), 'after', to_jsonb(coalesce(reference_links, '{}')));
  end if;
  if c.must_include is distinct from must_include then
    changes = changes || jsonb_build_object('field', 'mustInclude', 'before', c.must_include, 'after', must_include);
  end if;
  if c.avoid is distinct from avoid then
    changes = changes || jsonb_build_object('field', 'avoid', 'before', c.avoid, 'after', avoid);
  end if;
  if jsonb_array_length(changes) = 0 then
    return;
  end if;
  update public.campaigns set key_message = edit_campaign_details.key_message, reference_links = coalesce(edit_campaign_details.reference_links, '{}'),
    must_include = edit_campaign_details.must_include, avoid = edit_campaign_details.avoid
  where id = c.id;
  update public.campaigns set events = events || jsonb_build_object('type', 'details_edited', 'at', now(), 'changes', changes) where id = c.id;
end;
$$;

-- Later only: creators agreed to the old date. Orders still on the old date move with it.
create function public.extend_deadline(campaign_id uuid, deadline date) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c public.campaigns;
  o record;
begin
  select * into c from public.campaigns where id = extend_deadline.campaign_id for update;
  if not found or not private.owns_brand(c.brand_id) then
    raise exception 'Campaign not found' using errcode = 'P0002';
  end if;
  if c.status <> 'live' or c.deadline is null or deadline <= c.deadline or deadline <= current_date then
    raise exception 'The deadline can only move later' using errcode = 'check_violation';
  end if;
  update public.campaigns set deadline = extend_deadline.deadline where id = c.id;
  update public.campaigns set events = events || jsonb_build_object('type', 'deadline_moved', 'at', now(), 'from', c.deadline, 'to', extend_deadline.deadline) where id = c.id;
  for o in
    update public.orders set deadline = extend_deadline.deadline
    where orders.campaign_id = c.id and orders.deadline = c.deadline and status in ('pending', 'in_progress')
    returning id
  loop
    perform private.log_event(o.id, 'deadline_moved', 'brand', jsonb_build_object('from', c.deadline, 'to', deadline));
  end loop;
end;
$$;

-- Takes back an offer the creator hasn't answered. Everything paid goes back to the balance.
create function public.withdraw_offer(order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'brand');
begin
  if o.status <> 'pending' then
    raise exception 'The creator already answered' using errcode = '55000';
  end if;
  update public.orders set status = 'cancelled', cancelled_at = now(), cancelled_by = 'brand' where id = o.id;
  perform private.refund(o);
  perform private.log_event(o.id, 'cancelled', 'brand');
  perform private.close_campaign_if_empty(o.campaign_id);
end;
$$;

create function public.mark_sent(order_id uuid, note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'brand');
begin
  if o.status <> 'in_progress' or o.sent_at is not null or (private.product_of(o)).type <> 'physical' then
    raise exception 'Nothing to send' using errcode = '55000';
  end if;
  update public.orders set sent_at = now(), ship_note = nullif(trim(mark_sent.note), '') where id = o.id;
  perform private.log_event(o.id, 'sent', 'brand');
end;
$$;

create function public.request_revision(order_id uuid, note text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'brand');
begin
  if o.status <> 'delivered' or o.revision_requested_at is not null then
    raise exception 'No revision left' using errcode = '55000';
  end if;
  if length(trim(coalesce(note, ''))) < 10 then
    raise exception 'Say what should change, in at least 10 characters' using errcode = 'check_violation';
  end if;
  update public.orders set status = 'in_progress', revision_requested_at = now(), revision_note = trim(request_revision.note) where id = o.id;
  perform private.log_event(o.id, 'revision_requested', 'brand');
end;
$$;

-- Releases the payment. Stars and a comment are optional; stars can also come later (rate_order).
create function public.approve_order(order_id uuid, rating smallint default null, comment text default null, clip_public boolean default true) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'brand');
begin
  if o.status <> 'delivered' then
    raise exception 'Nothing to approve' using errcode = '55000';
  end if;
  update public.orders set clip_public = approve_order.clip_public,
    rating = approve_order.rating, review = case when approve_order.rating is null then null else nullif(trim(comment), '') end,
    rated_at = case when approve_order.rating is null then null else now() end
  where id = o.id;
  perform private.approve(o, 'brand');
end;
$$;

-- Stars after approving, once. Ratings can't be changed.
create function public.rate_order(order_id uuid, rating smallint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'brand');
begin
  if o.status <> 'approved' then
    raise exception 'Rate once the clip is approved' using errcode = '55000';
  end if;
  if o.rating is not null then
    raise exception 'Already rated' using errcode = '55000';
  end if;
  update public.orders set rating = rate_order.rating, rated_at = now() where id = o.id;
end;
$$;

create function public.set_clip_public(order_id uuid, visible boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'brand');
begin
  update public.orders set clip_public = visible where id = o.id;
end;
$$;

create function public.mark_returned(order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'brand');
begin
  if o.status <> 'approved' or o.returned_at is not null
     or coalesce((select logistics ->> 'after' from public.campaigns where id = o.campaign_id), 'keep') <> 'return' then
    raise exception 'Nothing to collect' using errcode = '55000';
  end if;
  update public.orders set returned_at = now() where id = o.id;
  perform private.log_event(o.id, 'returned', 'brand');
end;
$$;

create function public.request_withdrawal(amount numeric) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  account uuid := private.my_account_id();
  w uuid;
begin
  if account is null then
    raise exception 'No account' using errcode = 'P0002';
  end if;
  -- One withdrawal at a time per account, so two can't spend the same balance.
  perform pg_advisory_xact_lock(hashtext(account::text));
  if not exists (select 1 from public.bank_accounts where account_id = account and replaced_at is null) then
    raise exception 'Add a bank account first' using errcode = 'check_violation';
  end if;
  if amount < 1 or amount > private.account_balance(account) then
    raise exception 'Invalid amount' using errcode = 'check_violation';
  end if;
  insert into public.bank_transfers (kind, account_id, amount) values ('withdrawal', account, round(amount, 3)) returning id into w;
  insert into public.ledger (account_id, type, amount, transfer_id) values (account, 'withdrawal', -round(amount, 3), w);
  return w;
end;
$$;

-- ---------- Either side ----------

-- Adds or replaces the caller's bank account (a creator's, or the brand account's).
create function public.set_bank_account(holder_name text, iban text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  clean text := upper(replace(iban, ' ', ''));
begin
  if not exists (select 1 from public.creators where id = me) and private.my_account_id() is null then
    raise exception 'No creator profile or account' using errcode = 'P0002';
  end if;
  update public.bank_accounts set replaced_at = now() where account_id = me and replaced_at is null;
  insert into public.bank_accounts (account_id, holder_name, iban) values (me, trim(holder_name), clean);
end;
$$;

create function public.remove_bank_account() returns void
language sql security definer set search_path = '' as $$
  update public.bank_accounts set replaced_at = now()
  where replaced_at is null and account_id = (select auth.uid())
$$;

-- ---------- Admin actions ----------

create function public.decide_creator(creator_id uuid, decision public.creator_status, note text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if decision not in ('approved', 'changes_requested', 'rejected') then
    raise exception 'Invalid decision' using errcode = 'check_violation';
  end if;
  if decision <> 'approved' and length(trim(coalesce(note, ''))) = 0 then
    raise exception 'Tell the creator why' using errcode = 'check_violation';
  end if;
  update public.creator_approvals a set decision = decide_creator.decision, note = nullif(trim(decide_creator.note), ''),
    decided_by = (select auth.uid()), decided_at = now()
  where a.creator_id = decide_creator.creator_id and a.decision is null;
  if not found then
    raise exception 'No application waiting' using errcode = '55000';
  end if;
  update public.creators set status = decision,
    approved_at = case when decision = 'approved' then now() else approved_at end
  where id = decide_creator.creator_id;
  perform private.admin_did(
    case decision when 'approved' then 'creator_approved' when 'changes_requested' then 'changes_requested' else 'creator_rejected' end::public.admin_action,
    'creator', decide_creator.creator_id, note
  );
end;
$$;

create function public.suspend(kind text, target_id uuid, reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if kind not in ('creator', 'account') then
    raise exception 'Suspend a creator or an account' using errcode = 'check_violation';
  end if;
  insert into public.suspensions (account_id, reason, suspended_by) values (target_id, reason, (select auth.uid()));
  perform private.admin_did('suspended', kind, target_id, reason);
end;
$$;

create function public.unsuspend(kind text, target_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.suspensions set lifted_at = now(), lifted_by = (select auth.uid())
  where lifted_at is null and account_id = target_id;
  perform private.admin_did('unsuspended', kind, target_id);
end;
$$;

-- Moves one creator's deadline (the campaign's stays as it is for everyone else).
create function public.admin_set_deadline(order_id uuid, deadline date, note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'admin');
begin
  update public.orders set deadline = admin_set_deadline.deadline where id = o.id;
  perform private.log_event(o.id, 'deadline_moved', 'admin', jsonb_build_object('from', o.deadline, 'to', deadline));
  perform private.admin_did('deadline_extended', 'order', o.id, note, deadline::text);
end;
$$;

-- Ends an order that won't finish (a creator who never delivers). The brand gets everything back.
create function public.admin_cancel_order(order_id uuid, note text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders := private.order_for(order_id, 'admin');
begin
  if o.status not in ('pending', 'in_progress', 'delivered') then
    raise exception 'Order already finished' using errcode = '55000';
  end if;
  update public.orders set status = 'cancelled', cancelled_at = now(), cancelled_by = 'admin' where id = o.id;
  perform private.refund(o);
  perform private.log_event(o.id, 'cancelled', 'admin');
  perform private.admin_did('order_cancelled', 'order', o.id, note);
  perform private.close_campaign_if_empty(o.campaign_id);
end;
$$;

-- One transfer to a creator for some of their approved, unpaid orders, to their current bank account.
create function public.mark_payout_paid(creator_id uuid, order_ids uuid[], bank_ref text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  bank public.bank_accounts;
  total numeric;
  found_count integer;
  pay uuid;
begin
  if not private.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  -- One payout at a time per creator, so the same order can't be paid twice.
  perform pg_advisory_xact_lock(hashtext(mark_payout_paid.creator_id::text));
  select * into bank from public.bank_accounts b where b.account_id = mark_payout_paid.creator_id and b.replaced_at is null;
  if not found then
    raise exception 'The creator has no bank account' using errcode = 'check_violation';
  end if;
  select count(*), sum(o.amount) into found_count, total from public.orders o
  where o.id = any(order_ids) and o.creator_id = mark_payout_paid.creator_id and o.status = 'approved'
    and not exists (select 1 from public.payout_orders p where p.order_id = o.id);
  if found_count = 0 or found_count <> cardinality(order_ids) then
    raise exception 'Orders must be approved, unpaid and this creator''s' using errcode = 'check_violation';
  end if;
  insert into public.bank_transfers (kind, account_id, amount, status, sent_at, bank_ref, iban, holder_name, handled_by)
  values ('payout', mark_payout_paid.creator_id, total, 'sent', now(), bank_ref, bank.iban, bank.holder_name, (select auth.uid()))
  returning id into pay;
  insert into public.payout_orders (transfer_id, order_id) select pay, unnest(mark_payout_paid.order_ids);
  insert into public.ledger (account_id, type, amount, transfer_id) values (mark_payout_paid.creator_id, 'payout', -total, pay);
  perform private.admin_did('payout_sent', 'creator', mark_payout_paid.creator_id, null, bank_ref);
  return pay;
end;
$$;

create function public.send_withdrawal(withdrawal_id uuid, bank_ref text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  w public.bank_transfers;
  bank public.bank_accounts;
begin
  if not private.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  select * into w from public.bank_transfers where id = withdrawal_id and kind = 'withdrawal' and status = 'requested' for update;
  if not found then
    raise exception 'No withdrawal waiting' using errcode = '55000';
  end if;
  -- The bank account as it is now (it may have changed since the request).
  select * into bank from public.bank_accounts where account_id = w.account_id and replaced_at is null;
  if not found then
    raise exception 'The brand has no bank account' using errcode = 'check_violation';
  end if;
  update public.bank_transfers set status = 'sent', sent_at = now(), bank_ref = send_withdrawal.bank_ref, iban = bank.iban, holder_name = bank.holder_name,
    handled_by = (select auth.uid()) where id = w.id;
  perform private.admin_did('withdrawal_sent', 'transfer', w.id, null, bank_ref);
end;
$$;

create function public.reject_withdrawal(withdrawal_id uuid, note text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  w public.bank_transfers;
begin
  if not private.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  select * into w from public.bank_transfers where id = withdrawal_id and kind = 'withdrawal' and status = 'requested' for update;
  if not found then
    raise exception 'No withdrawal waiting' using errcode = '55000';
  end if;
  update public.bank_transfers set status = 'rejected', reject_note = note, handled_by = (select auth.uid()) where id = w.id;
  insert into public.ledger (account_id, type, amount, transfer_id) values (w.account_id, 'withdrawal_returned', w.amount, w.id);
  perform private.admin_did('withdrawal_rejected', 'transfer', w.id, note);
end;
$$;

-- Closes a chat or order report with a reply the reporter sees.
create function public.resolve_report(report_id uuid, resolution text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.reports set status = 'resolved', resolution = resolve_report.resolution, resolved_by = (select auth.uid()), resolved_at = now()
  where id = report_id and status = 'open';
  if not found then
    raise exception 'No open report' using errcode = '55000';
  end if;
  perform private.admin_did('report_resolved', 'report', report_id, resolution);
end;
$$;
-- ---------- Scheduled jobs (pg_cron, see the cron migration) ----------

-- Offers nobody answered within 96 hours: expired, and the money goes back.
create function public.expire_offers() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  n integer := 0;
begin
  for o in select * from public.orders where status = 'pending' and created_at + private.offer_window() <= now() for update skip locked loop
    update public.orders set status = 'declined', decline_reason = 'expired', declined_at = now() where id = o.id;
    perform private.refund(o);
    perform private.log_event(o.id, 'expired', 'system');
    perform private.close_campaign_if_empty(o.campaign_id);
    n = n + 1;
  end loop;
  return n;
end;
$$;

-- Clips the brand hasn't reviewed within 7 days are approved, so creators always get paid.
create function public.auto_approve_orders() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  n integer := 0;
begin
  for o in select * from public.orders where status = 'delivered' and delivered_at + private.auto_approve_after() <= now() for update skip locked loop
    perform private.approve(o, 'system');
    n = n + 1;
  end loop;
  return n;
end;
$$;

-- "The deadline passed without the clip": once per deadline, for the brand's notifications.
create function public.mark_deadlines_passed() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  n integer := 0;
begin
  for o in
    select * from public.orders
    where status in ('pending', 'in_progress') and deadline < current_date
      and not exists (
        select 1 from public.order_events e
        where e.order_id = orders.id and e.type = 'deadline_passed' and e.data ->> 'deadline' = orders.deadline::text
      )
  loop
    perform private.log_event(o.id, 'deadline_passed', 'system', jsonb_build_object('deadline', o.deadline));
    n = n + 1;
  end loop;
  return n;
end;
$$;

-- ---------- Who can call what ----------

-- Supabase grants every new function to anon and authenticated by default: take that back, then
-- grant each one on purpose.
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
-- Only what policies and triggers call. The internal steps run inside the functions above.
grant execute on function
  private.fee_rate(), private.offer_window(), private.auto_approve_after(), private.is_active_market(text),
  private.is_admin(), private.my_account_id(), private.owns_brand(uuid), private.account_of_brand(uuid),
  private.creator_suspended(uuid), private.account_suspended(uuid), private.is_bookable(uuid),
  private.works_with_me(uuid), private.creator_on_campaign(uuid, boolean), private.can_see_order(uuid),
  private.in_conversation(uuid), private.account_balance(uuid),
  private.limit_addresses(), private.limit_portfolio(), private.set_message_sender(), private.guard_read_markers()
to authenticated;

grant execute on function
  public.has_name(text, text),
  public.submit_application(text),
  public.accept_offer(uuid, uuid, text),
  public.decline_offer(uuid, public.decline_reason, text),
  public.confirm_received(uuid),
  public.set_ad_code(uuid, text, integer),
  public.submit_clip(uuid, text, integer, bigint, text, text, integer),
  public.mark_approval_seen(uuid),
  public.checkout(uuid, jsonb, boolean),
  public.start_top_up(numeric),
  public.edit_campaign_details(uuid, text, text[], text, text),
  public.extend_deadline(uuid, date),
  public.withdraw_offer(uuid),
  public.mark_sent(uuid, text),
  public.request_revision(uuid, text),
  public.approve_order(uuid, smallint, text, boolean),
  public.rate_order(uuid, smallint),
  public.set_clip_public(uuid, boolean),
  public.mark_returned(uuid),
  public.request_withdrawal(numeric),
  public.set_bank_account(text, text),
  public.remove_bank_account(),
  public.decide_creator(uuid, public.creator_status, text),
  public.suspend(text, uuid, text),
  public.unsuspend(text, uuid),
  public.admin_set_deadline(uuid, date, text),
  public.admin_cancel_order(uuid, text),
  public.mark_payout_paid(uuid, uuid[], text),
  public.send_withdrawal(uuid, text),
  public.reject_withdrawal(uuid, text),
  public.resolve_report(uuid, text)
to authenticated;

-- The waitlist sheet works before signing in.
grant execute on function public.join_waitlist(text, text) to anon, authenticated;

-- The card webhook and the scheduled jobs run as the service role only.
grant execute on function
  public.confirm_payment(uuid, text, text),
  public.fail_payment(uuid, text, text),
  public.expire_offers(),
  public.auto_approve_orders(),
  public.mark_deadlines_passed()
to service_role;
