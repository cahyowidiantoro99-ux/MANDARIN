# HSK6 supplemented Writing and exam launch — 2026-11-12

Eight supplied PDFs are now validated and available: H61008, H61009, H61110, H61111, H61218, H61219, H61220, H61221. Each has 50 Listening + 50 Reading + 1 Writing item, complete objective keys, matching audio and two pages of summarization source before answer pages. Original PDFs/audio and source-only review images are included; native structured questions cover all 808 added items. Hanzi sequences in all eight Writing extracts match their supplied source text exactly.

The catalog now has all 108 planned simulation papers available. Archive content totals 129 papers/10,281 items, including reserved and legacy papers. Existing selection, thresholds, XP, employee data and history are unchanged; no migration is required.

Launch buttons show a busy state immediately, verify the returned session ID, and show request errors adjacent to the clicked button so an existing-session conflict is visible without scrolling to the page header. Local tests reproduce successful starts through the real menu for full learning, timed simulation, Listening, Reading and all eight new Writing sections. Starting a different paper while another is active shows a visible error and the existing-session link resumes it.

Writing practice without a timer displays its source beside the writing input. Timed simulation and promotion preserve the reading-only phase and hide the source during Writing. The input fills the available width and is usable on mobile.

Validation and deployment results are recorded in DEPLOYMENT_STATUS.md in the outer workspace. Browser checks: tests/exam-launch-ui.mjs and tests/structured-hsk-ui.mjs. Source guards: tests/hsk-scanned-keys.test.mjs and tests/structured-hsk.test.mjs.

Final local verification: 129/129 unit/integration/security tests passed; production lint 153 JS files and build passed; both exam browser suites passed at desktop and mobile sizes.
