Scoped extension — does not touch the public PGC AI chatbot. Builds on existing auth, profiles, `submissions`, `submission_links`, admin dashboard, and storage bucket.

## Part 1 — Themes in a config table (swappable year-over-year)

New table `public.program_themes`:
- `year int` (default 2026), `day_number int 1..30`, `theme text`, `prompt text` (one-line October research prompt), `is_rest_day bool` (default false), `created_at`. PK `(year, day_number)`.
- GRANT SELECT to `anon, authenticated`; GRANT ALL to `service_role`. RLS on, single policy: `SELECT` for all (it's public reference data). Writes only via migration/service role.
- Seed 2026 with the real 30-day list:
  1 Why · 2 Footprint · 3 Cities · 4 Food · 5 Water · 6 Fashion · 7 Waste · 8 Oceans · 9 Climate Justice · 10 Holiday (rest) · 11 Forests · 12 Outdoors · 13 Indigenous Peoples · 14 Body · 15 Soil · 16 Holiday (rest) · 17 Food Waste · 18 Wellness · 19 Connect · 20 Plant-Based · 21 Fair Trade · 22 Nature · 23 Purpose · 24 Energy · 25 Advocate · 26 Holiday (rest) · 27 Commitment · 28 Activate · 29 Reflect · 30 Inspire.
- Days 10/16/26 default to optional rest days (no research topic) per the note.
- Delete `src/lib/pgc-themes.ts` and replace consumers with a `getThemes(year)` server fn / cached client read.

November Day N reuses October Day N's row — no second theme list anywhere.

## Part 2 — November "challenge not ready yet" state (no hard lock)

New table `public.country_challenges`:
- `year`, `country` (ISO), `day_number`, `theme` (denormalized), `status` enum `pending | generating | ready | failed`, `prompt text`, `summary text`, `source_research_ids uuid[]`, `generated_at`, `created_at`, `updated_at`. PK `(year, country, day_number)`.
- GRANT SELECT to `authenticated`; ALL to `service_role`. RLS: any authenticated user may SELECT their own country's row; only admins (via `has_role`) may INSERT/UPDATE.
- Index on `(year, country, day_number)`.

UI: On November day cards, if no row or `status != 'ready'` → render a "Your country's November challenge is being prepared" panel (with theme + a short explainer) instead of the current lock. If `ready` → show `prompt` + `summary`, then the existing Action submission form (linked back to October research as today).

AI generation itself (server fn that aggregates October submissions per country/day and writes `country_challenges`) is scaffolded as `generateCountryChallenge({ year, country, day })`, admin-only, callable from the admin dashboard. Bulk "generate for all countries with research" button. Uses existing `ai-gateway.server.ts` + Gemini with strict JSON. (No auto-cron this round — admin-triggered.)

## Part 3 — Simplified October flow (Regional Audit only)

Rewrite `/challenges` Research tab card to be exactly:
- Header: `Day N · {theme}` + one-line `prompt` from `program_themes`.
- Rest days (10/16/26): show "Rest day — no submission required" and no form.
- Form fields (replace current title/description/file): `location` (city/region text, prefilled from profile country), `key_findings` (textarea, required), `data_sources` (textarea), `source_links` (repeatable URL inputs), `attachments` (multi-file upload to `submissions` bucket).
- Remove tiers/points/social-post/PDF-naming rules — none of those existed in our build, just don't add them.
- On submit: insert into `submissions` with `phase='october_research'`, `day_number`, `theme`, plus new columns; on success show a clean structured summary card of what was just submitted (location, findings preview, sources, file count) with "Edit" / "Submit another for this day".

Schema additions to `public.submissions` (additive, nullable):
- `location text`, `key_findings text`, `data_sources text`, `source_links text[]`, `attachment_paths text[]`.
- Keep existing `title/description/media_url` for backward-compat with November Action (which still uses title/description). October writes leave `title` = `"{theme} — Day {N}"` auto-generated for admin readability.

November Action card: unchanged structure, but reads theme from `program_themes` and shows the Part 2 "preparing" / `ready` state above the form.

## Part 4 — Admin dashboard additions

- New "Country Challenges" tab listing `country_challenges` rows with filters by country/day/status.
- Per-row "Generate" button → `generateCountryChallenge`. Bulk action per country.
- Existing per-submission "Generate AI Feedback" stays untouched.

## Out of scope

- The public PGC AI chatbot (untouched).
- Real cron / scheduled November generation.
- Migrating any existing test submissions to the new columns (additive nullable, old rows still render).

## Technical notes

- Migrations in one batch: create `program_themes`, seed 2026, create `country_challenges`, add new columns to `submissions`. All with GRANTs + RLS in same migration.
- Server fns in `src/lib/themes.functions.ts`, `src/lib/country-challenges.functions.ts`. Admin-only fns use `requireSupabaseAuth` + `has_role('admin')`.
- Themes fetched once on `/challenges` mount via TanStack Query; cached.
- Delete `src/lib/pgc-themes.ts` after consumers are migrated.

Proceeding will take ~2 batches: (1) migration, (2) code (server fns + Challenges rewrite + admin tab). Confirm to proceed.