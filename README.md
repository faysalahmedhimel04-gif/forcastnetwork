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
│   │   └── middleware.ts
│   ├── actions/
│   │   ├── forecasts.ts
│   │   └── follows.ts
│   └── utils.ts
├── supabase/
│   └── schema.sql            # Complete DB + RLS + triggers
├── types/
└── middleware.ts
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
4. Create `.env.local` by copying `.env.local.example` and filling in the values.

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
- Middleware protects `/dashboard`, `/create`, `/profile`
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

## Deployment (Vercel + Supabase) — Ready for Production

The project is production-ready:
- Clean `npm run build` (verified)
- Proper environment handling
- Row Level Security + triggers on all tables
- SEO basics (sitemap + robots)
- Security headers in next.config.ts
- No client-side secrets

### Pre-Publishing Checklist

1. **Supabase Production Project**
   - Create or use a dedicated **Production** Supabase project (never reuse dev keys).
   - Run the full `supabase/schema.sql` in the SQL Editor (or use Supabase migrations for future changes).
   - Go to **Authentication → URL Configuration** and set:
     - Site URL: your production domain (e.g. `https://yourapp.com`)
     - Redirect URLs: add `https://yourapp.com/**` (and localhost for testing)
   - (Recommended) Enable email confirmations and set up SMTP or use Supabase's service.
   - Copy the **Production** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

2. **Environment Variables**
   - Never commit real keys. `.env*` is ignored (except `*.example` files).
   - On your host, set only the two required `NEXT_PUBLIC_*` variables.

3. **Build Verification**
   ```bash
   npm run build
   ```
   Should complete with no errors.

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
- Middleware documented for the current Next.js version
- Comprehensive deployment guide (this README)

See the **Deployment** section above for the full publishing checklist.

## License

MIT — feel free to use as a foundation for forecasting communities.

---

Built as a complete, production-ready example of a focused forecasting platform.
