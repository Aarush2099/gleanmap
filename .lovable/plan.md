# What's actually wrong

The site has two layers that don't match each other:

- **Database**: still the old GleanMap tables (`trees`, `fruit_types`, `messages`, `reservations`, `tree_*`, plus a `profiles` table with `gleaner_score`/`pounds_saved`/`badges`). No `submissions`, no `program_themes`, no `country_challenges`, no `admin_emails`, no `role` column.
- **App code**: PGC 2026 — reads `submissions`, `program_themes`, `country_challenges`, `profiles.role`, etc.

Result: every authenticated page silently fails, admin can never be granted, and your bug ("admin can't log in to /admin") is just the most visible symptom. There is no `admin_emails` table to fix — we need to build the real schema.

I'll do this in 3 batches so each one is reviewable.

---

## Batch 1 — Database reset + admin grant (migration, needs your approval)

Single migration that:

1. **Drops GleanMap tables** (`trees`, `tree_likes`, `tree_comments`, `tree_visits`, `reservations`, `messages`, `notifications`, `fruit_types`) and rebuilds `profiles` with the PGC shape (`id`=auth user id, `email`, `full_name`, `country`, `school`, `created_at`, `points int default 0`, `participant_number text`).
2. **Roles done right** (no `admin_emails`): `app_role` enum + `user_roles` table + `has_role(user, role)` security-definer function. This is the pattern we already standardize on. `profiles.role` view-helper column is dropped; the app reads roles via `has_role`.
3. **Creates the PGC tables** with full GRANTs + RLS + policies, in order:
   - `program_themes(year, day_number, theme, prompt, is_rest_day)` — seeded with the real 30 themes (Why, Footprint, Cities, Food, Water, Fashion, Waste, Oceans, Climate Justice, Holiday, Forests, Outdoors, Indigenous Peoples, Body, Soil, Holiday, Food Waste, Wellness, Connect, Plant-Based, Fair Trade, Nature, Purpose, Energy, Advocate, Holiday, Commitment, Activate, Reflect, Inspire). Days 10/16/26 marked `is_rest_day`.
   - `submissions(user_id, country, phase, day_number, theme, location, key_findings, data_sources, source_links[], attachment_paths[], ai_feedback, ai_next_steps, status, submitted_at)` with points trigger.
   - `country_challenges(year, country, day_number, theme, status, prompt, summary, title, brief, action_prompt, success_criteria, ...)` — November per-country.
   - `achievements(code, name, description, icon)` + `user_achievements(user_id, code, unlocked_at)` — seeded with First Audit, Field Researcher, Streak Keeper, October Complete, Changemaker, Top 10, Trailblazer.
4. **Points trigger** on `submissions` insert: +100 october_research, +50 november_action; on `submissions` update when `status` becomes `reviewed`: +25.
5. **Triggers**: handle_new_user replaces the GleanMap version (creates a PGC profile row, generates a 6-char participant number, copies country from `raw_user_meta_data`). Auto-unlock achievement rows when criteria met (First Audit, Field Researcher = 5 audits, Streak Keeper = 5-day streak, October Complete = 27/27 non-rest days).
6. **Storage**: drop `tree-images` bucket, create private `submissions` bucket with per-user RLS.
7. **Grant admin to `aarushmahajan2008@gmail.com`**: insert into `user_roles` for that auth user id (looked up by email in `auth.users`). If the user hasn't signed up yet, the migration creates a one-shot trigger so the role is granted on first signup with that exact email.

After this migration runs, /admin works for that one email and is blocked for everyone else.

## Batch 2 — Code cleanup + 30-day truth + Hub/nav fixes

Pure code edits, no DB. After Batch 1's regenerated `types.ts` lands:

- `useAuth` reads role via `has_role` RPC, exposes `isAdmin`. `/admin` uses `isAdmin` instead of `profile.role`.
- **Purge "60 days" everywhere** — confirmed locations: `src/lib/i18n.tsx` (5 strings), `src/routes/about.tsx`, `src/routes/faq.tsx`, `src/routes/schools.tsx`, `src/routes/__root.tsx`, `src/lib/api/pgc-ai.functions.ts`. Replace with "30 days of research. 30 days of action." copy you specified.
- **Hub** (`src/routes/hub.tsx`): footer tagline → "30 days of action. One global movement." Guest preview tile rewrite to "30-Day Research" + "30-Day Action". Remove "60-Day Timeline" tile.
- **Hub nav**: it already has the single "Challenges & Research" entry — but I'll audit a per-page secondary nav you mentioned ("October · Research" + "November · Action") and consolidate to one.
- **`/challenges` headline**: "30 days of research. 30 days of action."
- **Challenges form**: already the right shape (location / key findings / data sources / source_links / file upload). Verified no tier/social-post logic in code.
- **Themes**: already config-driven via `program_themes`. Delete the dead `src/lib/challenges.ts` (the universities mock + the 60-row generator) — nothing keeps using it after the leaderboard rewrite below.

## Batch 3 — Climate Passport profile + real leaderboard + nav avatar

- **`/profile` rewrite** as Climate Passport (replaces current form-based profile):
  - Passport card: country flag (emoji from ISO derived from country name), full name, participant number, join date, country name.
  - 30-stamp grid for October days — filled stamps for completed days, dotted empty for unfilled, theme name + day number on each.
  - Stats strip: total points, country rank (computed via RPC), current streak, X/30 complete.
  - Achievement visa stickers — locked = greyed, unlocked = full color with unlock date.
  - November section: per-day cards keyed off `country_challenges` (status=approved) for the user's country.
  - **Export as Image** button using `html-to-image` (already installed).
- **Header nav**: profile link is already there when signed in; I'll swap the text-with-name pill for a circular avatar/initials button linked to `/profile`.
- **`/leaderboard` rewrite** (delete fake universities entirely):
  - Tabs: **Individuals** and **Countries**.
  - Individuals: rank by `profiles.points` desc, tiebreak by first submission date (RPC). 25/page. Pin the signed-in user's row at the bottom with their real rank ("You are ranked #482") even if outside the page.
  - Countries: sum points by country, count participants, sort desc.
  - Remove "prototype review" disclaimer, all hardcoded names/scores, the financial-index styling kept but powered by real data.

---

## Out of scope (won't touch this round)

- Mapbox / location features (you said "later").
- Auth email templates / password reset flow.
- Translating new copy into the other languages in `i18n.tsx` (English strings updated; other locales keep their existing strings until you ask).

## Risks to call out

- **Dropping GleanMap tables wipes any data in them.** Given you said "that project is gone," I'm assuming this is fine. If any of that data matters, say so and I'll skip the drops and leave them orphaned instead.
- After Batch 1 you'll need to sign up (or already be signed up) with `aarushmahajan2008@gmail.com` for the admin role to attach to a real auth user. The migration handles either order.

Confirm and I'll start with Batch 1 (the migration).
