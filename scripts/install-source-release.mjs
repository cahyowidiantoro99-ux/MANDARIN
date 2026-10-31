import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {openDatabase} from '../app/db.mjs';
import {seed} from './seed.mjs';
import {id,hash,now,assert} from '../app/domain.mjs';
import {chunks,insertRows} from '../app/bulk-insert.mjs';
export async function installSourceRelease(db,payload,{resetLegacy=false}={}){
 assert(payload.curriculum==='HSK3.0'&&payload.questions.length>1000,400,'Release HSK3.0 tidak lengkap.');
 const digest=hash(JSON.stringify(payload)),source=`source-release:${payload.release}:${digest}`;
 await seed(db);
 return db.tx(async t=>{
  const exists=await t.get('SELECT id FROM content_versions WHERE source=?',[source]);if(exists)return {version:exists.id,unchanged:true,...payload.report};
  const version=id(),n=now();await t.run("INSERT INTO content_versions(id,source,status,reviewer,demo,created_at) VALUES(?,?,'published',?,0,?)",[version,source,'Source extraction + automated schema/key/provenance checks; not HSK certification',n]);
  const packages=await t.all('SELECT * FROM learning_packages');const packageId=(r)=>packages.find(p=>p.track===r.track&&p.level===(r.track==='hsk'?r.level:0)&&p.ordinal===(r.package_ordinal||1))?.id;
  for(const batch of chunks(payload.vocabulary)){
   const words=[],metadata=[],links=[];for(const v of batch){const vid=id(),pid=packageId(v);assert(pid,400,'Paket sumber tidak ditemukan.');words.push([vid,v.hanzi,v.pinyin,v.meaning,v.track,v.level,v.department,version]);metadata.push([vid,JSON.stringify(v.provenance),v.part_of_speech,JSON.stringify(v.examples)]);links.push([pid,vid]);}
   await insertRows(t,'vocabulary',['id','hanzi','pinyin','meaning','track','level','department','version_id'],words);await insertRows(t,'vocabulary_metadata',['vocabulary_id','source_ref','part_of_speech','examples'],metadata);await insertRows(t,'package_vocabulary',['package_id','vocabulary_id'],links);
  }
  for(const batch of chunks(payload.questions)){
   const questions=[],optionsRows=[],metadata=[];for(const q of batch){assert(q.options.length===4&&new Set(q.options).size===4&&q.options[q.correct_index],400,'Opsi sumber tidak valid.');const qid=id(),options=q.options.map(label=>({id:id(),label}));questions.push([qid,q.track,q.level,q.department,q.kind,q.direction,q.prompt,JSON.stringify(options),options[q.correct_index].id,q.explanation,null,version]);for(const o of options)optionsRows.push([o.id,qid,o.label]);metadata.push([qid,q.concept_key,JSON.stringify(q.source_ref),q.curriculum,q.difficulty||q.level||1,q.transformation]);}
   await insertRows(t,'questions',['id','track','level','department','kind','direction','prompt','options','correct_id','explanation','benchmark','version_id'],questions);await insertRows(t,'question_options',['id','question_id','label'],optionsRows);await insertRows(t,'question_metadata',['question_id','concept_key','source_ref','curriculum','difficulty','transformation'],metadata);
  }
  for(const batch of chunks(payload.lessons)){
   const lessons=[],links=[];for(const l of batch){const lid=id(),pid=packageId(l);assert(pid,400,'Paket lesson tidak ditemukan.');lessons.push([lid,l.title,l.track,l.level,l.department,l.kind,JSON.stringify(l.body),JSON.stringify(l.source_ref),version]);links.push([pid,lid]);}await insertRows(t,'learning_lessons',['id','title','track','level','department','kind','body','source_ref','version_id'],lessons);await insertRows(t,'package_lessons',['package_id','lesson_id'],links);
  }
  await insertRows(t,'source_assets',['id','title','path','media_type','track','level','legacy','status','sha256','detail'],payload.assets.map(a=>[id(),a.title,a.path,a.media_type,a.track,a.level,a.legacy?1:0,a.status,a.sha256,JSON.stringify(a.detail)]),{suffix:' ON CONFLICT(path) DO UPDATE SET status=excluded.status,detail=excluded.detail,sha256=excluded.sha256'});
  await t.run("UPDATE content_versions SET status='archived' WHERE id!=? AND status='published' AND (demo=1 OR source LIKE 'source-release:%')",[version]);
  for(const[k,v]of Object.entries({curriculum:'HSK3.0',active_release:payload.release,source_version:version,placement_count:20,content_policy:'source-concept-balanced-v2'}))await t.run('INSERT INTO app_config(id,value) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value',[k,JSON.stringify(v)]);
  const oldPolicy=await t.get("SELECT formula FROM ranking_policy_versions WHERE id='v1-normalized-gain'");
  await t.run('INSERT INTO ranking_policy_versions(id,formula,created_at) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING',['hsk3-source-v2',oldPolicy?.formula||'{}',n]);
  await t.run("UPDATE app_config SET value=? WHERE id='ranking_policy'",[JSON.stringify('hsk3-source-v2')]);
  await t.run("UPDATE hsk_levels SET curriculum='HSK3.0'");
  if(resetLegacy){
   const users=await t.all("SELECT p.* FROM profiles p LEFT JOIN profile_curriculum pc ON pc.user_id=p.id WHERE p.role='employee' AND (pc.curriculum IS NULL OR pc.curriculum!='HSK3.0')");
   for(const u of users){await t.run('INSERT INTO audit_logs(id,user_id,action,detail,created_at) VALUES(?,?,?,?,?)',[id(),u.id,'curriculum_transition_preserved_history',JSON.stringify({from:'legacy fixture / HSK2.0',to:'HSK3.0',old_placement:u.placement_level,old_baseline_hsk:u.baseline_hsk,old_baseline_work:u.baseline_work}),n]);await t.run('UPDATE profiles SET placement_level=NULL,baseline_hsk=NULL,baseline_work=NULL,hsk_benchmark=NULL,work_benchmark=NULL WHERE id=?',[u.id]);await t.run("INSERT INTO profile_curriculum(user_id,curriculum,migrated_at) VALUES(?,'HSK3.0',?) ON CONFLICT(user_id) DO UPDATE SET curriculum='HSK3.0',migrated_at=excluded.migrated_at",[u.id,n]);}
   await t.run("UPDATE learning_progress SET completed=0,updated_at=? WHERE user_id NOT IN (SELECT DISTINCT ls.user_id FROM learning_sessions ls JOIN learning_session_metadata lm ON lm.session_id=ls.id WHERE lm.content_mode='source')",[n]);
   await t.run("UPDATE learning_sessions SET closed=1 WHERE id NOT IN (SELECT session_id FROM learning_session_metadata WHERE content_mode='source')");
   await t.run("UPDATE exam_results SET official_key=NULL WHERE session_id NOT IN (SELECT session_id FROM exam_session_metadata WHERE content_mode='source')");
   await t.run("UPDATE exam_sessions SET status='void',official=0 WHERE id NOT IN (SELECT session_id FROM exam_session_metadata WHERE content_mode='source')");
  }
  await t.run('INSERT INTO audit_logs(id,action,detail,created_at) VALUES(?,?,?,?)',[id(),'source_release_installed',JSON.stringify({version,digest,resetLegacy,report:payload.report}),n]);
  return {version,digest,unchanged:false,...payload.report};
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const db=await openDatabase();try{await db.migrate();const result=await installSourceRelease(db,JSON.parse(readFileSync('data/source-release.json','utf8')),{resetLegacy:process.argv.includes('--reset-legacy')});writeFileSync('artifacts/source-installed.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}finally{await db.close();}}
