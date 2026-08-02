# Travel Art — Engineering Handoff

**Written 2026-08-02.** Branch `security-fixes-and-vercel-migration`, 27 commits ahead of `master`, never merged.
Production: <https://travel-art.vercel.app> (Vercel Hobby).

> **Provenance.** This document was written by reading the repository on 2026-08-02, not from
> memory of having designed it. Claims below are marked **[verified]** when I executed something
> to confirm them, and **[unverified]** when they are read from source only. Treat unverified
> claims as leads, not facts.

---

## PART 0 — Corrections to the brief

The handoff template asked about several systems. Four do not exist in this repository, and I
found no trace of them ever existing. Do not go looking:

| Asked about | Reality |
|---|---|
| **Creative Engine** — timeline, plates, shots, compositions, MP4 export, FFmpeg, Remotion, browser rendering | **Does not exist.** No dependency, import, or source reference. `grep -riE "remotion\|ffmpeg\|timeline\|composition"` over all three `package.json` files and both `src` trees returns nothing. **[verified]** |
| **AI pipeline** — models, prompts, providers, fallbacks, image/video/caption generation | **Does not exist.** No `openai`, `anthropic`, `@ai-sdk`, `langchain`, `replicate`, `stability`, `elevenlabs`. No prompts anywhere. **[verified]** |
| **Queues / workers** — BullMQ, Redis, SQS, cron, background jobs | **Does not exist.** All work is synchronous inside the request. **[verified]** |
| **Next.js / monorepo** — App Router, server actions, RSC, streaming, Turborepo, workspaces | **Not Next.js.** Vite + React SPA with client-side routing. Not a real monorepo — three independent `package.json` files with three separate lockfiles and no `workspaces` key. **[verified]** |

Also absent: organizations, tickets, tables, venues, promoters, CRM, growth engine. `PART 8` is
answerable only for credits, billing, Stripe, RBAC, artists, bookings, referrals.

---

## PART 1 — Executive overview

**What it is.** A two-sided marketplace connecting **luxury hotels** with **performing artists**.
Hotels buy *credits*, spend credits to book artists for residencies/performances; artists get paid
stays and exposure. There is a public discovery surface (artist/hotel directories, rankings,
"experiences"), an artist dashboard, a hotel dashboard, and an admin back office.

**Problem solved.** Hotels sourcing live entertainment do it ad hoc through agents and personal
networks. Artists lack a channel to reach venues that offer accommodation-in-kind. The credit
system standardises price discovery so neither side negotiates cash per booking.

**Target users.** Three roles, hard-coded in the schema as `User.role`: `ARTIST`, `HOTEL`, `ADMIN`.

**Business model.** Two revenue lines in code:
1. **Credit packages** — hotels buy credit bundles via Stripe Checkout. Seeded: Starter (10 credits,
   €1,500), Professional (25+4 credits, €3,500), and a third package. Prices live in the
   `CreditPackage` table and are the single source of truth — never the request body.
2. **Artist memberships** — `Membership` model with `MembershipTier`/`MembershipStatus` enums and a
   `/api/payments/membership` endpoint. **Not wired to Stripe.** See Part 9.

**Maturity: late prototype / pre-beta.** It deploys, the database is real, auth works, and the
credit purchase flow opens a genuine Stripe Checkout Session. But Stripe is in **test mode**, no
payment has ever completed end-to-end, and until today registration was returning HTTP 500 in
production. Do not call this beta until a real charge has granted real credits.

**Biggest technical decisions**
- **Credits are never minted by a client-controlled request.** `/payments/credits/purchase` only
  opens a Checkout Session; the balance moves in the signature-verified webhook, inside a
  transaction, writing an append-only `CreditLedger` row. This is the single best design decision
  in the codebase.
- **Prices read from the database, not the request.** Prevents client-side price tampering.
- **Stripe Checkout (hosted) over a first-party card form.** Card data never touches this origin,
  keeping it out of PCI-DSS SAQ-D. A mock first-party form existed and was deleted (`0de1335`).
- **Single Vercel project**: Vite static output on the CDN + Express as one serverless function
  under `/api`. Chosen over a split static-site/API deployment, which is what caused every deep
  link to 404 in production.

