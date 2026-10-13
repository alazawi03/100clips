# 100clips

A UGC marketplace that connects brands with local content creators in the Gulf, starting in Bahrain. Brands hire creators to film short clips for TikTok, Instagram and YouTube, either directly from a creator's price list or through a campaign creators apply to.

This repo is the **brand dashboard** (web) and the admin panel. The creator app (100clips-creators) and the backend (100clips-backend: the API and the Supabase database) are separate repos.

## Status

Sign-in (Supabase Auth: email and password, or Google), brands, products, Explore, creator profiles and admin approvals run on the backend (`lib/api.ts` calls the API as the signed-in user; logos and photos go to Supabase Storage). Campaigns, cart, checkout, orders, messages and the balance still run on sample data from `lib/data/` (`lib/data/store.ts` keeps changes in memory until the dev server restarts); those pages say so with a "demo data" banner.

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
