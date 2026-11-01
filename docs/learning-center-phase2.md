# Learning Center — Phase 2

Implemented as an extension of Phase 1 on the existing Node/Supabase/Render application. Placement, HSK achieved level, weekly official assessments, ranking and Leader permissions are unchanged.

## Features

- Matching: five unique Hanzi/meaning pairs, pairing/reset controls, progress, server-graded feedback and persisted scores.
- Sentence Builder: three sentences drawn from published grammar examples at the chosen repository HSK level, shuffled word tokens, reset, feedback and persisted scores. Exact source ordering is the exercise criterion, not general free-sentence grading.
- Listening Challenge: five published words, Mandarin device speech, replay and relative speed controls, answer choices unlocked after audio completes, server grading and persisted results. Work vocabulary has no invented HSK difficulty label.
- Three original workplace stories (briefing, conveyor problem report, shift handover). Recommended levels are accompanied by technical vocabulary; these are not official HSK passages or operating procedures. Pinyin and Indonesian translation toggle independently; sentence narration highlights the active sentence. Accessible repository words open a dictionary card and can be saved to personal flashcards.
- Five explicit curated comparisons: 星期日/星期天, 大/小, 冷/热, 工作/上班, 再/又. Each has meanings, Pinyin, contextual distinctions, examples and a server-graded mini quiz. There is no automatic synonym/antonym generation. Sunday and work contrasts were checked against the existing vocabulary-notes content; all target words exist in the repository. Some examples and all stories are original editorial teaching content, not extracted official HSK material. Broader editorial/native-instructor review is recommended before expanding the seed corpus.
- Local speaking recorder: explicit user click and browser microphone permission, a sixty-second limit, playback, and per-session reflection progress. Streams stop on stop/navigation, and Blob URLs are revoked. Recordings stay in browser memory and are never uploaded or persisted by ECB. Speaking earns no automatic XP/mastery because actual pronunciation quality cannot be verified.
- Optional browser speech recognition is separate from local recording. The UI explains that the browser provider may process audio. It displays transcription and a comparison prompt, never a pronunciation accuracy score. Unsupported/denied microphone, voice or ASR gets a functional fallback notice. A missing voice cannot silently earn a listening completion in the UI.
- Five persistent badges, personal scheduled-day streak, configurable study weekdays/rest dates, and a three-game weekly challenge. Rest days do not break the scheduled-day streak. Failed but genuinely submitted learning attempts and active sessions of at least sixty seconds also count as learning activity; a passing grade is not required for consistency. This schedule is self-managed learning motivation, not HR attendance data. Badges update after an activity submission, including Phase 1 card/grammar work.

## Rewards and isolation

New activity types reward only server-calculated scores of at least 80%. Per distinct target per WITA day: matching/listening/sentence 10 XP (maximum two targets each/day), story comprehension 12 XP (two stories/day), comparison quiz 5 XP (five/day). Existing Phase 1 limits remain intact. Repeating the same target/day does not increase XP. Weekly challenge progress and badges do not change official scores/ranking. Results, preference writes and saved words are scoped to the authenticated employee; Leader is denied the mutation workflow. Phase 1 and Phase 2 challenge endpoints reject each other's challenge types. Browser audio playback is instructional gating, not a tamper-proof assessment signal.

## Database migration

Additive blocks in `migrations/001_supabase.sql` and `migrations/002_sources.sql` create:

- `lc_activity_results`: interactive scores and completion history.
- `lc_saved_words`: per-account personal vocabulary links.
- `lc_preferences`: personal weekdays and extra rest dates.
- `lc_badges`: permanent earned milestones.

All PostgreSQL tables enable RLS and revoke anon/authenticated access; the existing backend role owns them. There are no new grants, SECURITY DEFINER functions, secret keys, packages, paid services, or modifications to existing employee/exam rows. `lc_challenges` and `lc_xp` are reused for one-time transactional grading/reward deduplication.

The HTTP Permissions-Policy allows microphone only for this site's origin; camera/geolocation remain disabled. The CSP permits `blob:` audio playback. This does not grant microphone permission: browsers still require the user's explicit action/permission.

## Run, deploy, authoring

No new configuration is required. Use `node scripts/build-production.mjs`, `node --test tests/*.test.mjs`, `node tests/learning-play-ui.mjs`, then deploy the existing Docker service. Startup applies the idempotent migration through `scripts/start-production.mjs`. Preserve existing Render environment and Supabase settings. The routes are `#practice`, `#practice/matching~1~hsk`, `#story/morning-briefing`, and `#speaking/morning-briefing`.

UTF-8 authoring templates/examples are in `docs/content-templates/stories.csv` and `contrasts.csv`. They are not an automatic publishing endpoint. Validate linguistic/contextual content before updating `app/learning-content.mjs`; do not generate pairs mechanically or label new stories as official HSK texts. Category illustrations are lightweight original CSS/Hanzi compositions; no third-party art is copied.

## Remaining scope

Phase 3 (new Leader learning analytics, department comparisons of independent learning, richer recommendations and broader performance optimization) is not part of this release. Audio/ASR availability and audible quality vary by device. Physical microphone/voice quality cannot be established by mocked browser tests. Local recordings intentionally disappear after navigation/reload and receive no remote score. History/challenge retention at larger scale remains an operational follow-up.
