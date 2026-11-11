# XP audit and update

Existing rewards retained: review 2, correct recall 3, grammar 15, matching/sentence/listening 10, story quiz 12, legacy contrast 5, Pinyin score improvements. Daily caps are now shared from app/xp-policy.mjs.

New eligible completions: curated pair banks (best correct count), quick pairs (5, cap 3 distinct sets/day), generic exam practice (best scaled 15), weekly exams (best scaled 20 per track/week), HSK learning and simulations (best scaled 30 per paper/mode), skills (best scaled 15 per paper/skill), promotions (40 once per originating level). All exams require a complete passing response; generic practice additionally requires 80. No placement/diagnostic/review/passive rewards. Scores and passing policies unchanged.

All writes use the existing server-only lc_xp ledger in the activity transaction. Best ceilings use stable target hashes and cumulative chunks <=15, preserving existing SQL constraints. Same-attempt replay returns stored results. Pair operations retain account locking and serialization retries. No migration, no historical backfill.

Transparency: category xp in /api/achievements returns rules from the server policy; Peringkat > Penggerak Semangat > Cara dihitung renders them. Dashboard history labels added. Pair result includes XP earned.

Validation: tests/xp-policy.test.mjs, tests/xp-transparency-ui.mjs, full regression and production build. Screenshots artifacts/xp-rules-1365.png and xp-rules-390.png.
