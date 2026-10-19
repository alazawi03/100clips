# 100clips

A UGC marketplace that connects brands with local content creators in the Gulf, starting in Bahrain. Brands hire creators to film short clips for TikTok, Instagram and YouTube, either directly from a creator's price list or through a campaign creators apply to.

This repo is the **brand dashboard** (web). The admin portal (`../admin-page`), the creator app (100clips-creators) and the backend (100clips-backend: the API and the Supabase database) are separate repos.

## Status

On the backend (`lib/api.ts` calls the API as the signed-in user): sign-in (Supabase Auth: email and
password, or Google), brands and products, Explore and creator profiles, the cart and saved lists,
campaigns (drafts, checkout, invite, run again, edit details, extend deadline), orders (ship, review,
revision, approve, rate, collect), notifications, messages (chat), problem reports on orders, the balance and its history, and the bank account and withdrawals (Settings). `lib/data/live.ts` loads the account's data once per request in the
dashboard's shapes (`lib/data/types.ts`). Files are in Cloudflare R2.

There are no card fields: the card part of a checkout or top-up is paid on Gate-E's page. With Gate-E set up
on the API (`GET /settings` says `card_online`), the brand goes to its page and comes back to `/payments/{id}`, which
checks until it's paid or failed. Without it, laqta sends a payment link and an admin confirms the payment
(`POST /admin/payments/{id}/confirm`). Then the offers go out.

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
- `lib/data/` — types, and the API calls in the dashboard's shapes (`live.ts`, `*Api.ts`)
- `lib/i18n/` — Arabic and English text (Arabic and RTL first)
- `DESIGN.ar.md` — the design system (Arabic)