**Biggest compromises**
- No queue. Anything slow blocks the request.
- No CI gate on merge (workflows exist; see Part 10).
- Backend integration tests cannot run against the only configured database.
- `simple-db.ts` and `db.ts` are two overlapping data-access layers.
- 163 `console.*` calls in frontend, 114 in backend, shipped as-is.

---

## PART 2 — Architecture

```
Travel Arts/
├── api/index.ts            ← Vercel entry: re-exports the Express app
├── vercel.json             ← build + rewrites + Prisma engine bundling
├── render.yaml             ← alternative single-host deploy (NOT in use)
├── package.json            ← orchestrator scripts only (no workspaces)
├── backend/                ← Express + Prisma + Postgres
│   ├── prisma/schema.prisma
│   ├── prisma/migrations/  ← 3 migrations
│   └── src/
│       ├── index.ts        ← app assembly, middleware, health, static SPA
│       ├── config.ts       ← env → typed config, fails hard on weak JWT secret
│       ├── db.ts           ← PrismaClient singleton + dbQuery helper
│       ├── simple-db.ts    ← second data-access layer (overlaps db.ts)
│       ├── middleware/     ← auth (authenticate/authorize), errorHandler
│       └── routes/         ← 10 route modules
└── frontend/               ← Vite + React 18 + TS + Tailwind + Zustand
    └── src/{pages,components,store,utils}
```

**Build.** Root `npm run build` → `build:backend` (`prisma generate` + `tsc` → `backend/dist`) then
`build:frontend` (`vite build` → `frontend/dist`). Vercel runs `vercel-build`, same thing.

**Deployment — how it actually works.** This matters; it was got wrong twice.
- `outputDirectory: frontend/dist` — hashed assets served from Vercel's CDN with
  `Cache-Control: public, max-age=31536000, immutable`. **[verified]**
- `api/index.ts` re-exports the Express app as **one** function. One function = one warm instance =
  one Prisma pool, which matters against pooled Neon.
- Rewrites, in order: `/api/(.*)` → the function; `/((?!api/).*)` → `/index.html` (SPA fallback).
- `functions["api/index.ts"].includeFiles: "backend/node_modules/.prisma/client/**"` — **do not
  remove this.** Without it the 16.1 MB `rhel-openssl-3.0.x` query engine is not bundled and every
  database route fails while non-DB routes appear healthy.
- `backend/src/index.ts` skips `app.listen` when `process.env.VERCEL` is set.
- `framework: null` overrides a stale dashboard setting of `services`.

**Environments.** Vercel Production / Preview / Development. Preview lacks `JWT_SECRET`,
`STRIPE_*`, `FRONTEND_URL` → **auth and payments do not work on preview deployments.** Known gap.

**Storage.** Vercel Blob store `travel-art-uploads` (`store_QCS7VQ7IfK7JMtZo`, region `iad1`,
public access). `upload.ts` switches on `BLOB_READ_WRITE_TOKEN`; without it, it writes to local disk,
which on serverless is ephemeral and loses every upload. Token is set on all three environments.
Upload → fetch verified working. **[verified]**

**Auth.** Stateless JWT. `authenticate` verifies the token then re-reads the user from the database
and rejects `isActive: false`, so suspension takes effect immediately rather than at token expiry —
good. `authorize(...roles)` is a separate guard. Token is held in Zustand with `persist`
(localStorage). No refresh-token rotation; `/auth/refresh` reissues from a valid token.

**Database.** Neon Postgres, `us-east-1`, project `ep-round-dream-av7wcmzl`. Prisma needs **both**
`DATABASE_URL` (pooled) and `DIRECT_URL` (non-pooled, for migrations) — `schema.prisma:14` declares
`directUrl`, and Prisma throws at client init if it is missing.

---

## PART 3 — Database

13 models, 5 enums, 38 index/unique declarations, 481 lines, 3 migrations
(`init` → `billing_core` → `artist_credit_cost`). Schema is up to date against production. **[verified]**

