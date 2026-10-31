CREATE TABLE IF NOT EXISTS question_metadata (question_id TEXT PRIMARY KEY REFERENCES questions(id), concept_key TEXT NOT NULL, source_ref TEXT NOT NULL, curriculum TEXT NOT NULL, difficulty INTEGER, transformation TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_question_concept ON question_metadata(concept_key);
CREATE TABLE IF NOT EXISTS vocabulary_metadata (vocabulary_id TEXT PRIMARY KEY REFERENCES vocabulary(id), source_ref TEXT NOT NULL, part_of_speech TEXT, examples TEXT NOT NULL DEFAULT '[]');
CREATE TABLE IF NOT EXISTS learning_lessons (id TEXT PRIMARY KEY, title TEXT NOT NULL, track TEXT NOT NULL, level INTEGER, department TEXT, kind TEXT NOT NULL, body TEXT NOT NULL, source_ref TEXT NOT NULL, version_id TEXT NOT NULL REFERENCES content_versions(id));
CREATE TABLE IF NOT EXISTS package_lessons (package_id TEXT NOT NULL REFERENCES learning_packages(id), lesson_id TEXT NOT NULL REFERENCES learning_lessons(id), PRIMARY KEY(package_id,lesson_id));
CREATE TABLE IF NOT EXISTS source_assets (id TEXT PRIMARY KEY, title TEXT NOT NULL, path TEXT NOT NULL UNIQUE, media_type TEXT NOT NULL, track TEXT NOT NULL, level INTEGER, legacy INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL, sha256 TEXT NOT NULL, detail TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS exam_session_metadata (session_id TEXT PRIMARY KEY REFERENCES exam_sessions(id), curriculum TEXT NOT NULL, content_mode TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS profile_curriculum (user_id TEXT PRIMARY KEY REFERENCES profiles(id), curriculum TEXT NOT NULL, migrated_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS exam_exposure_order (session_id TEXT PRIMARY KEY REFERENCES exam_sessions(id), ordinal BIGINT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS learning_session_metadata (session_id TEXT PRIMARY KEY REFERENCES learning_sessions(id), content_mode TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS vocabulary_progress (user_id TEXT NOT NULL REFERENCES profiles(id), vocabulary_id TEXT NOT NULL REFERENCES vocabulary(id), status TEXT NOT NULL CHECK(status IN ('known','review','unknown')), updated_at BIGINT NOT NULL, PRIMARY KEY(user_id,vocabulary_id));

CREATE TABLE IF NOT EXISTS official_exam_state (session_id TEXT PRIMARY KEY REFERENCES exam_sessions(id), paper_id TEXT NOT NULL, answers_json TEXT NOT NULL, grading_status TEXT NOT NULL, scores_json TEXT, grading_started BIGINT);
