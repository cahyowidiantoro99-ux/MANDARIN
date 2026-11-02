# Navigation, completed grammar, audio and bilingual UI — 2 November 2026

## Implemented

- Navigation immediately closes the drawer, updates the active menu and displays a loading state. Dashboard, package lists, Learning Center summary and interactive catalog have a 10-second **memory-only, per-account** read cache with in-flight request deduplication. Any mutation clears it before and after the request. Expired values reload; failed requests are not cached. Exam sessions, answers, official results/rankings and Leader analytics are never cached by this helper. Late responses cannot replace a newer principal menu view.
- Independent dashboard read queries run concurrently after existing expiry/reminder steps; scoring/reminder policy is unchanged.
- Completed grammar cards have a green border/background and bold green title/check label, including filtered/show-more lists and after refresh. Completion still comes from persisted passed grammar attempts, not UI guessing.
- Speech no longer cancels an idle speech engine just before its first utterance, which can interfere with Android playback. Paused synthesis is resumed. Button playback has live inline starting/playing/error feedback and allows retry. Startup failure is bounded at 2.5 seconds; no black fallback toast. Controls remain hidden if no Mandarin device voice is available. Tapping the active speaker stops it and clears its status.
- Indonesian/Chinese UI audit covers Learning Center, flashcards, grammar exercises, games, stories, speaking, recommendation/status text and Leader learning analytics. Replaced whole-module translation exclusions with precise source-content markers; manually curated Chinese catalog and dynamic UI templates added. Source Hanzi/pinyin/meaning/example translations, grammar patterns/examples, game/exam questions and answer options, names and organizational data retain source text. Form drafts and answer values survive language switches.

## Render Free limitation (not changed)

The service remains on **Free**. Render can spin it down after 15 minutes without inbound traffic and display its own startup page on the next request, before application code executes. Changing application CSS or these navigation optimizations cannot remove that hosting page. Always-on paid compute is a separate billing change and has not been authorized/applied. No paid subscription, keep-alive service or new external speech API was enabled.

Primary references: https://render.com/docs/free#spinning-down-on-idle and https://render.com/docs/compute-plans .

## Files / database

New public modules: `public/read-cache.js`, `public/learning-i18n.js`.

Updated runtime: `app/service.mjs`, `app/server.mjs`, `public/app.js`, `public/i18n.js`, `public/learning-center.js`, `public/learning-play.js`, `public/learning-analytics.js`, `public/speech.js`, `public/style.css`, build manifests in `scripts/build.mjs` and `scripts/build-production.mjs`.

New tests: `tests/read-cache.test.mjs`, `tests/navigation-ui.mjs`, `tests/learning-language-ui.mjs`; updated `tests/listening-ui.mjs`.

No schema migration, employee/account deletion, exam history reset, credential or HSK/weekly/ranking rule change.

## Actual validation

- Full Node regression suite: **67 passed, 0 failed**, including real PostgreSQL/PGlite service tests, authentication/RLS/cross-user protection and cache account isolation, cloning, expiry, invalidation, failed loads and non-cacheable exam requests.
- `node tests/navigation-ui.mjs`: mobile loading response **64 ms** in local Edge with package responses deliberately delayed 600 ms; Dashboard → Examination → Profile → Dashboard issued only one dashboard read. Drawer closure, package-cache reuse and late-response rejection passed. This is a local UI measurement, not a production network latency guarantee.
- `node tests/learning-language-ui.mjs`: Employee learning/game/story/speaking and Leader analytics, 360px and desktop, two-way language changes and source text preservation passed. Remaining Latin text consists of proper curriculum/corporate/timezone identifiers (HSK/ECB/XP/Asia/Makassar and test-only Fixture), not untranslated Indonesian UI phrases. Completed grammar color assertion passed.
- `node tests/i18n-ui.mjs`: existing Employee/Leader routes, login persistence, exam text/options/selected answers and draft profile fields passed. Names, department codes and division/job data remain unmodified.
- `node tests/listening-ui.mjs`: idle-engine cancellation regression, preferred/fallback Mandarin voice, repeated-tap stop, bounded startup, inline retry feedback and unsupported voice hiding passed using a **mock** device speech engine.
- `node tests/learning-center-ui.mjs`: flashcards/recall/progress/grammar/refresh/login regression passed. One initial run was blocked because the OS allocated Chromium's unsafe port 10080; rerun on a new ephemeral port passed without bypassing browser protections.
- `node tests/learning-play-ui.mjs`: games/story/saved words/recorder and unsupported audio/microphone regression passed (media mocked).
- Development and production builds/syntax-security lint passed. No TypeScript configuration is present.

## Operational limits

Physical Android speaker output, media volume, installed Mandarin TTS and actual Google/device voice availability cannot be confirmed with desktop speech mocks. Inline feedback reports browser events; it does not claim audibility or pronunciation quality. No production employee study/exam result is generated for verification.

Build/deploy uses the existing pnpm-locked Docker setup and `node scripts/start-production.mjs`. Existing secret configuration is retained.