| Model | Responsibility |
|---|---|
| `User` | Identity, `role` (ARTIST/HOTEL/ADMIN), `passwordHash`, `isActive`. Root of both profiles. |
| `Artist` | Artist profile: stage name, discipline, bio, media JSON, `referralCode`, `loyaltyPoints`, membership status, per-artist booking credit cost. |
| `Hotel` | Hotel profile owned by a `User`. |
| `Availability` / `ArtistAvailability` | Date windows for hotels and artists respectively. |
| `Booking` | The core transaction. Links hotel + artist + dates + status. |
| `Rating` | Post-stay reviews. |
| `Credit` | Hotel credit **balance** (mutable). |
| `CreditLedger` | **Append-only** history of credit movements, with `LedgerReason`. The audit trail; `Credit` is the cached head. |
| `CreditPackage` | Purchasable bundles. Price authority. |
| `Membership` | Artist subscription tier/status. Largely inert. |
| `Payment` | Stripe payment record; `PENDING` written before redirect so a completed charge always has a row. Holds `stripeSessionId`. |
| `Payout` | Artist payouts. **No endpoint writes this.** |
| `WebhookEvent` | Stripe event de-duplication — the idempotency guard. |
| `Transaction`, `Referral`, `Notification`, `AdminLog`, `Trip` | Supporting. `Trip` powers the public "experiences" pages. |

**Enums.** `LedgerReason`, `MembershipTier`, `MembershipStatus`, `PaymentStatus`, `PayoutStatus`.

**Triggers.** None. No database-level triggers or stored procedures. All invariants are enforced in
application code — which means a direct SQL write bypasses every rule.

**The one query that matters.** `webhooks.ts` on `checkout.session.completed`: inside a single
`$transaction`, insert `WebhookEvent` (dedupe), flip `Payment` to succeeded, append `CreditLedger`,
increment `Credit`. If you change one thing about credits, do not break this atomicity.

---

## PART 4 — Backend API

10 route modules. Auth column: `—` public, `JWT` any authenticated user, `ROLE` role-gated.

### `/api/auth` (auth.ts)
| Route | M | Auth | Notes |
|---|---|---|---|
| `/register` | POST | — | Zod-validated. bcrypt cost 12. Creates User + Artist/Hotel profile, generates referral code, attributes referrals. **Was returning 500 in production until `27e243b`.** |
| `/login` | POST | — | Returns JWT. **No dedicated brute-force limit** — see Part 10. |
| `/refresh` | POST | JWT | Reissues from a still-valid token. No rotation, no revocation list. |
| `/me` | GET | JWT | **Was leaking `passwordHash` to the client until `27e243b`.** |
| `/forgot-password` | POST | — | Reset token is a JWT bound to a fingerprint of the current password hash, making it single-use without a table. Good design. Always returns success to avoid account enumeration. |
| `/reset-password` | POST | — | Validates the fingerprint. |

### `/api/artists` (artists.ts)
`GET /` public list (paginated) · `GET /:id` public profile · `GET /me`, `PUT /me`, `POST /`,
`DELETE /:id`, `POST /:id/availability` role-gated `ARTIST`.

### `/api/hotels` (hotels.ts) — 13 endpoints, the largest module
`GET /` (ADMIN) · `GET /user/:userId` (JWT, **ownership-checked**: non-admin must match `req.user.id`
**[verified]**) · `GET /me`, `PUT /me`, `POST /`, `DELETE /:id`, `POST /:id/rooms`,
`GET /:id/credits`, `GET /:id/artists`, `POST /:id/bookings`,
`POST /:id/bookings/:bookingId/confirm`, `POST /:id/bookings/:bookingId/rate` — all `HOTEL`.

### `/api/bookings` (bookings.ts)
`GET /`, `GET /:id`, `POST /`, `PATCH /:id/status`, `POST /ratings` — all JWT.
`PATCH /:id/status` resolves the caller's Artist/Hotel record and compares ownership before
allowing a transition **[verified]**. Uses `$transaction` for credit charge/refund.

### `/api/payments` (payments.ts) — read this module first
| Route | M | Auth | Notes |
|---|---|---|---|
| `/packages` | GET | — | Public price list from DB. |
| `/credits/purchase` | POST | HOTEL | **The money path.** Verifies hotel ownership, looks the package up by id *or* slug, refuses with 503 if Stripe unconfigured, writes `Payment(PENDING)`, opens Checkout Session with `client_reference_id` + metadata, stores `stripeSessionId`. Grants **zero** credits. **[verified end-to-end in production]** |
| `/membership` | POST | ARTIST | Sets membership without any payment. **Dangerous — see Part 9.** |
| `/transactions` | GET | JWT | History. |

