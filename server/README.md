# 100clips API

NestJS on the Supabase database, for the brand dashboard and the creator app.

The business logic lives here, in the services. The database keeps the safety rails: row-level
security, constraints and a few small triggers (`../supabase/migrations`).

- **Reads and simple own-row writes** (profile, brands, drafts) run **as the signed-in user inside
  Postgres** (role `authenticated`, `auth.uid()` = their id), so row-level security decides.
- **Business actions** (send for review, admin decisions, live campaign changes, and orders and money
  as they come) write tables users can't touch. They run as the service role (`elevated(caller)`): the
  service checks permissions itself (`common/db/access.ts`), locks the rows it changes
  (`select ... for update`), and records who acted.

## Run

```sh
cd server
npm install
cp .env.example .env   # then fill in DATABASE_URL (Supabase > Project Settings > Database)
npm run dev            # http://localhost:4000
```

Apps sign in with Supabase Auth as usual and send `Authorization: Bearer <access token>`.

## Test

```sh
npm test
```

Runs the API against the real migrations in PGlite (Postgres in WebAssembly), with fake tokens
(`user:<id>`). No database or network needed.

## Layout

```
src/
  main.ts                  start-up: reads .env, opens the pool, listens
  app.module.ts            the app: CoreModule + one module per feature; global pipe, filter, CORS, docs
  common/
    core.module.ts         Db and TokenVerifier for everyone, AuthGuard on every route
    auth/                  AuthGuard, @Public(), @CurrentCaller(), Supabase token check
    db/                    Db.run (one transaction as the caller), DbErrorFilter, database.types.ts (generated)
    openapi/               /docs setup, @ApiErrors(), shared property helpers, ErrorResponse
  <feature>/               health, waitlist, me, creators, brands, products, campaigns, creator-profile, admin
    <feature>.module.ts    the feature's parts list
    <feature>.controller.ts  HTTP only: routes, params, status codes, 404s
    <feature>.service.ts   the work: SQL through Db.run, business rules, permission checks for actions
    dto/                   request bodies and query strings, with validation
    entities/              response shapes for the docs; table rows `implements Tables<"…">`
```

### Conventions

- **No business logic in database functions.** Rules live in services. Run as the caller whenever
  row-level security covers it; use `elevated(caller)` only for actions, and then check permissions first.
- **Controllers never touch `Db`.** Services don't know HTTP: they return `undefined` for a plain "not
  found", or throw `InputError`, `ForbiddenError`, `NotFoundError`, `ConflictError` (`common/errors.ts`)
  with a message for people. `DbErrorFilter` turns those, and Postgres errors, into HTTP.
- **SQL is parameterized** (`$1, $2`). Column names come from fixed lists in code, never from requests.
- **Types come from the schema.** After a migration, run `npm run db:types` (needs `npx supabase@2 login` once).
  Entities that mirror a table `implements Tables<"table">`, so a schema change that breaks them fails
  to compile. Enum values (`ENUMS.niche`…) come from the same file.
- **Values:** numeric and bigint arrive as numbers, timestamps as ISO strings, enum arrays (niches) as lists (`TYPE_PARSERS`, `registerEnumArrays`).
- **Every endpoint has a test** in `test/api.test.ts`, run against the real migrations.

### Adding a feature

1. `src/<feature>/dto/*.dto.ts`: the input, with class-validator and `@ApiProperty` decorators.
2. `src/<feature>/entities/*.entity.ts`: the output.
3. `<feature>.service.ts`: the queries, through `db.run(caller, …)`.
4. `<feature>.controller.ts`: routes calling the service, with `@ApiOperation`, the response type and `@ApiErrors(...)`.
5. `<feature>.module.ts`, added to `imports` in `app.module.ts`.
6. Tests, then `npm run openapi`.

## Docs

With the API running: interactive docs at http://localhost:4000/docs, and the OpenAPI spec at
http://localhost:4000/openapi.json, with every endpoint's request body, response shape and error codes.
Import the spec into Apidog or Postman. `npm run openapi` writes the same spec to `openapi.json`
without a database.

The response shapes are the `entities/` classes. The tests check that real responses have exactly the
documented fields.

## Endpoints

| Method | Path | Who | What |
|---|---|---|---|
| GET | /health | anyone | API and database are up |
| POST | /waitlist | anyone | "Tell me when you launch" (country, contact) |
| GET | /me | signed in | Account, creator profile, brands |
| POST | /me | signed in | Create the account: role creator or brand |
| PATCH | /me | signed in | Edit my name and phone (settings) |
| GET | /creators | signed in | Explore bookable creators (niche, limit, offset) |
| GET | /creators/:id | signed in | Profile: prices, socials, portfolio, reviews, public clips |
| GET | /brands | brand owner | My brands |
| POST | /brands | brand owner | Add a brand |
| PATCH | /brands/:id | brand owner | Edit a brand |
| GET | /brands/:brandId/products | signed in | A brand's products |
| POST | /brands/:brandId/products | brand owner | Add a product (`details` must match `type`) |
| GET | /products/:id | signed in | A product |
| PATCH | /products/:id | brand owner | Edit a product (send `type` and `details` together) |
| DELETE | /products/:id | brand owner | Delete a product (409 once a campaign features it) |
| GET | /campaigns | signed in | Campaigns: owners see their brands', creators the ones offered to them (brand_id, status) |
| POST | /brands/:brandId/campaigns | brand owner | Start a draft (every field optional) |
| GET | /campaigns/:id | signed in | A campaign, with secrets for the owner and for creators who accepted |
| PATCH | /campaigns/:id | brand owner | Save a draft (409 once live) |
| DELETE | /campaigns/:id | brand owner | Delete a draft (409 once live) |
| POST | /campaigns/:id/copy | brand owner | Run again: a new draft with the same brief and secrets |
| PUT | /campaigns/:id/details | brand owner | Live: edit key message, references, must include, avoid (409 once a creator accepted) |
| PUT | /campaigns/:id/deadline | brand owner | Live: move the deadline later |
| PUT | /campaigns/:id/secrets | brand owner | App link, test account, code (creators see them once they accept) |
| GET | /me/creator | creator | My profile, prices, socials, samples, addresses and latest application |
| POST | /me/creator | creator | Create my creator profile (after POST /me with role creator) |
| PATCH | /me/creator | creator | Edit my profile |
| PUT | /me/creator/formats | creator | Set my prices (replaces the list) |
| PUT | /me/creator/socials | creator | Set my Instagram / TikTok usernames (replaces the list) |
| POST | /me/creator/portfolio | creator | Add a sample clip (up to 3, own uploads only) |
| DELETE | /me/creator/portfolio/:id | creator | Remove a sample |
| GET, POST | /me/creator/addresses | creator | My addresses / add one (up to 5) |
| PATCH, DELETE | /me/creator/addresses/:id | creator | Edit / remove an address |
| POST | /me/creator/application | creator | Send for review (says what's missing if incomplete) |
| GET | /admin/applications | admin | Creators waiting for review, with the previous application |
| POST | /admin/creators/:id/decision | admin | Approve, ask for changes or reject (note required unless approved) |

Database errors come back with their message: 400 invalid input, 403 not allowed, 404 not found,
409 wrong state or already exists.
