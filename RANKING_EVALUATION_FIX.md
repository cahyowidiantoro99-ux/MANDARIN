# Bintang Evaluasi — 11 November 2026

Production UI inspection confirmed the default HSK 6 filter marked employees with HSK 1–3 results as “Data ujian belum lengkap”. Selecting HSK 2 showed actual weekly results. No employee exam records were changed.

Changes:
- Separate explanations for another exam level, missing HSK, missing Work, no valid result, and unpaired weeks.
- Show HSK/Work scores beside the combined result, plus update time and explicit refresh.
- Work is independent of the HSK level snapshot (important for midweek promotions).
- Combined period averages use complete same-week pairs only; valid first results, cohort isolation, zero scores and competition ties remain enforced.
- Select filters update automatically. Category switching remains local; seven database queries for the entire cohort, no extra libraries or assets.
- No migration or data rewrite.

Validation: node --test tests/*.test.mjs (102 passed); node scripts/check.mjs (125 JS passed); node scripts/build.mjs; node tests/achievements-ui.mjs (desktop, 390/360 px, ID/Chinese, filters, refresh, no XP writes).

Screenshots: artifacts/evaluation-desktop.png and artifacts/evaluation-mobile.png (synthetic local data).

Files: app/achievements.mjs, public/achievements.js, public/style.css, public/learning-i18n.js, tests/achievements.test.mjs, tests/achievements-ui.mjs.
