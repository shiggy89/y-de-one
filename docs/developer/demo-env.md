# Demo environment (demo.y-de-one.com)

A separate Vercel project that serves the same code with `NEXT_PUBLIC_DEMO_MODE=true`.
It uses its **own Supabase project** with fictional data. Never point it at production.

## Environment variables (demo Vercel project only)

```bash
NEXT_PUBLIC_DEMO_MODE=true

# Demo Supabase project (NOT production)
NEXT_PUBLIC_SUPABASE_URL=https://<demo-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<demo project service role key>
# Safety lock: demo sign-in only works when this equals NEXT_PUBLIC_SUPABASE_URL.
DEMO_SUPABASE_URL=https://<demo-project-ref>.supabase.co

NEXT_PUBLIC_BASE_URL=https://demo.y-de-one.com
CRON_SECRET=<random string>

# Cloudflare Turnstile official test keys (always pass, no real challenge)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

## Do NOT set in the demo project

`LINE_*`, `NEXT_PUBLIC_LIFF_ID`, `RESEND_API_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`,
`MICROCMS_*`, `GEMINI_API_KEY`, `ANALYTICS_PASSWORD`, and any production Supabase key.
The code also skips every LINE / email send when `NEXT_PUBLIC_DEMO_MODE=true`.

## URLs in the demo

| URL | What it shows |
|---|---|
| `/` | Entry page (a middleware rewrite to `/demo`, so the address stays `/`) |
| `/ja` | The Japanese school website (rewrite to `/`) |
| `/en` | The English school website |
| `/admin`, `/mypage`, `/trial` | The app screens (phone-sized frame on desktop) |

The rewrites exist only when `NEXT_PUBLIC_DEMO_MODE=true`. Production keeps `/` as the Japanese home page.

## What demo mode changes

| Area | Behavior |
|---|---|
| Sign-in | No LINE. `/demo` picks a role (admin / member / guest) and stores it in a host-only cookie. |
| Identity | Fixed fictional LINE IDs (`lib/demo.ts`). Guests get a random one, so a visitor's trial booking appears in the admin panel. |
| Messages | LINE push, broadcast, direct messages, contact emails and the LINE webhook are disabled. |
| Trial CTA | Points to `/trial` instead of the official LINE account. |
| Uploads | Images up to 2 MB only. |
| SEO | `noindex` meta + `X-Robots-Tag`, no sitemap, no Google Analytics. |
| Safety lock | Demo sign-in refuses to work unless `DEMO_SUPABASE_URL` matches the connected database. |

## Custom domain

`demo.y-de-one.com`: add the domain to the demo Vercel project, then create the DNS record Vercel shows
(a CNAME on the `demo` host). Cookies are host-only, so they never reach `y-de-one.com`.

## Fictional data and the daily reset

`lib/demoSeed.ts` builds 21 fictional people, ~530 attendance records for the last four months, badges,
announcements, posts and news. Prices follow the real rules (old rates before 2026-09, new rates from 2026-09).
It is generated relative to "today", so the newest month always has attendance.

- **Set up the schema once:** run `supabase/demo/schema.sql` against the demo project (SQL editor or `psql`).
- **Reset / first seed:** `GET /api/cron/reset-demo` with `Authorization: Bearer $CRON_SECRET`.
  Vercel Cron calls it daily at 03:00 JST (`vercel.json`). In production it returns 404.
- The demo admin is user id 14 (the app treats ids 14 and 15 as super admins). The reset checks this and stops if it changes.
- Demo accounts: admin (`Demo Admin`), student (`Demo Member`: silver last month, bronze this month), plus visitors
  who book a trial lesson, who then show up in the admin panel.
