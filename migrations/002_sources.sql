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

-- Learning Center Phase 1: additive, preserves all existing progress.

CREATE TABLE IF NOT EXISTS lc_review_state(user_id TEXT NOT NULL REFERENCES profiles(id),vocabulary_id TEXT NOT NULL REFERENCES vocabulary(id),due_at BIGINT NOT NULL,interval_seconds INTEGER NOT NULL,repetitions INTEGER NOT NULL DEFAULT 0,recall_successes INTEGER NOT NULL DEFAULT 0,last_correct INTEGER NOT NULL DEFAULT 0,reviewed_at BIGINT NOT NULL,PRIMARY KEY(user_id,vocabulary_id));
CREATE TABLE IF NOT EXISTS lc_reviews(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES profiles(id),vocabulary_id TEXT NOT NULL REFERENCES vocabulary(id),status TEXT NOT NULL,correct INTEGER,created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS lc_challenges(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES profiles(id),kind TEXT NOT NULL,target_id TEXT NOT NULL,payload TEXT NOT NULL,answers TEXT NOT NULL,created_at BIGINT NOT NULL,revealed_at BIGINT,submitted INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS lc_xp(user_id TEXT NOT NULL REFERENCES profiles(id),day TEXT NOT NULL,activity TEXT NOT NULL,target_id TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount>0 AND amount<=15),created_at BIGINT NOT NULL,PRIMARY KEY(user_id,day,activity,target_id));
CREATE TABLE IF NOT EXISTS lc_practice(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES profiles(id),target_id TEXT NOT NULL,score INTEGER NOT NULL,passed INTEGER NOT NULL,created_at BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS lc_due_user ON lc_review_state(user_id,due_at);
CREATE INDEX IF NOT EXISTS lc_reviews_user ON lc_reviews(user_id,created_at);
CREATE INDEX IF NOT EXISTS lc_challenge_user ON lc_challenges(user_id,created_at);
CREATE INDEX IF NOT EXISTS lc_practice_user ON lc_practice(user_id,created_at);

-- Learning Center Phase 2: additive only.

CREATE TABLE IF NOT EXISTS lc_activity_results(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES profiles(id),kind TEXT NOT NULL,target_id TEXT NOT NULL,score INTEGER NOT NULL CHECK(score>=0 AND score<=100),completed INTEGER NOT NULL,created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS lc_saved_words(user_id TEXT NOT NULL REFERENCES profiles(id),vocabulary_id TEXT NOT NULL REFERENCES vocabulary(id),created_at BIGINT NOT NULL,PRIMARY KEY(user_id,vocabulary_id));
CREATE TABLE IF NOT EXISTS lc_preferences(user_id TEXT PRIMARY KEY REFERENCES profiles(id),work_days TEXT NOT NULL,rest_dates TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS lc_badges(user_id TEXT NOT NULL REFERENCES profiles(id),code TEXT NOT NULL,earned_at BIGINT NOT NULL,PRIMARY KEY(user_id,code));
CREATE INDEX IF NOT EXISTS lc_activity_user ON lc_activity_results(user_id,created_at);