### `/api/payments/webhook` (webhooks.ts)
Single `POST /`. Mounted with `express.raw()` **before** `express.json()` at `index.ts:115` — this
ordering is load-bearing; parsing first would re-serialise the body and break every signature check.
Verifies signature, de-dupes via `WebhookEvent`, grants credits transactionally, acknowledges and
drops event types it does not act on.

### `/api/upload` (upload.ts)
`POST /profile-picture`, `POST /media` (≤10 files), `DELETE /file`. Multer memory storage, 5 MB cap,
MIME allowlist (jpeg/png/gif/webp), UUID filenames — so **no path traversal via filename**.

### `/api/admin` (admin.ts) — 11 endpoints, all `ADMIN`
Dashboard, suspend/activate user, CSV export, users, bookings, logs, per-hotel and per-artist logs,
activities, referrals.

### `/api/trips`, `/api` (common.ts)
2 public trip endpoints. `common.ts`: `/referrals` (GET/POST, JWT), `/top`, `/stats`,
`/testimonials` (public).

**Unused / dead.** `dbQuery()` in `db.ts:108` wraps `$queryRawUnsafe` and **is called by no route**
**[verified]**. It is the only raw-SQL surface in the codebase; deleting it removes the SQL-injection
class entirely.

**Deprecated.** `simple-db.ts` overlaps `db.ts`; `auth.ts` uses both. `User.clerkId` survives a
removed Clerk integration.

**Dangerous.** `POST /api/payments/membership` — grants membership with no payment. `POST
/api/admin/users/:id/suspend|activate` — no confirmation, no audit of *who* suspended.

---

## PART 5 — Frontend

Vite + React 18 + TypeScript + Tailwind + Zustand. **37 pages, 46 components, 7 test files.**

**Routing.** `react-router-dom` in `App.tsx`. Every page is `lazy(() => import(...))` behind
`<Suspense>`, wrapped in `<PageTransition>`. Because it is client-side routing, deep links depend
entirely on the server returning `index.html` for unknown paths — the bug that took three attempts
to fix. There is no SSR, no streaming, no server actions, no RSC.

**State.** `authStore.ts` (Zustand + `persist` → localStorage) holds `user` and `token`; session
persists until explicit logout. `react-query@3` is a dependency; usage is thin — most pages call
`utils/api.ts` (axios) directly in `useEffect`. There is **no query cache strategy, no optimistic
updates, no invalidation discipline**. Treat "caching" as unimplemented.

**API layer.** `utils/api.ts` — axios instance, base URL defaults to relative `/api` (correct for
same-origin; do not set an absolute `VITE_API_URL`), attaches `Authorization: Bearer`.

**Pages.** Public: Landing, Pricing, HowItWorks, About, Partners, Terms, Privacy, CookiePolicy,
TopArtists, TopHotels, TravelerExperiences, ExperienceDetails, HotelDetails, PublicArtistProfile,
Login, Register, Forgot/ResetPassword, ReferralRedirect. Artist: Dashboard, Profile, Bookings,
Membership, Referrals. Hotel: Dashboard, Profile, Artists, Bookings, Credits. Admin: Dashboard,
Users, Bookings, Analytics, Logs, Moderation, Referrals.

**Theme.** Single dark theme, fixed via `class="dark"` on `<html>` in `index.html` — deliberately not
following OS preference. Tokens in one 1,386-line `index.css`. Contrast was swept across 13 routes:
0 pairs below 3:1.

**Error boundaries.** `ErrorBoundary.tsx` wired in `App.tsx`. **[verified]**

**Bundle.** Main chunk **634 KB uncompressed / 191 KB gzip**, over Vite's 500 KB warning. Route
chunks are properly split. `AdminAnalytics` is 386 KB — recharts, loaded only for admins.

**i18n is dead code.** `utils/i18n.ts` is 258 lines supporting `en|fr|es|de|it`. It is imported by
exactly one file, `LanguageSwitcher.tsx`, which is **rendered nowhere**. `useTranslation` appears in
zero files. The site is English-only. **[verified]**

---

## PART 6 & 7 — Creative Engine / AI

