# PGC polish pass — data, flags, achievements, glass, design system

A lot of the groundwork already landed in the last migration (points trigger, `individual_leaderboard` / `user_rank` / `country_leaderboard` RPCs, `apply_submission_points`, `maybe_unlock_achievements`, `submissions` storage bucket). This pass closes the loop: real UI on top of that data, flags everywhere, a proper achievement starter set with celebration, layered-glass redesign, and a small shared design system.

## 1. Real leaderboard (no mock data)

- Rewrite `src/routes/leaderboard.tsx`:
  - Two tabs: **Individuals** and **Countries**, driven by the existing `individual_leaderboard(_limit, _offset)` and `country_leaderboard()` RPCs (already in DB).
  - Pagination at 25/page, prev/next.
  - Individuals row: rank · flag · avatar/initials · name · country · points.
  - Logged-in user pinned at the bottom with their real rank from `user_rank(uid)` ("You — ranked #482"), even when outside the visible page.
  - Tie-break is already in the RPC: points DESC → earliest `first_submission_at` → earliest `created_at`.
  - Loading skeleton rows while fetching.
- Delete dead imports of `universities` from `src/lib/challenges.ts`; remove the "prototype review" disclaimer and all hardcoded scores.

## 2. Flags wherever country appears

- Add `src/lib/country-codes.ts` mapping the full name list in `src/lib/countries.ts` → ISO‑2 codes, plus a `<Flag code>` component that renders the emoji flag (`🇮🇳` etc.) with a small SVG fallback via `https://flagcdn.com/{code}.svg` for unsupported platforms.
- Use it in:
  - signup country picker (auth route) and profile country select — show flag next to current value
  - Climate Passport cover (already flag-driven; standardise on the helper)
  - both leaderboard tabs
  - admin submissions table country column
  - admin Country Challenges (Part 2) review list

## 3. Achievements starter set + unlock celebration

- Migration: seed `achievements` with the 7-badge starter set (codes + title + description + icon name + criteria text):
  - `first_audit`, `field_researcher`, `streak_keeper` (relax to 3+ consecutive, today's trigger is 5), `october_complete`, `changemaker`, `top_10`, `trailblazer`.
- Update `maybe_unlock_achievements()` to use the 3-day streak threshold and to grant `top_10` when the user's `user_rank()` ≤ 10 after a submission.
- Client: subscribe to realtime inserts on `user_achievements` for the current user. On insert, show a `<AchievementToast />` with a confetti burst (no extra dep — small canvas component) and a "View on passport" CTA. Respect `prefers-reduced-motion`.
- Climate Passport: render unlocked achievements as visa stickers (already scaffolded); locked ones shown faded with criteria.

## 4. Layered glass + readable scrim (real WCAG check)

- Rework `glass-card` / `glass-panel` in `src/styles.css`:
  - background blur 24px + saturate
  - diagonal specular highlight via a `::before` linear gradient (≈18° sheen)
  - soft inner border glow via `box-shadow: inset 0 0 0 1px rgba(255,255,255,.55), inset 0 1px 0 rgba(255,255,255,.7)`
  - faint outer depth shadow
  - a separate `.scrim` utility (semi-opaque solid layer behind text) so text contrast is independent of glass opacity
- Run a contrast script (`bun run scripts/check-contrast.ts`) that resolves the computed token pairs (foreground over scrim-on-background) and asserts ≥ 4.5:1 for body and ≥ 3:1 for large headings. Fail loud if a pair regresses.
- Motion: add `@keyframes sheen` (slow 12s loop on the specular highlight) and `@keyframes drift` (already there as `pgc-drift`); both wrapped in `@media (prefers-reduced-motion: no-preference)`.
- Smooth route transitions via a small `<RouteFade>` wrapper around `<Outlet />` in `__root.tsx` (opacity+translateY, 200ms, reduced-motion safe).

## 5. Shared design tokens + one Card component

- Tokens already live in `src/styles.css` (radius, font, color). Add a small spacing scale (`--space-1..8`), elevation tokens (`--shadow-1/2/3`), and a type scale (`--text-xs..3xl`) — all under `@theme`.
- New `src/components/ui/pgc-card.tsx`: a single layered-glass card (`<PgcCard variant="glass" | "scrim" | "flat" />`) used on Home, Hub, Challenges, Passport, Admin, Leaderboard. Replace ad-hoc `glass-card`/`doodle-card` JSX with it page-by-page.
- Admin shell parity: wrap `/admin` in the same `<Layout>` (header + footer) used elsewhere.
- Skeletons: add `<LeaderboardSkeleton>`, `<AdminTableSkeleton>`, `<HubSkeleton>` (built on shadcn `<Skeleton>`) and use them in those three routes instead of blank flashes.

## 6. (Lower priority — same pass, smaller scope)

- **Live activity feed**: small `<ActivityTicker>` on the Hub, realtime-subscribed to `submissions` inserts, shows "🇮🇳 Aarav submitted Day 4 · Air Quality" rolling list (last 10).
- **World map**: `src/components/WorldMap.tsx` — a lightweight SVG world (no Mapbox dep) shaded by per-country submission count from `country_leaderboard()`, on the Hub.
- **Accessibility pass**: alt text on every image, `aria-label` on icon-only buttons, focus-visible rings on all interactive elements, `h-dvh` instead of `h-screen` where used, single `<main>` per route.

---

## Technical notes (non-user)

- DB migration this pass: seed `achievements` rows; update `maybe_unlock_achievements` (3-day streak, top_10 grant via `user_rank`). No new tables.
- All leaderboard fetches go through the existing SECURITY DEFINER RPCs — no client-side ranking math.
- Realtime: enable `supabase_realtime` publication on `user_achievements` and `submissions` (one migration line each).
- Glass rework is CSS-only in `src/styles.css` — no per-component edits required for the visual change; the `<PgcCard>` consolidation is a refactor done route-by-route in this pass.
- Contrast check is a build-time node script (`culori` or a 30-line WCAG helper) — no runtime cost.

## Out of scope this pass

- Mapbox integration (you parked it earlier; the world map above is an inline SVG, not Mapbox).
- Rewriting any server function signatures.
- Translations beyond strings already in `i18n.tsx`.

Approve and I'll execute in this order: migration → glass+tokens+Card → leaderboard → flags helper rolled across pages → achievements toast + passport stickers → skeletons & admin shell → activity feed + world map → a11y sweep.
