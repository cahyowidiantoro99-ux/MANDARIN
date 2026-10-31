# Phase 1 verification — 1 November 2026

## Executed

- `node scripts/build-production.mjs`: syntax/security lint for 62 JavaScript files and production bundle build passed. No TypeScript/type-check command exists in this repository.
- `node --test tests/*.test.mjs`: 59 passed, zero failed/skipped. Covers SRS intervals and recall-based mastery, ownership, private challenge answers, authenticated API/CSRF, one-time submissions, duplicate XP, persisted progress, grammar practice, PostgreSQL execution, rerunnable migration, RLS/role denies, existing placement/level-up, weekly exams, official scores/ranking, auth, source corpus and Gemini adapter.
- `node tests/learning-center-ui.mjs`: passed. Desktop/360px; no horizontal overflow; reveal/rating gating; Pinyin toggle; all rating controls; recall flow; reload and logout/login persistence; source grammar sentence builder/reset, fill, choice, persisted completion; unsupported speech notice.
- `SOURCE_LEARNING_SMOKE=1 node tests/learning-center-ui.mjs`: passed on an isolated local database containing the complete repository source corpus, not just synthetic vocabulary fixtures.
- `node tests/learning-tools-ui.mjs`: passed legacy profile editing, persistent vocabulary choices, mobile progress, question Pinyin and exam progress.
- `node tests/i18n-ui.mjs`: passed existing language switching, forms, live exam answers, Leader/Employee flows. New Learning Center instructional UI is primarily Indonesian with Mandarin learning labels/source content.
- `node tests/listening-ui.mjs`: passed senior Kangkang selection, no voice selector, second-tap stop and unavailable-voice feedback, using mock speech transport. This does not verify the audible voice on a physical phone.
- Python `csv` validation: all example rows match template header widths (HSK vocabulary 19, work vocabulary 18, grammar 21 columns).
- `git diff --check`: passed.

No production employee account or exam result was created or modified for these tests. API isolation checks used separate local employee/Leader accounts. Microphone recording is a Phase 2 feature and is not exposed or claimed tested in this release.

## Security review

New PostgreSQL tables use RLS and zero anon/authenticated grants. Actual PGlite role tests deny direct SELECT to those roles. API tests reject another employee's challenge and Leader mutations/read access to the private learning workflow. Rewards use server-side results, unique user/day/activity/target keys, daily caps and serialized submission; client-provided user IDs/XP do not change the owner or reward. Known self-rating alone is not verified mastery. Tests inspect that official results remain separate from learning XP.

The pre-deploy Supabase advisor reported existing informational notices for intentionally backend-only tables without Data API policies. It also reported a pre-existing `public.current_score_role()` SECURITY DEFINER warning and leaked-password protection disabled. This release does not alter the other application's public function or shared Auth settings. Reference: [function exposure advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No new SECURITY DEFINER function is introduced.

## Files changed

- Backend: `app/learning-center.mjs`, `app/learning-progress.mjs`, `app/server.mjs`.
- Migrations: `migrations/001_supabase.sql`, `migrations/002_sources.sql`.
- Client: `public/learning-center.js`, `public/app.js`, `public/style.css`, `public/i18n.js`.
- Build: `scripts/build.mjs`, `scripts/build-production.mjs`.
- Tests: `tests/learning-center.test.mjs`, `tests/learning-center-ui.mjs`, `tests/postgres-service.test.mjs`, `tests/postgres.test.mjs`.
- Documentation/templates: this report, `docs/learning-center-phase1.md`, and three CSV files in `docs/content-templates/`.

## Deployment

Production deployment and read-only verification are recorded in `DEPLOYMENT_STATUS.md`. A successful local test is not, by itself, a claim that the production rollout completed.
