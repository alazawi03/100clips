# 100clips API

NestJS on the Supabase database, for the brand dashboard and the creator app.

Each request runs **as the signed-in user inside Postgres** (role `authenticated`, `auth.uid()` = their
id), so the row-level security and the database functions in `../supabase/migrations` are the rules.
The API checks the Supabase token, validates input, and shapes responses; it doesn't repeat permission
checks.

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
  <feature>/               health, waitlist, me, creators, brands
    <feature>.module.ts    the feature's parts list
    <feature>.controller.ts  HTTP only: routes, params, status codes, 404s
    <feature>.service.ts   the work: SQL and database function calls through Db.run
    dto/                   request bodies and query strings, with validation
    entities/              response shapes for the docs; table rows `implements Tables<"…">`
```

### Conventions

- **The database decides permissions.** Services run every query with `db.run(caller, …)`, so row-level
  security and the database functions apply. No permission checks in TypeScript.
- **Controllers never touch `Db`**; services never throw HTTP errors (they return `undefined` for "not
  found", and the controller turns it into a 404). Database refusals become HTTP in `DbErrorFilter`.
- **SQL is parameterized** (`$1, $2`). Column names come from fixed lists in code, never from requests.
- **Types come from the schema.** After a migration, run `npm run db:types` (needs `npx supabase@2 login` once).
  Entities that mirror a table `implements Tables<"table">`, so a schema change that breaks them fails
  to compile. Enum values (`ENUMS.niche`…) come from the same file.
- **Values:** numeric and bigint arrive as numbers, timestamps as ISO strings (`TYPE_PARSERS`).
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
| GET | /creators | signed in | Explore bookable creators (niche, limit, offset) |
| GET | /creators/:id | signed in | Profile: prices, socials, portfolio, reviews, public clips |
| GET | /brands | brand owner | My brands |
| POST | /brands | brand owner | Add a brand |
| PATCH | /brands/:id | brand owner | Edit a brand |

Database errors come back with their message: 400 invalid input, 403 not allowed, 404 not found,
409 wrong state or already exists.
