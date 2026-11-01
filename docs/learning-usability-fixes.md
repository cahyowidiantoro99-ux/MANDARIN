# Learning usability fixes — 1 November 2026

## Changes

1. Shared Mandarin speech helper silently selects Kangkang when available, otherwise a ready Mandarin device voice (preferring local zh-CN). No unavailable/fallback/error toast. Speaker controls are hidden when no Mandarin voice is available and updated on `voiceschanged`, including dynamically revealed examples. Playback starts directly on the user gesture; no voice polling or queued retry. A 1.5-second start watchdog cancels a stalled utterance and hides the failed speaker. Actual device/provider startup and quality are not guaranteed by browser speech APIs.
2. Flashcard statuses use green / yellow / red. Selected status is solid, outlined, fully opaque and exposed through `aria-pressed`. It remains visible after save. An explicit Next card button follows, including after recall. Legacy package status buttons receive the same color semantics.
3. Recall highlights the correct option green, marks a wrong selected option red, and labels the correct answer and user choice with text/icons. Feedback is green or red; correctness comes from server response, never client inference.
4. `addQuestionReading` suppresses injected pinyin on both prompt and options for pinyin/reading-pronunciation assessment kinds and prompt wording. Applies to active, resumed and reviewed snapshot questions through the existing shared server formatter. Other Mandarin question types retain reading assistance. No answer key, scoring, placement, ranking or source-paper change.
5. Grammar exercises have three separate vertical sections. Builder, reset, fill, choice and grade controls no longer share inline layout. Inputs/selects use bounded full width; token groups wrap. Verified 360px and desktop.
6. Removed the 20-word server slice. A frozen deck now contains every accessible word matching the selected package/level/theme/review filters. Header and progress denominator reflect that full deck. It renders one card at a time and fetches examples only when revealing the current card. Newly saved statuses affect the next deck rather than reordering an ongoing deck. No new-word duplication or claim of more source words than exist.

## Files and database

Runtime: `app/question-reading.mjs`, `app/learning-center.mjs`, `public/speech.js`, `public/learning-center.js`, `public/learning-play.js`, `public/style.css`.

Tests: `tests/learning-tools.test.mjs`, `tests/learning-center-ui.mjs`, `tests/learning-play-ui.mjs`, `tests/listening-ui.mjs`.

No schema migration, auth setting or secret change. Existing employee records, exam snapshots/results and learning progress are retained.

## Verification

- Full Node suite: **65 passed, 0 failed**. New pinyin invariant additionally audits **7,496 pinyin questions out of 30,213 source questions**, with no injected reading hints in prompt/options.
- `node tests/learning-center-ui.mjs`: card reveal/save/recall/refresh/login, all matching deck cards, grammar and mobile/desktop. Additional explicit correct/incorrect recall color assertions and geometry checks recorded after their run.
- `SOURCE_LEARNING_SMOKE=1 node tests/learning-center-ui.mjs`: full existing source corpus; selected package has more than 20 cards and session denominator matches actual count.
- `node tests/listening-ui.mjs`: preferred Kangkang, stop by repeated tap, silent fallback, hidden unsupported speaker and stalled-start cancellation (mock speech engine).
- `node tests/learning-play-ui.mjs`: three games, narration, dictionary, recording cleanup and unsupported audio/microphone regressions passed. Microphone and voice engine are mocked; real phone hardware/voice latency not tested.
- `node scripts/build-production.mjs`: syntax/security lint and production bundle passed. No TypeScript/typecheck configuration exists.

Build/deploy remains the existing pnpm-locked Docker process and `node scripts/start-production.mjs`. No new dependencies, subscriptions or media downloads.

## Production rollout

- Render `dep-dbj8rqrbc2fs73c52jvg` **Live**, 2026-11-01 00:57:46 UTC (08:57 WITA), runtime commit `77250b906692aac87740f00e70308225a7e490ae`.
- Health HTTP 200, production content, PostgreSQL. Served speech.js, learning-center.js, learning-play.js and style.css each match reviewed source by SHA-256 (normalized line endings).
- Immediate before/after read-only counts unchanged: profiles 8, exam results 38, vocabulary progress 11, review history 22, XP transactions 24.
- Explicit browser assertions passed for green correct recall, red wrong selection plus green correct answer, selected status, three vertically separated grammar steps, and full-deck count. Verified again with full source corpus, including a package exceeding 20 words.
