# Native HSK question content

121 source archives, 9,473 numbered items. The catalog still controls which papers are available for simulation or reserved for promotion. No activation, answer keys, scoring policy, exam history or employee data is changed.

content.json holds source-hash-bound prompts, shared passages and option values. Original illustration objects are extracted from the supplied PDFs; split image strips are reassembled. Only referenced WebP assets are shipped (1,801). Answer keys and writing reference answers remain in the server bank and are never copied into client content. HSK6 writing reading material is sent only in its designated reading phase, not the writing response.

H11007 uses a manually checked native-text transcription because its Chinese letters are vector outlines, not extractable Unicode. legacy-manual.json retains this transcription. H10902 has a duplicated printed question number 28; the second occurrence is mapped to bank item 29 without changing its answer key. HSK2 last matching section and HSK3 second reading pool use their actual source option counts.

Regenerate: export archivePapers from app/hsk-bank.mjs to artifacts/active-papers.json, run scripts/audit-hsk-layout.py with Python/pdfplumber, then scripts/extract-hsk-content.py with Pillow. Original PDFs are local in SOAL HSK LENGKAP. The generator writes candidate.json and artifacts/hsk-structured-audit.json for inspection before promotion to content.json. Raw image caches are local artifacts, not deployed.

Validation: tests/structured-hsk.test.mjs checks every archive, number, hash, objective answer identity, illustration, shared group and ordering prompt. tests/structured-hsk-ui.mjs exercises actual local API/browser flows at desktop and mobile sizes.