**Neither exists.** See Part 0. There is no timeline, composition, plate, shot, render pipeline,
video export, FFmpeg, Remotion, browser rendering, model, prompt, provider, fallback, or rate limit
on any AI service, because there is no AI service. Anyone who tells you otherwise has not run the
greps.

---

## PART 8 — Business logic

**Credits.** `Credit` = mutable balance; `CreditLedger` = append-only truth with a `LedgerReason`.
Bookings charge and refund credits inside `$transaction`. Per-artist booking cost is modelled
(`artist_credit_cost` migration).

**Billing / Stripe.** Checkout Sessions only. `STRIPE_SECRET_KEY` on production is a **test-mode
key** — session ids come back `cs_test_`, `livemode: false` **[verified]**. No real money can move
today. Webhook secret is set; endpoint is `/api/payments/webhook`.

**Subscriptions / plans.** `Membership` + tier/status enums exist; the endpoint sets status without
payment. Effectively unimplemented.

**RBAC.** Three roles, enforced by `authorize()` per route plus per-resource ownership checks in
handlers. Spot-checked on `hotels /user/:userId` and `bookings PATCH /:id/status` — both correct
**[verified]**. I did not audit all 50+ endpoints for ownership.

**Referrals.** Artists get a unique code; registering with it creates a `Referral` and grants 100
loyalty points to both sides. Wrapped in try/catch so failure does not break signup.

**Analytics.** Admin-only aggregates computed in-request with Prisma. No warehouse, no event stream.

**Not present:** organizations, tickets, tables, venues, promoters, CRM, growth engine.

---

## PART 9 — Current state, honestly

**Finished and verified working in production**
- Deep links / SPA routing on all public routes **[verified]**
- Registration → login → `/auth/me` **[verified, fixed today]**
- Public artist/hotel/package/trip reads against real data (14 artists, 24 users) **[verified]**
- Stripe Checkout Session creation with correct `success_url` **[verified]**
- Blob uploads persisting and publicly readable **[verified]**
- Auth middleware, RBAC guards, ownership checks (spot-checked)
- CORS allowlist, helmet, global rate limit

**Never proven end-to-end**
- **A completed payment granting credits.** The webhook path is well designed but no charge has ever
  run through it. This is the single most important untested path in the product.
- Password reset email (no SMTP configured).
- Booking lifecycle beyond unit level.

**Mocked / fake / inert**
- ~~`/payment` mock card form~~ — **deleted** in `0de1335`.
- Artist membership: sets status with no payment.
- `Payout` model: no code writes it.
- i18n: 258 lines, five languages, zero call sites.
- `User.clerkId`: vestigial.

**Technical debt**
- Two data-access layers (`db.ts` + `simple-db.ts`).
- 277 `console.*` calls shipped.
- Backend integration tests cannot run against the configured DB (guard from `32d26d8` refuses
  non-disposable databases — correct behaviour, but it means **0 backend tests run locally**).
- `dbQuery`/`$queryRawUnsafe` dead code.
- ESLint config broken in `backend` (`@typescript-eslint/recommended` unresolvable) **[verified]**.

**Should never go to production as-is**
1. Stripe **test** keys — payments cannot be taken.
2. `POST /payments/membership` granting paid status for free.
3. Vercel **Hobby plan forbids commercial use**; this site takes payments.

---

## PART 10 — Audit findings

Ranked. "None found" entries were actually checked.

### Critical
| # | Finding | Evidence |
|---|---|---|
| C1 | **Free membership.** `POST /api/payments/membership` sets membership without charging. | `payments.ts:159` |
| C2 | **Stripe in test mode on production.** No revenue possible; also means the webhook has never run for real. | `livemode:false` **[verified]** |

### High
| # | Finding | Evidence |
|---|---|---|
| H1 | **No brute-force protection on `/auth/login`.** Only the global 100-req/15-min limiter, shared across all `/api/` traffic and keyed per IP. Credential stuffing is cheap. | `auth.ts`, `index.ts:120` |
| H2 | **JWT in localStorage.** Any XSS = full account takeover; no HttpOnly cookie, no rotation, no revocation. Mitigating: **no `dangerouslySetInnerHTML` anywhere [verified]**, so no obvious XSS sink today. | `authStore.ts` |
| H3 | **Preview environments lack `JWT_SECRET`/Stripe/`FRONTEND_URL`** — preview deploys silently misbehave, so testing there gives false signal. | `vercel env ls` **[verified]** |
| H4 | **No CI gate.** Three workflows exist but the branch has never been merged and nothing blocks a bad push. | `.github/workflows/` |
| H5 | **0 backend tests executable.** 10 suites, all refuse to run against the only configured DB. | **[verified]** |

