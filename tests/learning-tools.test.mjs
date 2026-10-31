import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {Service} from '../app/service.mjs';
import {readingSegments} from '../app/question-reading.mjs';
test('Vocabulary choices persist, remain private and calculate reviewed versus mastered progress',async()=>{
 const db=await openDatabase({file:':memory:',url:null});try{await db.migrate();await seed(db,{demo:true});const s=new Service(db,{demo:true}),u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'"),other=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO003'"),leader=await db.get("SELECT * FROM profiles WHERE role='leader'");const p=(await s.packages(u)).find(p=>p.word_count===10),words=(await s.package(u,p.id)).words;
 for(const [i,status] of ['known','review','unknown'].entries())await s.vocabularyProgress(u,words[i].id,status);
 const row=(await s.packages(u)).find(x=>x.id===p.id);assert.equal(row.learning_percent,30);assert.equal(row.mastery_percent,10);assert.equal(row.study_status,'in_progress');assert.equal((await s.package(other,p.id)).words.filter(x=>x.memory_status).length,0);
 assert.equal((await new Service(db,{demo:true}).package(u,p.id)).words.find(x=>x.id===words[0].id).memory_status,'known');await assert.rejects(()=>s.vocabularyProgress(u,words[0].id,'bad'));await assert.rejects(()=>s.vocabularyProgress(leader,words[0].id,'known'));await assert.rejects(()=>s.vocabularyProgress(u,'00000000-0000-4000-8000-000000000000','known'));
 await s.updateProfile(u,{name:'Nama Baru',department:'DBB1',division:'Teknik Baru',job_title:'Supervisor'});const saved=await db.get('SELECT * FROM profiles WHERE id=?',[u.id]);assert.equal(saved.job_title,'Supervisor');assert.equal(saved.employee_id,u.employee_id);await assert.rejects(()=>s.updateProfile(u,{employee_id:'CHANGED'}));await assert.rejects(()=>s.updateProfile(u,{department:'INVALID'}));
 }finally{await db.close();}
});
test('Pinyin uses phrase context and preserves original question text',()=>{const parts=readingSegments('银行，行走。');assert.equal(parts.map(x=>x.text).join(''),'银行，行走。');assert.equal(parts[0].pinyin,'yín háng');assert.equal(parts[2].pinyin,'xíng zǒu');assert.equal(readingSegments('Pertanyaan Indonesia'),null);});
