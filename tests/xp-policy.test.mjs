import test from 'node:test';import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';import {seed} from '../scripts/seed.mjs';import {Service} from '../app/service.mjs';import {grantBestXp,grantExamXp} from '../app/xp-policy.mjs';import {startVocabulary,answerVocabulary} from '../app/vocab-atlas.mjs';
async function fixture(fn){const db=await openDatabase({file:':memory:',url:null});try{await db.migrate();await seed(db,{demo:true});const u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'"),other=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO003'");await fn(db,u,other);}finally{await db.close();}}
const now=1794400000;
test('best XP chunks respect ledger limit, lifetime improvements, dates and account isolation',()=>fixture(async(db,u,other)=>{
 const grant=(uid,points,time=now)=>db.tx(t=>grantBestXp(t,uid,'pair_bank','bank-1',points,time));
 assert.equal(await grant(u.id,30),30);assert.equal(await grant(u.id,30),0);assert.equal(await grant(u.id,37,now+86400),7);assert.equal(await grant(u.id,20),0);assert.equal(await grant(other.id,30),30);
 await Promise.all([grant(u.id,37),grant(u.id,37)]);assert.equal(Number((await db.get("SELECT SUM(amount) AS n FROM lc_xp WHERE user_id=? AND activity='pair_bank'",[u.id])).n),37);assert((await db.all('SELECT amount FROM lc_xp')).every(r=>r.amount<=15));
}));
test('all exam modes gate XP on complete passing result and exclude baseline and mistakes',()=>fixture(async(db,u)=>{
 const s={user_id:u.id,level:6,track:'hsk',week:'2026-W46',mode:'weekly'};
 const grant=(s,score=100,pass=true,complete=true,official)=>db.tx(t=>grantExamXp(t,s,score,pass,complete,now,official));
 assert.equal(await grant(s,100,true,false),0);assert.equal(await grant(s,70,false),0);assert.equal(await grant(s,80),16);assert.equal(await grant(s,100),4);assert.equal(await grant(s),0);
 for(const mode of ['placement','diagnostic','hsk_mistakes'])assert.equal(await grant({...s,mode}),0);
 assert.equal(await grant({...s,mode:'random30'},79),0);assert.equal(await grant({...s,mode:'random30'},80),12);assert.equal(await grant({...s,mode:'random30'},100),3);
 assert.equal(await grant({...s,mode:'hsk_simulation'},100,true,true,{purpose:'simulation',paper:'H61001'}),30);
 assert.equal(await grant({...s,mode:'hsk_learning'},100,true,true,{purpose:'learning',paper:'H61001'}),30);
 assert.equal(await grant({...s,mode:'hsk_section'},100,true,true,{purpose:'section',paper:'H61001',section:'reading'}),15);
 assert.equal(await grant({...s,mode:'levelup'},100,true,true,{purpose:'promotion',paper:'H61333'}),40);assert.equal(await grant({...s,mode:'levelup'},100,true,true,{purpose:'promotion',paper:'H61332'}),0);
}));
test('pair bank XP appears only at completion, improves once and survives retry; review gives zero',()=>fixture(async(db,u,other)=>{
 async function complete(mode,bank,correctCount){const before=Number((await db.get('SELECT COALESCE(SUM(amount),0) AS n FROM lc_xp WHERE user_id=?',[u.id])).n);let run=await startVocabulary(db,u,{mode,bank},now);const original=JSON.parse((await db.get('SELECT payload FROM lc_challenges WHERE id=?',[run.id])).payload);
 for(let i=0;i<original.questions.length;i++){const q=original.questions[i];run=await answerVocabulary(db,u,run.id,{index:i,choice:i<correctCount?q.to:q.options.find(o=>o!==q.to)},now+i);if(i===0&&original.questions.length>1)assert.equal(Number((await db.get('SELECT COALESCE(SUM(amount),0) AS n FROM lc_xp WHERE user_id=?',[u.id])).n),before);}
 const last=original.questions.at(-1);const retry=await answerVocabulary(db,u,run.id,{index:original.questions.length-1,choice:last.to},now+60);assert.equal(retry.xp,run.xp);return run;}
 assert.equal((await complete('bank',1,30)).xp,30);assert.equal((await complete('review',undefined,100)).xp||0,0);assert.equal((await complete('bank',1,37)).xp,7);assert.equal((await complete('bank',1,37)).xp,0);
 for(let i=0;i<5;i++)await complete('quick',undefined,10);assert.equal(Number((await db.get("SELECT SUM(amount) AS n FROM lc_xp WHERE user_id=? AND activity='pair_quick'",[u.id])).n),15);
 const unfinished=await startVocabulary(db,u,{mode:'quick'},now);await assert.rejects(answerVocabulary(db,other,unfinished.id,{index:0,choice:unfinished.question.options[0]},now),/tidak ditemukan/);
}));
test('generic exam completion actually writes one XP reward, not just helper calls',()=>fixture(async(db,u)=>{
 const service=new Service(db,{demo:true,sourceContent:false,clock:()=>now});await db.run('UPDATE profiles SET placement_level=1 WHERE id=?',[u.id]);const q=await service.startExam(u,{track:'hsk',mode:'random30'});const rows=await db.all('SELECT snapshot FROM exam_session_questions WHERE session_id=?',[q.id]);const answers=Object.fromEntries(rows.map(r=>{const q=JSON.parse(r.snapshot);return [q.id,q.correct_id]}));await service.submitExam(u,q.id,answers);await service.submitExam(u,q.id,answers);assert.equal(Number((await db.get("SELECT SUM(amount) AS n FROM lc_xp WHERE user_id=? AND activity='exam_practice'",[u.id])).n),15);
}));
