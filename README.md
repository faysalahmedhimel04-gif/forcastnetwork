# ForcastNetwork

**A production-ready Forecast Creator Network**

Professional platform for analysts and forecasters to publish time-bound predictions, track accuracy over time, follow experts, and build public credibility.

- Next.js 16 (compatible with 15)
- TypeScript + Tailwind CSS
- Shadcn/UI components
- Supabase (Auth + PostgreSQL)
- Dark mode, fully responsive

**Strictly no betting, trading, gambling, or prediction markets.** Pure forecasting + expert opinion platform.

## Features

- User registration & profiles (username, bio, expertise)
- Analyst public profiles + follow system
- Create rich forecasts (title, description, category, target date, predicted outcome, confidence %)
- Prediction resolution by the forecast creator (locks accuracy)
- Accuracy leaderboard (ranked by historical correctness)
- Trending + full searchable/filterable forecast directory
- Commenting / discussion on every forecast
- Personal dashboard (my forecasts + followed analysts' activity)
- Search, category & status filters
- Fully responsive + beautiful dark/light theme

## Project Structure

```
forcastnetwork/
├── app/
│   ├── (auth layout implicit)
│   ├── login/
│   ├── signup/
│   ├── dashboard/
│   ├── forecasts/
│   │   ├── page.tsx          # Browse + search + filters
│   │   └── [id]/page.tsx     # Detail + resolve + comments
│   ├── create/
│   ├── leaderboard/
│   ├── analysts/
│   │   ├── page.tsx
│   │   └── [username]/page.tsx
│   ├── profile/
│   └── page.tsx              # Landing
├── components/
│   ├── ui/                   # All shadcn components
│   ├── navbar.tsx
│   ├── forecast-card.tsx
│   ├── analyst-card.tsx
│   ├── comment-section.tsx
│   ├── follow-button.tsx
│   └── theme-provider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── session.ts          # Supabase cookie session refresh + guards (used by proxy)
│   ├── actions/
│   │   ├── forecasts.ts
│   │   └── follows.ts
│   └── utils.ts
├── supabase/
│   └── schema.sql            # Complete DB + RLS + triggers
├── types/
└── proxy.ts                  # Edge proxy (auth session + protected route redirects)
```

## Getting Started (Development)

### 1. Clone / Copy

```bash
cd D:\website\forcastnetwork
```

### 2. Install dependencies

```bash
npm install
```

### 3. Supabase Setup (use a development project)

1. Create a Supabase project at https://supabase.com (use a separate project for dev vs production).
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`.
3. Copy your project URL + anon key from **Project Settings → API**.
4. **Disable email confirmation for development** (so new users can sign in immediately without confirming their email):
   - Go to **Authentication → Settings**
   - Under Email, turn **OFF** "Enable email confirmations".
   - (The app also includes an auto-confirmation mechanism via the backend using the service role key for dev convenience.)
5. **(Optional) Enable social logins (Google / GitHub)**:
   - Go to **Authentication → Providers**
   - Enable Google and/or GitHub.
   - Configure the OAuth credentials from Google Cloud Console / GitHub Developer Settings.
   - Add redirect URLs: `http://localhost:3000/auth/callback` (and your production domain).
6. Create `.env.local` by copying `.env.local.example` and filling in the values.

### 4. Run locally

```bash
npm run dev
```

Visit http://localhost:3000.

You can create accounts, publish forecasts (including linking to Polymarket events for reference), resolve them, and see accuracy update on the leaderboard and profiles.

**Important**: Use a dedicated development Supabase project. Never put production keys in `.env.local`.

## Database Schema Highlights

Key tables (see `supabase/schema.sql` for full definition + RLS policies + triggers):

- `profiles` — 1:1 with `auth.users`. Stores username, bio, accuracy stats, follower_count.
- `forecasts` — Core entity. Stores prediction + confidence + resolution outcome + is_correct.
- `follows` — Many-to-many analyst following.
- `comments` — Discussion threads.

Automatic triggers:
- New user → profile row
- Follow/unfollow → follower_count
- Forecast resolved → profile accuracy & counts updated
- New comment → increments forecast comment_count

All tables protected with secure Row Level Security policies.

## Authentication Flow

- Email + password via Supabase Auth
- Edge Proxy (`proxy.ts`) protects `/dashboard`, `/create`, `/profile` + refreshes Supabase sessions
- Auto profile creation via Postgres trigger on `auth.users`
- Session handled with `@supabase/ssr`

## Key Pages & Flows

- **Landing** — Hero, trending forecasts, top analysts, features, strong CTA
- **/create** — Full validated form (server action)
- **/forecasts** — Powerful filters (search, category, open/resolved)
- **/forecasts/[id]** — Full detail, resolve dialog (owner only), live comments
- **/dashboard** — Personal stats + my forecasts + followed analysts feed
- **/leaderboard** — Accuracy ranked table
- **/analysts + /[username]** — Public analyst directory + profile with follow
- **/profile** — Edit bio + expertise tags

## Resolving Forecasts

Only the creator of a forecast can resolve it.

When you resolve:
- You supply the actual outcome
- System compares strings (case-insensitive trim) to your `predicted_outcome`
- `is_correct` + `resolved_at` stored
- Profile stats recalculated via trigger

## Deployment (Vercel + Supabase) — Production Checklist

### Pre-Deployment
- [ ] Set up a **production** Supabase project (separate from dev).
- [ ] Run `supabase/schema.sql` in the new project's SQL Editor.
- [ ] In Supabase → Authentication → URL Configuration:
  - Site URL: your production domain
  - Add redirect URLs for your domain + Vercel previews
- [ ] Deploy the **backend** first (`forcastnetwork-backend` folder) and note its URL.
- [ ] Push latest code (frontend + any backend updates).

### Vercel Deployment (Recommended)
1. Push to GitHub.
2. Import **frontend** repo into Vercel.
3. In Vercel project settings → Environment Variables, add (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL` (from your prod Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from your prod Supabase)
   - `NEXT_PUBLIC_BACKEND_URL` (the URL of your deployed backend, e.g. https://your-backend.vercel.app)
4. Import the **backend** folder/repo into a separate Vercel project (or monorepo setup).
5. Add the backend's Supabase vars (including `SUPABASE_SERVICE_ROLE_KEY` if used).
6. Deploy backend first, then frontend.

Vercel will auto-detect Next.js and run `npm run build`.

`vercel.json` files are already present in both folders for regions, function timeouts, etc.

### Post-Deployment
- Test sign-up → create forecast (including Polymarket-linked) → resolve it.
- Verify accuracy updates on leaderboard and profiles.
- Confirm protected routes (`/dashboard`, `/create`, `/profile`) redirect unauthenticated users.
- Update Supabase redirect URLs with your final domain.
- (Optional) Set up custom domain + email in Supabase.

### Alternative Hosts
Build with `npm run build` then `npm start`. Ensure all `NEXT_PUBLIC_*` vars are available at runtime.

**Important**: The frontend now uses the separate backend for most data operations (via `NEXT_PUBLIC_BACKEND_URL`). Keep both in sync.

## Edge Proxy (auth)
We have migrated from the deprecated `middleware.ts` file convention to Next.js `proxy.ts` (per the official codemod and Next.js 16+ guidance).

- Root file: `proxy.ts` (exports `proxy`)
- Session/guard logic: `lib/supabase/session.ts` (contains the defensive env checks + dummy fallbacks)
- The proxy still handles Supabase cookie refresh and protected route redirects using the exact same battle-tested patterns.

This eliminates the deprecation warning while keeping full Supabase SSR auth behavior.

## Environment Variables
See `.env.local.example` in each folder. Never commit real keys.

## Future Enhancements (not in scope)
- Richer outcome types (numeric ranges, multiple choice)
- Email notifications on followed analyst new forecasts
- Export personal accuracy history
- Verified analyst badges / domains
- Forecast categories with icons

## Production Readiness
The site is ready for publishing:
- Clean `npm run build` on both frontend and backend (verified)
- Safe Supabase client (dummy fallback for build/prerender when vars missing)
- force-dynamic on data pages + custom not-found.tsx
- Separate backend for API (forecasts, comments, follows, leaderboard, Polymarket proxy)
- SEO (sitemap + robots)
- Security headers in next.config.ts
- Proper env handling and .gitignore

See the full checklist above.

### Recommended (easiest) — Vercel

1. Push to GitHub.
2. Import the repository in Vercel.
3. In Vercel project settings → Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. (Optional but recommended) Add a custom domain in Vercel.
6. Update Supabase Auth redirect URLs to include your custom domain.

Vercel automatically provides preview deployments for PRs (use a separate Supabase project for previews if desired).

### Alternative: Any Node-compatible host

```bash
npm run build
npm start
```

Make sure the two `NEXT_PUBLIC_SUPABASE_*` environment variables are available at runtime.

### Post-Deploy Steps

- Test sign-up / login on the live domain.
- Create a test forecast and resolve it to verify accuracy tracking.
- Check that protected routes (`/dashboard`, `/create`, `/profile`) redirect unauthenticated users.
- Monitor Supabase logs and Vercel function logs for the first few days.
- (Optional) Set up a custom domain + HTTPS (Vercel does this automatically).

### Polymarket Integration Note

The Polymarket features use the public Gamma API (`https://gamma-api.polymarket.com`). No API keys or secrets are required. It is read-only reference data only and does not perform any trading or betting actions.

## Environment Variables (Production)

| Variable                        | Required | Description                                      |
|--------------------------------|----------|--------------------------------------------------|
| NEXT_PUBLIC_SUPABASE_URL       | Yes      | Your **production** Supabase project URL         |
| NEXT_PUBLIC_SUPABASE_ANON_KEY  | Yes      | Your **production** public anon key              |
| SUPABASE_SERVICE_ROLE_KEY      | No       | Only for admin/seed scripts (never expose)       |

## Environment Variables

| Variable                        | Required | Description                        |
|--------------------------------|----------|------------------------------------|
| NEXT_PUBLIC_SUPABASE_URL       | Yes      | Supabase project URL               |
| NEXT_PUBLIC_SUPABASE_ANON_KEY  | Yes      | Public anon key                    |
| SUPABASE_SERVICE_ROLE_KEY      | No       | Only for admin/seed scripts        |

## Tech Decisions

- Server Components + Server Actions for data mutations (clean, secure)
- Optimistic UI patterns in comments + follow buttons
- Shadcn + Tailwind for fast, accessible, beautiful UI
- No over-engineering: no complex state management needed
- Accuracy is source of truth from DB triggers (no drift)

## Future Enhancements (not in scope)

- Richer outcome types (numeric ranges, multiple choice)
- Email notifications on followed analyst new forecasts
- Export personal accuracy history
- Verified analyst badges / domains
- Forecast categories with icons

## Production Readiness

The project has been prepared for publishing:
- Production build verified (`npm run build` succeeds cleanly)
- SEO files added (`sitemap.ts` + `robots.ts`)
- Security headers configured in `next.config.ts`
- Proper environment variable hygiene (examples committed, real files ignored)
- Edge Proxy (proxy.ts) following current Next.js convention + full defensive guards
- Comprehensive deployment guide (this README)

See the **Deployment** section above for the full publishing checklist.

## License

MIT — feel free to use as a foundation for forecasting communities.

---

Built as a complete, production-ready example of a focused forecasting platform.
