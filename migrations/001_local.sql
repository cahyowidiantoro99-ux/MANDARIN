PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS departments (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS divisions (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS job_titles (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS hsk_levels (id INTEGER PRIMARY KEY CHECK(id BETWEEN 1 AND 6), curriculum TEXT NOT NULL DEFAULT 'HSK3.0');
CREATE TABLE IF NOT EXISTS profiles (
 id TEXT PRIMARY KEY, employee_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
 email TEXT NOT NULL, department TEXT NOT NULL REFERENCES departments(id), division TEXT NOT NULL, job_title TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'employee' CHECK(role IN ('employee','leader')),
 password_hash TEXT, self_level INTEGER NOT NULL CHECK(self_level BETWEEN 1 AND 6), placement_level INTEGER,
 baseline_hsk REAL, baseline_work REAL, hsk_benchmark TEXT, work_benchmark TEXT,
 demo INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES profiles(id), csrf TEXT NOT NULL, expires_at BIGINT NOT NULL, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS reset_tokens (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES profiles(id), expires_at BIGINT NOT NULL, used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS rate_limits (id TEXT PRIMARY KEY, window_start BIGINT NOT NULL, attempts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS app_config (id TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS content_versions (id TEXT PRIMARY KEY, source TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft','under_review','approved','published','archived')), reviewer TEXT, demo INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS learning_packages (id TEXT PRIMARY KEY, title TEXT NOT NULL, track TEXT NOT NULL CHECK(track IN ('hsk','work')), level INTEGER, ordinal INTEGER NOT NULL, demo INTEGER NOT NULL DEFAULT 0, UNIQUE(track,level,ordinal));
CREATE TABLE IF NOT EXISTS vocabulary (id TEXT PRIMARY KEY, hanzi TEXT NOT NULL, pinyin TEXT NOT NULL, meaning TEXT NOT NULL, track TEXT NOT NULL CHECK(track IN ('hsk','work')), level INTEGER, department TEXT, version_id TEXT NOT NULL REFERENCES content_versions(id));
CREATE TABLE IF NOT EXISTS package_vocabulary (package_id TEXT NOT NULL REFERENCES learning_packages(id), vocabulary_id TEXT NOT NULL REFERENCES vocabulary(id), PRIMARY KEY(package_id,vocabulary_id));
CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, track TEXT NOT NULL CHECK(track IN ('hsk','work')), level INTEGER, department TEXT, kind TEXT NOT NULL, direction TEXT, prompt TEXT NOT NULL, options TEXT NOT NULL, correct_id TEXT NOT NULL, explanation TEXT NOT NULL, weight REAL NOT NULL DEFAULT 1 CHECK(weight > 0), benchmark TEXT, version_id TEXT NOT NULL REFERENCES content_versions(id));
CREATE TABLE IF NOT EXISTS question_options (id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES questions(id), label TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS exam_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES profiles(id), track TEXT NOT NULL, mode TEXT NOT NULL, level INTEGER NOT NULL, week TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','submitted','void')), started_at BIGINT NOT NULL, deadline BIGINT NOT NULL, submitted_at BIGINT, official INTEGER NOT NULL DEFAULT 0, demo INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS exam_session_questions (session_id TEXT NOT NULL REFERENCES exam_sessions(id), question_id TEXT NOT NULL, ordinal INTEGER NOT NULL, snapshot TEXT NOT NULL, PRIMARY KEY(session_id,question_id), UNIQUE(session_id,ordinal));
CREATE TABLE IF NOT EXISTS exam_answers (session_id TEXT NOT NULL REFERENCES exam_sessions(id), question_id TEXT NOT NULL, option_id TEXT NOT NULL, saved_at BIGINT NOT NULL, PRIMARY KEY(session_id,question_id), FOREIGN KEY(session_id,question_id) REFERENCES exam_session_questions(session_id,question_id));
CREATE TABLE IF NOT EXISTS exam_results (id TEXT PRIMARY KEY, session_id TEXT NOT NULL UNIQUE REFERENCES exam_sessions(id), user_id TEXT NOT NULL REFERENCES profiles(id), score REAL NOT NULL CHECK(score BETWEEN 0 AND 100), passed INTEGER NOT NULL, official_key TEXT UNIQUE, benchmark TEXT, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS placement_sessions (id TEXT PRIMARY KEY REFERENCES exam_sessions(id), level INTEGER NOT NULL, score REAL, benchmark TEXT);
CREATE TABLE IF NOT EXISTS placement_answers (session_id TEXT NOT NULL REFERENCES placement_sessions(id), question_id TEXT NOT NULL, option_id TEXT NOT NULL, PRIMARY KEY(session_id,question_id));
CREATE TABLE IF NOT EXISTS weekly_targets (user_id TEXT NOT NULL REFERENCES profiles(id), week TEXT NOT NULL, target_minutes INTEGER NOT NULL DEFAULT 60, PRIMARY KEY(user_id,week));
CREATE TABLE IF NOT EXISTS learning_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES profiles(id), package_id TEXT NOT NULL REFERENCES learning_packages(id), started_at BIGINT NOT NULL, last_heartbeat BIGINT NOT NULL, active_seconds INTEGER NOT NULL DEFAULT 0, closed INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS learning_progress (user_id TEXT NOT NULL REFERENCES profiles(id), package_id TEXT NOT NULL REFERENCES learning_packages(id), completed INTEGER NOT NULL DEFAULT 0, updated_at BIGINT NOT NULL, PRIMARY KEY(user_id,package_id));
CREATE TABLE IF NOT EXISTS notification_preferences (user_id TEXT PRIMARY KEY REFERENCES profiles(id), in_app INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES profiles(id), dedupe TEXT NOT NULL UNIQUE, message TEXT NOT NULL, read_at BIGINT, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS ranking_policy_versions (id TEXT PRIMARY KEY, formula TEXT NOT NULL, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS ranking_snapshots (id TEXT PRIMARY KEY, period TEXT NOT NULL, period_start BIGINT NOT NULL, policy_id TEXT NOT NULL REFERENCES ranking_policy_versions(id), data TEXT NOT NULL, created_at BIGINT NOT NULL, UNIQUE(period,period_start,policy_id));
CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, user_id TEXT REFERENCES profiles(id), action TEXT NOT NULL, detail TEXT NOT NULL, created_at BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_exam_user ON exam_sessions(user_id,started_at);
CREATE INDEX IF NOT EXISTS idx_exam_week ON exam_sessions(week,mode,track);
CREATE INDEX IF NOT EXISTS idx_question_pool ON questions(track,level,department,kind);
CREATE INDEX IF NOT EXISTS idx_learning_user ON learning_sessions(user_id,started_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_email ON profiles(LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_leader ON profiles(role) WHERE role='leader';
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_exam ON exam_sessions(user_id) WHERE status='active';
