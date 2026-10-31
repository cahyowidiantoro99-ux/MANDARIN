# Learning Center — Phase 1

## Audit and implementation plan

The application is an existing Node 24 HTTP service, PostgreSQL on Supabase in schema `ecb_mandarin`, Supabase Auth with server sessions/CSRF, and a vanilla JavaScript client. Local tests use SQLite and PGlite. The published learning corpus identifies itself as HSK 3.0 levels 1–6; the six legacy official exam packets are separate. The audit found 7,492 vocabulary records, 481 grammar lessons, 142 reading lessons, and existing three-state vocabulary progress. The existing active-time implementation already checks foreground activity, idle periods, heartbeat limits, and week boundaries.

Phase 1 extends that system: Learning Center paths and source units; theme index for work vocabulary; flashcards, review warehouse, SRS/history, recall; structured source grammar practice; server-calculated daily missions and capped XP. It does not change placement, achieved HSK level, weekly assessment, official ranking, or Leader permissions.

## Implemented behavior

- HSK units reuse existing learning packages and link to original readings/materials. Work themes are a deterministic keyword index over existing Hanzi/Indonesian terms; they are not new translations, HSK levels, or linguistically validated synonym pairs. Unknown classification falls back to department vocabulary. Only general and the employee's own department are visible.
- Cards show Hanzi first, optional Pinyin and device Mandarin speech. Reveal is recorded on the server; self-rating requires reveal plus two seconds. Back includes original meaning, class, examples, Pinyin, and example speech when available. No fabricated word images/audio are added.
- Warehouse includes Ragu/Belum Hafal plus due cards. Up to twenty cards per session. Previously recorded states remain visible. Reload/login persistence comes from the database, not local storage.
- New SRS reviews use 10-minute unknown, medium review (initial 4 hours), and longer known (initial one day) intervals. Correct recall expands the interval, wrong recall resets it to ten minutes and resets verified recall success. Upper bound sixty days. A self-rating is not verified mastery; two successful recalls separated by at least an hour plus a current known rating are required. Recall occurs after known ratings and every third new review.
- Review reward: 2 XP per unique word/day, maximum fifty words/day. Correct recall: 3 XP per unique word/day, maximum twenty/day. Grammar: 15 XP per unique lesson/day, maximum five/day, only for all three questions correct. Unique database keys enforce deduplication. Day boundaries use WITA. Daily missions use rewarded distinct activities: ten words, one grammar, three correct recalls. XP is never included in official ranking.
- Grammar uses published source entries with a pattern, explanation, and at least three structured examples. Those examples create exact source-based sentence ordering, character completion, and multiple-choice practice. Results/feedback persist. This is constrained practice, not general free-writing assessment; the UI explains the source-order criterion.
- Active time reuses the existing server learning sessions; background/idle tabs do not claim time. Session counts and time remain separate from practice scores and new vocabulary mastery.

## Database changes

Additive `CREATE TABLE IF NOT EXISTS` blocks are appended to existing project migration entry points: `migrations/001_supabase.sql` and `migrations/002_sources.sql`. This repository uses an idempotent bootstrap migration rather than Supabase CLI migration history. No destructive SQL, old data rewrite, or additional grants are introduced.

New backend-only tables: `lc_review_state`, `lc_reviews`, `lc_challenges`, `lc_xp`, `lc_practice`. User IDs reference profiles; word IDs reference vocabulary. PostgreSQL tables enable RLS and revoke all Data API access from anon/authenticated. The server uses the existing dedicated application role. API ownership is always derived from the authenticated server session; challenge answers and rewards are computed server-side. The challenge submission transaction is serializable, consumes the challenge once, and rewards via unique keys. Indexes cover user/due and activity histories.

## Run and deploy

`pnpm install --frozen-lockfile`, `node scripts/build-production.mjs`, `node --test tests/*.test.mjs`, and `node tests/learning-center-ui.mjs`. Existing `.env` configuration remains unchanged. Development: `pnpm dev`; demo test accounts are seeded only in isolated test databases. Production uses `node scripts/start-production.mjs`, which applies the idempotent PostgreSQL migration and source release before starting the HTTP server. No new environment secrets or paid services are required.

Deploy the existing Docker service with the new source and migration files, preserve its current Render environment, and check `/api/health`, `/api/learn/summary` while authenticated, and the Learning Center UI. Backups/rollback must preserve the new tables; rolling back code does not require deleting them.

## Content import templates

CSV files in `docs/content-templates/` can be edited in Excel and saved as UTF-8. They are authoring templates, not a new automatic publishing endpoint. Populate the source reference and rights fields, validate Hanzi/Pinyin/meaning and examples, then use the existing reviewed source-release process. Empty optional image/audio fields mean unavailable, not a broken placeholder. Never use third-party art without a usage license. Supplied example rows reproduce a limited entry from the repository source; no new synonym/antonym claims are invented.

## Deferred phases and limitations

Phase 2 is not implemented: matching/listening games, interactive stories, speaking recorder/recognition, validated synonym/antonym content, badges, and shift-aware streaks. Phase 3 is not implemented: new Leader learning analytics, shift/holiday configuration, recommendations beyond due review/current level, and broader optimization. Existing Leader analytics and all official evaluations remain intact. No microphone control is shown, and microphone permissions are not changed. Speech is device synthesis (Microsoft Kangkang preferred), not recorded native voices; unavailable devices get a fallback notice. Grammar entries lacking three structured examples remain available as original source material, with no invented content.

Each source category's progress is reviewed coverage and self-assessed statuses; verified recall is explicitly separate. Work difficulty is not fabricated when the underlying vocabulary lacks level metadata. Source package completion remains the existing active-session measure and is not used as proof of new mastery. New challenge/history records are append-only; retention/cleanup at larger scale is a follow-up. Learning checks are instructional practice, not a security claim that a person cannot consult external answers.

## Verification

See `artifacts/learning-center-*` screenshots and `docs/learning-center-test-report.md` for actual executed tests and deployment state.
