# HSK source extraction audit — 12 November 2026

Scope: all 129 archived papers, 10,281 numbered items. This includes simulation, promotion-reserved and legacy source banks. Sources remain the supplied PDFs, with SHA-256 checked before repair.

## Changes

- 7099 items changed; 6410 stems, 54 option lists, 590 contexts, 105 pinyin hints and 6510 task instructions differ from the previous release (fields overlap).
- Listening questions now state the listening task instead of stray A/D labels. HSK6 reading 51–60 explicitly asks for the grammatically incorrect sentence.
- HSK1–4 cloze stems reconstructed with their complete brackets/dialogue; HSK5 and HSK6 passage blanks numbered; all HSK6 word-cloze gaps include line-start gaps and are checked against each option tuple length.
- HSK3 writing 76–80 retains the source pinyin hint. HSK4 ordering duplicate A labels removed.
- Source-label image mapping repaired for H10902 26–30, H11005 26–30 and H11330 11–15. Answer letters themselves were not changed.
- Contaminated option/stem boundaries corrected in source-text-corrections.json. That file records explicit overrides rather than hiding them in rendering logic.
- Three incomplete Writing reference alternatives restored from continuation lines: H41001/91, H41002/91, H51001/91. Existing completed scores/snapshots are not recalculated.

## Verification and limits

- 9,510 objective answer keys compared by number against supplied answer pages: zero differences. Two scanned key sources (H31007 and H61007) use the hash-bound transcription and were visually inspected against their original answer pages in this audit.
- 682 nonempty Writing references compared with source answer entries: zero differences after the three corrections. Open-ended tasks without a model answer remain rubric/AI graded; no fabricated fixed key was added.
- 1,209 unique picture-choice mappings checked against source label coordinates: 1,204 positional matches and five visually verified exceptions. Three swapped pools were corrected before the final run.
- Browser renderer traverses all 10,281 items in an isolated fixture and checks stems, choices, passages and Writing inputs. Authenticated local demo flows capture desktop/390px screenshots for the reported H61009/H31002 defects and HSK3 Writing, and verify no horizontal overflow.
- Per-item audit is source/structure comparison plus visual exception review; this is not a claim that a human independently reread the linguistic meaning of every original question or that supplied official PDFs cannot contain errors.
- No production employee database writes or migrations. No new client dependencies. Repairs happen offline; the UI still renders one item at a time.

## Reproduce

1. Export archivePapers from app/hsk-bank.mjs to artifacts/active-papers.json; run scripts/audit-hsk-layout.py to create coordinate caches and retain raw illustration objects.
2. Run python scripts/audit-hsk-answer-keys.py, python scripts/audit-hsk-writing-references.py and python scripts/audit-hsk-image-labels.py. Detailed reports remain in artifacts (not public assets).
3. Run python scripts/repair-hsk-prompts.py after extracting a new candidate; inspect differences and all unresolved flags before adopting it. The repair script does not change answer keys.
4. Run node --test --test-concurrency=2 tests/*.test.mjs; node tests/hsk-repair-ui.mjs; node tests/structured-hsk-ui.mjs; node scripts/check.mjs; node scripts/build-production.mjs.

The prompt/option repairs are shared by the learning, timed simulation, per-skill and level-up renderers through the same hash-bound structured content.

Final local regression: 134 tests passed, 0 failed; syntax/security lint 155 JS files passed; production build passed. An earlier restricted-sandbox run could not reach loopback HTTP (EACCES); the authorized loopback run above passed.
