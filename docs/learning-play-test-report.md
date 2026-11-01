# Phase 2 verification — 1 November 2026

## Executed tests

- Full Node test suite: 62 passed, zero failed/skipped. Includes all pre-existing placement, weekly exams, official ranking, auth, source integrity, Phase 1 SRS/XP and Gemini regressions.
- New backend tests cover scheduled streak/rest dates, explicit curated content keys, longest-word annotation preserving text, three game graders, story/contrast grading, score persistence, duplicate submissions/XP, employee scope, wrong-endpoint rejection, work difficulty labels, saved-word ownership, badges and preferences.
- HTTP tests cover authenticated/CSRF access, Leader denial, cross-user game submission, and rejection of client-provided score/XP claims. PostgreSQL/PGlite tests execute a story grading transaction and preserve the existing exam results; RLS role tests include the four new tables.
- `node tests/learning-play-ui.mjs`: all three games complete with 100% known test answers and persisted results; story Pinyin/translation/highlight/dictionary/save/comprehension; comparison quiz; mocked recording/playback/track cleanup; microphone permission denied; unsupported microphone/audio/ASR; compatible mocked ASR showing a transcript without an accuracy claim; 360px viewport without horizontal overflow.
- Existing `learning-center-ui.mjs`, `i18n-ui.mjs`, and `listening-ui.mjs` passed after integration. Existing Kangkang preference, senior style and stop behavior are retained.
- Production build/lint and final rollout verification are recorded with the deployment status.

Browser media tests use explicit mocks and do not access a physical microphone or external recognition service. A mock Blob verifies lifecycle/UI wiring, not that a real recording sounds correct on a user's phone. No production employee game or speaking attempt is submitted as a test.

## Changed files

Backend: `app/learning-content.mjs`, `app/learning-motivation.mjs`, `app/learning-play.mjs`, `app/learning-center.mjs`, `app/server.mjs`.

Client/build: `public/learning-play.js`, `public/learning-center.js`, `public/app.js`, `public/style.css`, `public/i18n.js`, `scripts/build.mjs`, `scripts/build-production.mjs`.

Database/tests: `migrations/001_supabase.sql`, `migrations/002_sources.sql`, `tests/learning-play.test.mjs`, `tests/learning-play-ui.mjs`, `tests/learning-center.test.mjs`, `tests/postgres.test.mjs`, `tests/postgres-service.test.mjs`.

Documentation: this report, `docs/learning-center-phase2.md`, and two content CSV templates. Final deployment/data-preservation checks are in local `DEPLOYMENT_STATUS.md`.
- Final production build/security lint passed: 68 JavaScript files. Template CSV validation passed: 15 story-sentence rows/10 columns, 5 comparison rows/19 columns. git diff --check passed.
- Browser media behavior follows the documented APIs: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder and https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia. Optional recognition support/privacy limits: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition.

## Production rollout

Render deploy dep-dbj85fetlv9c73cg729g is LIVE at runtime commit e763239dc2bc06882a5856779fd8207f3f29ba33. Health HTTP200, PostgreSQL production_content; new JS HTTP200 (23,953 bytes), unauthenticated private catalogue HTTP401. The four new tables are owned by ecb_mandarin_app with RLS enabled and no anon/authenticated SELECT grants. Security advisors were checked before and after rollout; backend-only RLS-without-policy informational notices are intentional with zero grants. Shared/pre-existing public-function/Auth advisories were not altered by this release.

The production browser session had expired and showed login. Authenticated interactive flows were exercised in isolated SQLite/PGlite/browser tests, not by impersonating an employee or creating cloud test results. No physical microphone/recognition provider test was performed. Existing account, exam, vocabulary-review and XP counts were compared around deployment and recorded in DEPLOYMENT_STATUS.md.
Data counts before/after were unchanged: profiles 8, exam_results 38, vocabulary_progress 11, reviews 22, XP transactions 23. New activity/personal-word rows remained zero during read-only verification. RLS-only notice reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy .
