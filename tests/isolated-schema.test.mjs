import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {databaseSchema,postgresMigration} from '../app/postgres-schema.mjs';
test('[PostgreSQL] Mandarin migration preserves another application in public and isolates RLS objects',async()=>{
 const pg=new PGlite();try{
  await pg.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA auth TO authenticated; CREATE TABLE public.profiles(marker text); INSERT INTO public.profiles VALUES('existing application');`);
  await pg.exec(`CREATE SCHEMA ecb_mandarin; CREATE FUNCTION ecb_mandarin.request_user_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT auth.uid() $$; REVOKE ALL ON FUNCTION ecb_mandarin.request_user_id() FROM PUBLIC; GRANT EXECUTE ON FUNCTION ecb_mandarin.request_user_id() TO authenticated;`);
  const sql=postgresMigration('migrations/001_supabase.sql','ecb_mandarin');await pg.exec(sql);await pg.exec(sql);
  assert.deepEqual((await pg.query('SELECT * FROM public.profiles')).rows,[{marker:'existing application'}]);
  const tables=(await pg.query("SELECT relname,relrowsecurity FROM pg_class WHERE relnamespace='ecb_mandarin'::regnamespace AND relkind='r'")).rows;
  assert(tables.length>30);assert(tables.every(t=>t.relrowsecurity));
  assert.equal((await pg.query("SELECT to_regprocedure('public.is_shared_leader()') AS fn")).rows[0].fn,null);
  assert((await pg.query("SELECT to_regprocedure('ecb_mandarin.is_shared_leader()') AS fn")).rows[0].fn);
  await pg.exec(`CREATE ROLE ecb_mandarin_app; GRANT ecb_mandarin_app TO postgres; ALTER SCHEMA ecb_mandarin OWNER TO ecb_mandarin_app; GRANT EXECUTE ON FUNCTION ecb_mandarin.request_user_id() TO ecb_mandarin_app; DO $owner$ DECLARE obj record; BEGIN FOR obj IN SELECT relname,relkind FROM pg_class WHERE relnamespace='ecb_mandarin'::regnamespace AND relkind IN ('r','v') LOOP EXECUTE format('ALTER %s ecb_mandarin.%I OWNER TO ecb_mandarin_app',CASE WHEN obj.relkind='v' THEN 'VIEW' ELSE 'TABLE' END,obj.relname); END LOOP; END $owner$; ALTER FUNCTION ecb_mandarin.is_shared_leader() OWNER TO ecb_mandarin_app; SET ROLE ecb_mandarin_app;`);
  await pg.exec(sql);
  assert.equal((await pg.query("SELECT has_schema_privilege(current_user,'auth','USAGE') AS allowed")).rows[0].allowed,false);
  assert.equal((await pg.query('SELECT ecb_mandarin.request_user_id() AS uid')).rows[0].uid,null);
  await assert.rejects(()=>pg.exec("CREATE OR REPLACE FUNCTION ecb_mandarin.request_user_id() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$"),/owner/);
  await assert.rejects(()=>pg.query('SELECT * FROM public.profiles'),/permission denied/);
  await pg.exec('RESET ROLE;');
  await pg.exec('SET ROLE authenticated; SET search_path=ecb_mandarin;');
  assert.deepEqual((await pg.query('SELECT id,name FROM profiles')).rows,[]);
  await assert.rejects(()=>pg.query('SELECT * FROM questions'),/permission denied/);
  assert.throws(()=>databaseSchema('auth'));assert.throws(()=>databaseSchema('public; DROP SCHEMA public CASCADE'));
 }finally{await pg.close();}
});
