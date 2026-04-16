# Y-de-ONE Ballet School — LINE LIFF App

A full-stack web application for Y-de-ONE ballet school, built as a LINE LIFF (LINE Front-end Framework) mini-app. Students can book trial lessons, register as members, track attendance badges, and manage their profile — all within the LINE ecosystem.

**Live:** https://y-de-one.vercel.app

---

## Features

### Student-facing (LIFF)
- **Trial lesson booking** — date picker with time slots filtered by class type (Ballet / Modern Ballet) and day of week
- **Member registration** — saves LINE profile (name, avatar) to database
- **My Page** — lesson attendance history, badge progression, personalized banner
- **Badge system** — Bronze / Silver / Gold / Platinum / Diamond based on monthly attendance count; achievement popup with confetti animation on first login of each month

### Admin panel (LIFF, restricted)
- Attendance log viewer per member
- Badge management
- Access restricted to admin-flagged users in database

### Backend / API
- Trial form submission → stores to Supabase + pushes LINE message to student and admin(s)
- Duplicate member detection on registration
- Badge calculation from lesson history

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | CSS Modules |
| Auth / Identity | LINE LIFF SDK |
| Database | Supabase (PostgreSQL) |
| CMS | microCMS (news & blog) |
| Messaging | LINE Messaging API |
| Hosting | Vercel |

---

## Project Structure

```
app/
  (site)/             # Public marketing pages (top, class, price)
  trial/              # Trial lesson booking form (LIFF)
  register/           # Member registration form (LIFF)
  mypage/             # Student dashboard (LIFF)
  admin/              # Admin panel (LIFF, restricted)
  api/
    trial/            # POST: submit trial booking, send LINE messages
    register/         # POST: register member with LINE profile
    mypage/me/        # GET: fetch profile, badges, lesson history
    admin/            # GET: fetch all members for admin view
  _components/        # Shared UI components (Heading2, Header, Footer, etc.)

lib/
  supabase.ts         # Supabase client (public + admin)
  microcms.ts         # microCMS client

middleware.ts         # Handles LIFF external browser redirect (liff.state)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- LINE LIFF app configured
- Supabase project
- microCMS account (for news/blog)

### Environment Variables

```env
NEXT_PUBLIC_LIFF_ID=xxxx-xxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx
LINE_CHANNEL_ACCESS_TOKEN=xxxx
LINE_ADMIN_USER_IDS=Uxxxx,Uxxxx
MICROCMS_API_KEY=xxxx
MICROCMS_SERVICE_DOMAIN=xxxx
```

### Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Key Design Decisions

**LIFF external browser auth**
When a user opens the LIFF URL in an external browser (not LINE), LINE redirects back to the endpoint root with a `liff.state` query parameter. `middleware.ts` intercepts this and redirects to the correct path (`/trial`, `/mypage`, etc.) before the page renders.

**Badge calculation**
Badges are calculated server-side from `lesson_history` records in Supabase. Monthly counts are compared against thresholds (Bronze: 4, Silver: 8, Gold: 12, Platinum: 20, Diamond: 40). The previous month's badge is shown in the header and triggers a one-time achievement popup.

**No client-side caching**
LIFF profile data is fetched fresh on each load to ensure LINE avatar / display name changes are reflected immediately.
