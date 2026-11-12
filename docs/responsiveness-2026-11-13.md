# Responsiveness verification — 13 November 2026

Changed: readable login/dashboard/navigation sizing; bounded recall prefetch; preserve read cache for challenge/reveal/heartbeat operations; invalidate after progress writes; parallel startup metadata/session reads; fewer badge queries; concurrent PostgreSQL transactions with serializable conflict retry. Registration and identity updates do not retry remote side effects. SQLite remains serialized. No migration or XP rule change.

Local Edge tests use isolated demo accounts, not employee records. At 1920, 1366 and 390 pixels no horizontal overflow was detected. Login inputs increased from 12px to 16px; desktop form width from 541px to 600px. Screenshots are in artifacts/perf-after-*.png.

With artificial API delay (650ms recall challenge, 250ms answer submit, 100ms other requests), the final comparison measured recall next 720ms before and 42ms after. Other route readiness ranged 32–961ms; this includes shell readiness, not proof that every background request finished. Initial uncached loading still exists. Measurements vary under parallel test load and are not production latency claims.

Official submit browser regression: desktop and HP, cancel, failed request retry, saved answer and result passed. Unit/integration suite covers server ownership, CSRF, XP deduplication, progress persistence and placement/weekly regressions. PostgreSQL concurrency helper is tested with a simulated pool; schema and SQL integrations also run with PGlite. Managed Supabase concurrency and physical Android audio were not measured here.

Network saving and AI writing grading remain server-authoritative. A completed result is not displayed before successful persistence. Free Render cold startup cannot be removed by client CSS/cache. No paid upgrade was made.
