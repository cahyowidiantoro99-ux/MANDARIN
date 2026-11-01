# Phase 3 — Learning analytics and optimization

Implemented 1 November 2026 on the existing ECB application.

## Delivered

- Leader menu **Analitik Belajar**, read-only `GET /api/leader/learning`. Server verifies Leader role. Filter by name, exact department/division/job title, placement level, period and reference date. No export bypass or new write route.
- Active learners, active minutes averaged over all selected employees (including zero), sessions, completed unique grammar/game materials, period XP, daily mission completion, scheduled learning consistency, current vocabulary status/mastery, department comparisons and daily score trends.
- Practice averages remain separate from official weekly HSK and Work averages. Official results require `official_key`; no ranking, placement, promotion or weekly scoring changes.
- HSK vocabulary denominator is the employee's current placement level, default 1 before placement. Work denominator is published GENERAL + employee department. Retired content and other departments are excluded. Mastery requires self-status known + at least 2 correct recall results + last recall correct. Self-rating coverage is shown separately.
- Period reports use WITA. Vocabulary progress is a **current snapshot**, not historical reconstruction. Activity is attributed to the session start date, matching existing accounting. Mission/consistency denominators use completed scheduled days, account creation and personal rest settings; today is excluded. Personal schedules are not HR attendance.
- Employee recommendations: due review, unfinished grammar at current level, latest weak interactive practice, unreviewed work theme. Reasons and real destinations; no paid AI request.
- Learning modules now load on demand. Leader rows paginate 20 at a time; mobile employee cards expand on demand. No new images, frameworks or third-party requests.
- Existing server heartbeat/visibility/idle controls remain authoritative for active time. No client-provided duration or XP accepted.

## Files

New: `app/learning-analytics.mjs`, `public/learning-analytics.js`, `tests/learning-analytics.test.mjs`, `tests/learning-analytics-ui.mjs`, this document and the Phase 3 test report.

Updated: `app/server.mjs`, `app/learning-center.mjs`, `public/app.js`, `public/learning-center.js`, `public/style.css`, `scripts/build.mjs`, `scripts/build-production.mjs`, `tests/learning-center.test.mjs`, `tests/postgres-service.test.mjs`.

## Database and content

No new migration or schema/grant/auth changes required: Phase 1–2 tables already contain these metrics. No employee, account, exam, progress or XP deletion/reset. Reads do not award XP or update learning state. No new content fabricated. Existing import templates remain in `docs/content-templates/` (HSK vocabulary, work vocabulary, grammar, stories, contrasts).

## Run and deploy

Node >=24, install locked dependencies with `pnpm install --frozen-lockfile` (pnpm 11.25.0 as used by Docker); `node scripts/build.mjs`; `node --test tests/*.test.mjs`. Local development: `node --env-file-if-exists=.env app/server.mjs` with existing documented configuration. Never seed demo data into production.

Production: build `node scripts/build-production.mjs`; push the reviewed source to existing repository main, manually deploy existing Render `ecb-mandarin`, start command `node scripts/start-production.mjs`. No environment secret change or new subscription required. Verify `/api/health`, new static asset, unauthenticated denial, and database preservation. Existing idempotent startup migration is unchanged.

## Limits

- No historical vocabulary snapshots existed; past-period filters do not pretend to reconstruct them.
- Consistency follows employee-maintained learning schedules, not corporate shift/holiday integration. Mission eligibility only begins from profile creation; older days before LC launch can legitimately display no recorded missions.
- Analytics use 9 batched queries, then aggregate selected cohort in memory. Pagination is client-side. Very large cohorts/history may later require server pagination/materialized aggregates; the local benchmark is not a cloud load/SLA test.
- Practice scores combine distinct practice formats and are descriptive, not a validated proficiency scale. Official exam averages remain independent.
- Speaking recordings remain local and ungraded; no new pronunciation assessment.
