import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {openDatabase} from '../app/db.mjs';import {seed} from '../scripts/seed.mjs';import {installSourceRelease} from '../scripts/install-source-release.mjs';import {Service} from '../app/service.mjs';import {LearningCenter} from '../app/learning-center.mjs';
test('Every source package deck matches its visible vocabulary count and fetches only that package',async()=>{
 const db=await openDatabase({file:':memory:',url:null});await db.migrate();await seed(db,{demo:true});await installSourceRelease(db,JSON.parse(readFileSync('data/source-release.json')));
 try{
 const u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'"),s=new Service(db,{demo:true,sourceContent:true}),lc=new LearningCenter(s),packages=await s.packages(u),all=db.all.bind(db);let returned=0,queries=0;
 db.all=async(sql,p)=>{const rows=await all(sql,p);if(sql.includes('FROM vocabulary v')){assert(sql.includes('pv.package_id=?'),'package filter must be in SQL');returned+=rows.length;queries++;}return rows;};
 let checked=0;for(const p of packages){const deck=await lc.deck(u,{package:p.id,track:p.track==='hsk'?'work':'hsk',level:99});assert.equal(deck.total,p.word_count,p.title);assert.equal(deck.words.length,p.word_count,p.title);assert.equal(new Set(deck.words.map(w=>w.id)).size,p.word_count);assert.equal(deck.package.id,p.id);for(const w of deck.words)assert.deepEqual(Object.keys(w),['id','hanzi','pinyin','status']);checked++;}
 assert.equal(checked,70);assert.equal(queries,70);assert.equal(returned,packages.reduce((n,p)=>n+p.word_count,0));const a=packages.find(p=>p.track==='hsk'&&Number(p.level)===6&&Number(p.ordinal)===1),b=packages.find(p=>p.track==='hsk'&&Number(p.level)===6&&Number(p.ordinal)===2);assert.equal(a.word_count,180);assert.equal(b.word_count,179);
 const deck=await lc.deck(u,{package:a.id});assert(JSON.stringify(deck).length<50000);assert(!JSON.stringify(deck).includes('examples'));assert(!JSON.stringify(deck).includes('meaning'));
 await assert.rejects(()=>lc.deck(u,{package:'00000000-0000-4000-8000-000000000000'}),/Paket tidak ditemukan/);console.log('Verified 70 source packages; HSK6 package 01 = 180 cards, package 02 = 179 cards. Compact package 01 payload:',Buffer.byteLength(JSON.stringify(deck)),'bytes.');
 }finally{await db.close();}
});
