# Five core missions and adaptive bonus

Policy v2 applies from 2026-11-16 00:00 WITA. Earlier days retain the original three missions and >=80 interactive bonus; closed scheduled days alone enter historical denominators. Current-day progress is shown separately in leader profiles.

## Accepted sources
- Review: flashcard ratings, direct package vocabulary ratings, Chengyu marks; unique Hanzi or idiom per WITA day, independent of XP caps.
- Recall: five unique Hanzi answered correctly through owned recall challenges.
- Hanzi: five unique Hanzi answers, including partial Pinyin banks and the five-question shape quiz. A wrong but accepted answer counts effort; it grants no new XP.
- Language exercise: accepted complete matching, sentence, listening, grammar, translation, word-pair or story submission. No pass threshold. Grammar/translation in the Exam Center count only with all questions answered.
- Time: 600 server-validated active seconds across learning/exam routes. One token per account; >=5 and <=60 seconds heartbeat gap, max20 seconds credited per beat, idle60 seconds, 30-minute clock renewal. Hidden/unfocused tabs are not sent as active. WITA midnight splits time into the proper days.

## One source across portals
The lc_mission_events ledger drives employee summaries, leader current-day detail, historical mission breakdown and adaptive bonus progress. Canonical studyTimeSource combines old package sessions before the cutoff with validated mission time after it; dashboard totals/history, weekly time, analytics, awards and activity/streak models share it. Old/new sources are not summed on the same date.

Bonus is assigned once per account/day: accuracy >=80, two practice types, repair three existing actionable errors, or a pending official weekly track. Ineligible repair/weekly choices are excluded. Completion does not gate the five core missions or award additional XP. Daily assignment stays fixed if errors or weekly status later change. Weekly completion does not require passing.

## Persistence and access
Four additive tables: lc_mission_events, lc_mission_errors, lc_daily_bonus, lc_study_clock. SQLite and PostgreSQL migrations are idempotent. All four are RLS-enabled and revoked from anon/authenticated in PostgreSQL; only server-owned validated handlers record progress. Existing XP rewards, exam pass thresholds, employee records and source keys are unchanged.

Tracking begins at the policy cutoff; unlogged past activity is not invented or backfilled. Catalog browsing/bookmarking does not itself complete review or quiz missions, but foreground active learning time can count. Local recordings are not treated as scored exercises.

Verification includes real activity-handler integration, mixed-policy historical periods, real PostgreSQL schema and access checks, timer idle/parallel-tab/midnight/expiry rules, weekly failing-but-complete bonus, and employee/leader desktop/mobile browser checks.
