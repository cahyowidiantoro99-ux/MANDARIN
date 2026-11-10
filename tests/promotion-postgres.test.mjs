import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {Service} from '../app/service.mjs';
import {seed} from '../scripts/seed.mjs';
import {id,periodBounds} from '../app/domain.mjs';
import {hskCatalog,archivePapers} from '../app/hsk-bank.mjs';
test('PostgreSQL promotion opens a reserved paper for a qualified employee',async()=>{
 const pg=new PGlite();
 const wrap=client=>({async all(sql,params=[]){let n=0;try{return (await client.query(sql.replace(/\?/g,()=>'$'+(++n)),params)).rows;}catch(e){console.error('PostgreSQL statement failed:',sql,'parameter types:',params.map(p=>typeof p));throw e;}},async get(sql,params=[]){return (await this.all(sql,params))[0];},async run(sql,params=[]){return this.all(sql,params);}});
 const db=wrap(pg);db.tx=fn=>pg.transaction(t=>fn(wrap(t)));
 try{
  await pg.exec("CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;");
  await pg.exec(readFileSync('migrations/001_supabase.sql','utf8'));await seed(db);
  const uid=id(),time=1793780000;
  await db.run("INSERT INTO profiles(id,employee_id,name,email,department,division,job_title,role,self_level,placement_level,created_at) VALUES(?,?,?,?,?,?,?,'employee',1,1,?)",[uid,'PGPROMO','Promotion QA','promotion@example.invalid','DBB1','QA','QA',time]);
  for(const track of ['hsk','work']){const sid=id();await db.run("INSERT INTO exam_sessions(id,user_id,track,mode,level,week,status,started_at,deadline,submitted_at,demo) VALUES(?,?,?,'weekly',1,?,'submitted',?,?,?,0)",[sid,uid,track,periodBounds('weekly',time).key,time-100,time+100,time-50]);await db.run('INSERT INTO exam_results(id,session_id,user_id,score,passed,official_key,created_at) VALUES(?,?,?,80,1,?,?)',[id(),sid,uid,id(),time-50]);await db.run("INSERT INTO exam_session_metadata(session_id,curriculum,content_mode) VALUES(?,'HSK3.0','source')",[sid]);}
  const service=new Service(db,{clock:()=>time,demo:false,sourceContent:true}),u=await db.get('SELECT * FROM profiles WHERE id=?',[uid]);
  assert.equal((await hskCatalog(service,u)).promotion.eligible,true);
  const exam=await service.startExam(u,{mode:'levelup',track:'hsk'});
  assert.equal(exam.purpose,'promotion');assert.equal(exam.level,1);assert.equal(exam.policy.target_level,2);assert.equal((await db.get('SELECT COUNT(*)::int AS n FROM hsk_attempt_options')).n,1);
  assert.equal(Number.isInteger(exam.deadline),true);
  const timedPapers=new Set([exam.paper.id]);await db.run("UPDATE exam_sessions SET status='void' WHERE id=?",[exam.id]);
  for(const paper of archivePapers.filter(p=>!p.reserved)){
   const q=await service.startExam(u,{mode:'hsk_simulation',paper_id:paper.id});timedPapers.add(q.paper.id);
   assert.equal(q.deadline-time,Math.ceil(paper.total_seconds-paper.phases.filter(p=>p.id==='preparation').reduce((n,p)=>n+(p.seconds||p.minutes*60),0)),paper.id);assert.equal(Number.isInteger(q.deadline),true,paper.id);
   await db.run("UPDATE exam_sessions SET status='void' WHERE id=?",[q.id]);
  }
  // Rotate both reserved sources at every eligible level through real promotion starts.
  for(const level of [1,2,3,4,5]){
   await db.run('UPDATE profiles SET placement_level=? WHERE id=?',[level,uid]);
   if(level!==1)for(const track of ['hsk','work']){const sid=id();await db.run("INSERT INTO exam_sessions(id,user_id,track,mode,level,week,status,started_at,deadline,submitted_at) VALUES(?,?,?,'weekly',?,?,'submitted',?,?,?)",[sid,uid,track,level,periodBounds('weekly',time).key,time-100,time+100,time-50]);await db.run('INSERT INTO exam_results(id,session_id,user_id,score,passed,official_key,created_at) VALUES(?,?,?,80,1,?,?)',[id(),sid,uid,id(),time-50]);await db.run("INSERT INTO exam_session_metadata(session_id,curriculum,content_mode) VALUES(?,'HSK3.0','source')",[sid]);}
   for(let i=0;i<3;i++){service.clock=()=>time+level*10+i;const q=await service.startExam(u,{mode:'levelup'}),paper=archivePapers.find(p=>p.id===q.paper.id);timedPapers.add(paper.id);assert.equal(Number.isInteger(q.deadline),true);assert(q.untimed);assert.equal(q.deadline-q.started_at,30*86400);assert.equal(q.policy.target_level,level+1);await db.run("UPDATE exam_sessions SET status='void' WHERE id=?",[q.id]);}
  }
  assert.equal(timedPapers.size,archivePapers.filter(p=>!p.reserved||p.difficulty&&p.level<6).length,'every public and currently eligible reserved paper starts with an integer deadline');
 }finally{await pg.close();}
});
