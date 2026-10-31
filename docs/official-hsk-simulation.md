# HSK archive simulation

The source is the user's SOAL HSK LENGKAP directory. These are legacy six-level HSK papers, not current HSK 3.0 exams or official certificates. Initial adaptive placement and weekly/practice content remain separate.

| Level | Paper | Listening | Reading | Writing | Nominal total minutes |
|---|---|---:|---:|---:|---:|
| 1 | H11007 | 20 | 20 | 0 | 40 |
| 2 | H20901 | 35 | 25 | 0 | 55 |
| 3 | H31001 | 40 | 30 | 10 | 90 |
| 4 | H41001 | 45 | 40 | 15 | 105 |
| 5 | H51001 | 45 | 45 | 10 | 125 |
| 6 | H61001 | 50 | 50 | 1 | 140 |

One validated original paper and matching MP3 per level are enabled initially. Other archived papers remain in the source library. Original question pages include images, shared choices, true/false, ordering, character/sentence completion, picture-based writing and essays. Answer keys and listening transcripts are not rendered as exam pages. data/official-hsk/manifest.json is a private backend file, not a static browser asset.

Five minutes of preparation and the original three/five-minute answer transfer stages are included. Listening uses the measured MP3 length because the cover gives an approximate duration; clipping at the rounded duration would cut actual recordings. Reading/writing use the source minutes. HSK6 closes its original passage after ten minutes and allows thirty-five minutes for the approximately 400-character summary. Server time controls all phases. Expired sections reject edits and future/closed source pages reject access. The source library is locked during an active simulation. Login lifetime is extended for the current session only to exam deadline plus fifteen minutes.

Each listening/reading section is linearly normalized to 100 for internal simulation. Writing weights: HSK3 10x10; HSK4 10x6 and 5x8; HSK5 8x5 and 2x30; HSK6 1x100. Scores are approximations, not officially calibrated HSK results. The previously requested internal promotion threshold remains 80% (not an assertion of the official pass criterion). Weekly ranking and initial baseline are not overwritten; lower-level practice cannot lower the achieved level. A successful current stage automatically opens the next level's preparation stage, ending at HSK6.

## Optional AI writing assessment

Set OPENAI_API_KEY and OPENAI_GRADING_MODEL in the server's secret environment to enable the OpenAI Responses integration. No key is included in code or browser assets. Until configured, nontrivial writing stays pending and does not change the level. Blank writing is zero; verified exact HSK3 reference answers can be scored directly. AI receives task images/context and submitted answers only, without profile identity. Responses use store:false, a strict JSON schema and server-side range/coverage validation. AI scores are explicitly internal estimates. Failed calls preserve answers and allow retry. Leader remains read-only.

Local verification uses a mock AI transport, not a paid live API evaluation. The provider was not configured locally during implementation. Server section boundaries, privacy/CSRF, a login beyond an hour, MP3 range delivery, real source page rendering, mobile zoom, HSK6 passage closure, and pending/complete score paths are tested.

## Voice

Learning uses senior style (rate .72, pitch .88), preferring Microsoft Kangkang. The selector menu is removed. If Kangkang is unavailable on the device, another Mandarin voice is used with a notice; if no Mandarin voice exists, the UI explains how to enable it. Tapping the active word/sentence again stops speech. This is synthesized speech, not a recording of an elderly person.

## Reference

- https://www.chinesetest.cn/HSK/1?lang=en
- https://www.chinesetest.cn/HSK/6
- Original PDF covers, question pages, answer keys, and matching MP3s identified by manifest SHA-256.
