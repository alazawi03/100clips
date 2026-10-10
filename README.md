# 100clips

A UGC marketplace that connects brands with local content creators in the Gulf, starting in Bahrain. Brands hire creators to film short clips for TikTok, Instagram and YouTube, either directly from a creator's price list or through a campaign creators apply to.

This repo is the **brand dashboard** (web). The creator app (mobile) is separate.

## Status

Front-end prototype. Every screen runs on sample data from `lib/data/`, and `lib/data/store.ts` keeps changes in memory until the dev server restarts. Login, sign-up, notifications and settings are placeholders. There is no backend, payment or file storage yet.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The home page redirects to `/dashboard`.

## Where things are

- `app/(app)/` — dashboard screens (explore, campaigns, orders, brands, balance, messages)
- `app/actions/` — server actions behind the forms
- `lib/data/` — types, sample data and the in-memory store
- `lib/i18n/` — Arabic and English text (Arabic and RTL first)
- `DESIGN.ar.md` — the design system (Arabic)
