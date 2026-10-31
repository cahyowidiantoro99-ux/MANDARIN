import {readFileSync,writeFileSync} from 'node:fs';
let sql=(readFileSync('migrations/001_local.sql','utf8')+'\n'+readFileSync('migrations/002_sources.sql','utf8')).replace('PRAGMA foreign_keys = ON;','-- Supabase PostgreSQL migration. Run as postgres / service owner.\nBEGIN;').replace(/\bREAL\b/g,'DOUBLE PRECISION');
const uuidTables=new Set(['profiles','content_versions','learning_packages','vocabulary','questions','question_options','exam_sessions','exam_results','placement_sessions','learning_sessions','notifications','ranking_snapshots','audit_logs','learning_lessons','source_assets']);
sql=sql.replace(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\);/g,(all,table,body)=>{
 if(uuidTables.has(table))body=body.replace(/\bid TEXT PRIMARY KEY/,'id UUID PRIMARY KEY');
 body=body.replace(/\b(user_id|session_id|package_id|vocabulary_id|version_id|question_id|lesson_id) TEXT/g,'$1 UUID');
 // placement_sessions.id refers to exam_sessions; all values are UUIDs. Options/correct IDs are UUID strings in JSON.
 return `CREATE TABLE IF NOT EXISTS ${table} (${body});`;
});
sql+='\n-- No browser mutation grants. All writes go through the authenticated, authorized server.\n';
const tables=[...sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map(m=>m[1]);
for(const t of tables)sql+=`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;\nREVOKE ALL ON ${t} FROM anon, authenticated;\n`;
// Only the owner can read their full profile. Leaders use a narrow, read-only view.
sql+=`DROP POLICY IF EXISTS own_profile ON profiles;
CREATE POLICY own_profile ON profiles FOR SELECT TO authenticated USING (id=auth.uid() AND role='employee');
GRANT SELECT(id,employee_id,name,email,department,division,job_title,role,self_level,placement_level,baseline_hsk,baseline_work,demo,created_at) ON profiles TO authenticated;
CREATE OR REPLACE FUNCTION public.is_shared_leader() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='leader'); $$;
REVOKE ALL ON FUNCTION public.is_shared_leader() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_shared_leader() TO authenticated;
CREATE OR REPLACE VIEW public.leader_employee_directory WITH (security_barrier=true) AS SELECT id,name,department,division,job_title,self_level,placement_level,baseline_hsk,baseline_work,demo,created_at FROM public.profiles WHERE role='employee' AND public.is_shared_leader();
REVOKE ALL ON public.leader_employee_directory FROM anon,authenticated;
GRANT SELECT ON public.leader_employee_directory TO authenticated;
`;
for(const t of ['exam_sessions','exam_results','learning_sessions','learning_progress','weekly_targets','notifications','notification_preferences'])sql+=`DROP POLICY IF EXISTS own_or_leader_read ON ${t};\nCREATE POLICY own_or_leader_read ON ${t} FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.is_shared_leader());\nGRANT SELECT ON ${t} TO authenticated;\n`;
for(const t of ['departments','divisions','job_titles','hsk_levels','learning_packages','ranking_policy_versions'])sql+=`DROP POLICY IF EXISTS authenticated_read ON ${t};\nCREATE POLICY authenticated_read ON ${t} FOR SELECT TO authenticated USING (true);\nGRANT SELECT ON ${t} TO authenticated;\n`;
sql+=`DROP POLICY IF EXISTS published_vocabulary ON vocabulary;
CREATE POLICY published_vocabulary ON vocabulary FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM content_versions cv WHERE cv.id=version_id AND cv.status='published' AND cv.demo=0));
DROP POLICY IF EXISTS published_versions ON content_versions;
CREATE POLICY published_versions ON content_versions FOR SELECT TO authenticated USING(status='published' AND demo=0);
GRANT SELECT ON vocabulary,content_versions TO authenticated;
DROP POLICY IF EXISTS published_package_links ON package_vocabulary;
CREATE POLICY published_package_links ON package_vocabulary FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM vocabulary v WHERE v.id=vocabulary_id));
GRANT SELECT ON package_vocabulary TO authenticated;
-- profiles, questions, options, exam snapshots, answers, reset/session/rate tables have no write grants.
-- Exam snapshots contain correct answers and are NEVER readable through PostgREST.
COMMIT;
`;
writeFileSync('migrations/001_supabase.sql',sql);
console.log('PostgreSQL schema + RLS generated.');
