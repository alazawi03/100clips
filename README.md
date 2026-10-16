# 100clips

A UGC marketplace that connects brands with local content creators in the Gulf, starting in Bahrain. Brands hire creators to film short clips for TikTok, Instagram and YouTube, either directly from a creator's price list or through a campaign creators apply to.

This repo is the **brand dashboard** (web). The admin portal (`../admin-page`), the creator app (100clips-creators) and the backend (100clips-backend: the API and the Supabase database) are separate repos.

## Status

On the backend (`lib/api.ts` calls the API as the signed-in user): sign-in (Supabase Auth: email and
password, or Google), brands and products, Explore and creator profiles, the cart and saved lists,
campaigns (drafts, checkout, invite, run again, edit details, extend deadline), orders (ship, review,
revision, approve, rate, collect), notifications, and the balance and its history. `lib/data/live.ts` loads the account's data once per request in the
dashboard's shapes (`lib/data/types.ts`). Files are in Cloudflare R2.

Card payments aren't live yet: the card form is a mock, and a payment with a card part waits until an
admin confirms it (`POST /admin/payments/{id}/confirm`, standing in for the card provider). Then the offers go out.

Still sample data (`lib/data/`, in memory until the dev server restarts), with a "demo data" banner:
messages (chat), the bank account and withdrawals (settings), and problem reports.

## Run it

```bash
npm install
cp .env.example .env.local   # Supabase project and the API's address
npm run dev
```

The API must be running (`npm run dev` in 100clips-backend, on http://localhost:4000). After an API change, `npm run api:types` regenerates `lib/api-types.ts` from the backend's `openapi.json` (the two repos side by side).

Open http://localhost:3000. The home page redirects to `/dashboard`.

## Where things are

- `app/(app)/` — dashboard screens (explore, campaigns, orders, brands, balance, messages)
- `app/actions/` — server actions behind the forms
- `lib/data/` — types, sample data and the in-memory store
- `lib/i18n/` — Arabic and English text (Arabic and RTL first)
- `DESIGN.ar.md` — the design system (Arabic)
