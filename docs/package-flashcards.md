# Package-scoped flashcards — 2 November 2026

## Delivered

- Package flashcard counts equal the accessible published vocabulary records linked to that package. The package metadata from the server is authoritative; a conflicting client track/level cannot accidentally load another level or reduce the deck.
- SQL selects only the chosen package using indexed package membership, rather than sending every accessible vocabulary row to the application and filtering afterward. Published/demo/department restrictions remain in the query.
- Initial deck contains only id, Hanzi, pinyin and status. Meaning, part of speech and examples are obtained through the existing challenge/reveal flow for the current card. Only one card is rendered. There is no 20-card limit and no loss of remaining words.
- Opening a package no longer needs an extra request to enumerate all 70 packages for its title/level; the selected package metadata comes with its deck.
- Recall distractors now return at most three distinct accessible meanings from SQL rather than transferring the full corpus to the application. The original allowed content pool and server-owned correctness/XP rules remain intact.
- Invalid package IDs are rejected before PostgreSQL UUID conversion. Unknown valid IDs return not found.

## Actual verification

- Full Node regression suite: **68 passed, 0 failed**. After the final recall/UUID adjustment, targeted Learning Center, full-source package and PostgreSQL service tests: **5 passed**.
- New `tests/package-flashcards.test.mjs` installs the existing source release in an isolated database and checks **all 70 packages** against the same published/department-aware counts used by package listings, unique word IDs, package-limited SQL and compact payload fields. HSK 6 Package 01 = **180**; Package 02 = **179**.
- Compact initial Package 01 response measured **17,711 bytes** of JSON in the source test fixture (not a cloud latency guarantee or a measurement of image/audio transfer).
- PostgreSQL/PGlite verifies the package membership query, authoritative metadata and compact payload on real PostgreSQL.
- Full-source browser test (`SOURCE_LEARNING_SMOKE=1 node tests/learning-center-ui.mjs`) passed desktop/mobile, actual deck denominator, reveal/recall, persistence, refresh/login and grammar regression.
- Production build/syntax checks passed. No TypeScript configuration exists.

## Files / deployment

Runtime: `app/learning-center.mjs`, `public/learning-center.js`.

Tests: new `tests/package-flashcards.test.mjs`; updated `tests/learning-center.test.mjs`, `tests/postgres-service.test.mjs`.

No schema migration, seed/content replacement, progress reset, credential/billing change or exam/ranking policy change. Existing Node/pnpm Docker build and `node scripts/start-production.mjs` deployment are retained.