### Medium
| # | Finding |
|---|---|
| M1 | `dbQuery()` → `$queryRawUnsafe`, dead but reachable if anyone imports it. Delete it. |
| M2 | 634 KB main bundle (191 KB gzip), over Vite's warning threshold. |
| M3 | 277 `console.*` calls; some log user emails and referral data to server logs. |
| M4 | No transactions around multi-write signup (User → Artist → Referral → points). Partial state possible on failure. |
| M5 | Two data-access layers; `auth.ts` imports both. |
| M6 | Broken ESLint config in `backend` — lint has never actually run there. |
| M7 | i18n dead code, ~260 lines + a rendered-nowhere component. |
| M8 | No monitoring/alerting; no Sentry; errors only in Vercel logs. |

### Low
Missing `SECURITY.md`; no dependency scanning; `README` stale; five stray analysis `.md` files at
repo root; `POST /refresh` has no rotation.

### Explicitly checked, none found
**SQL injection** (Prisma parameterised everywhere; the one raw helper is unused) · **XSS sinks**
(`dangerouslySetInnerHTML`: 0) · **command injection** (`eval`/`child_process`/`spawn`: 0) ·
**path traversal in uploads** (UUID filenames, MIME allowlist, 5 MB cap) · **open redirects** ·
**SSRF** (no server-side fetch of user URLs) · **missing security headers** (helmet with a real CSP,
HSTS via `upgrade-insecure-requests`) · **credentials in git** (scanned all 27 commit diffs
**[verified]**).

---

## PART 11 — Production checklist

| Rank | Blocker | Effort |
|---|---|---|
| **Critical** | Swap Stripe to live keys; re-point webhook; complete one real purchase and confirm credits land | 2–4 h |
| **Critical** | Gate or remove `POST /payments/membership` | 1 h |
| **Critical** | Move off Vercel Hobby (commercial use) → Pro | 15 min + $20/mo |
| **High** | Login rate limiting | 1 h ← *fixed today* |
| **High** | Make backend tests runnable (disposable test DB in CI) | 4–6 h |
| **High** | Add `JWT_SECRET`/Stripe/`FRONTEND_URL` to Preview | 30 min |
| **High** | Turn on a CI gate; merge branch to `master` | 2–3 h |
| **Medium** | Transaction around signup | 2 h |
| **Medium** | Delete `dbQuery`, i18n dead code, strip console logs | 3 h |
| **Medium** | Error monitoring (Sentry) | 2 h |
| **Medium** | Fix backend ESLint config | 1 h |
| **Low** | Bundle trim, README, SECURITY.md | 4 h |

**Realistic path to a defensible production launch: ~3 focused days.**

---

## PART 12/13 — What I fixed and verified today

Scope note: I did **not** "fix everything." Fixing C1 changes product behaviour and is your call;
C2 needs your Stripe account. I fixed what was safe and behaviour-preserving. See git log for the
full list; today's commits are `323ea6c`, `27e243b`, and the rate-limit commit accompanying this
document.

Verification actually executed today: typecheck (clean), frontend tests (**42/42 pass**), frontend
build (green), production smoke tests of 13 routes + 6 API endpoints, a live register→login→me→
checkout-session flow, and a live Blob upload→fetch. Backend tests **cannot run** — see H5. Test
data was deleted afterwards; the database is back to 24 users / 14 artists **[verified]**.

---

## Start here (first day)

1. Read `backend/src/routes/webhooks.ts` and `payments.ts` — the money path.
2. Read `backend/src/index.ts` top-to-bottom — middleware order is load-bearing.
3. Read `vercel.json` — the three lines that break production if edited carelessly.
4. `npm run dev` needs `backend/.env` (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` ≥32 chars).
5. Do not point backend tests at the production `DATABASE_URL`; the guard will refuse, and it is right.
