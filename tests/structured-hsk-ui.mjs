import {readFileSync} from 'node:fs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {createApp} from '../app/server.mjs';
import {id,periodBounds} from '../app/domain.mjs';
import {learningDay} from '../app/learning-motivation.mjs';

// Isolated, disposable demo database. No cloud account or employee data is used.
const db=await openDatabase({file:':memory:',url:null});
await db.migrate();await seed(db,{demo:true});
let now=Date.parse('2026-11-10T12:00:00+08:00')/1000;
const u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'");

const app=await createApp({db,demo:true,migrate:false,auth:{supabase:false,clock:()=>now},service:{sourceContent:true,clock:()=>now}});
await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+app.server.address().port;
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const {changeStudySection,abandonOfficial,officialAsset,studyFeedback}=await import('../app/official-hsk.mjs');
const shot=async name=>{await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:'artifacts/'+name+'.png',fullPage:true});};
try{
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.locator('.dash-vocabulary').waitFor();
 const q=await app.service.startExam(u,{mode:'hsk_learning',paper_id:'H11112'});
 assert(q.items.every(i=>i.content));assert(!JSON.stringify(q.items).includes('"key"'));
 await assert.rejects(()=>studyFeedback(app.service,u,q.id,1),/setelah/);
 await assert.rejects(()=>officialAsset(app.service,u,q.id,'figure',34),/tersedia/);
 await changeStudySection(app.service,u,q.id,'reading');
 await page.goto(base+'/#exam/'+q.id);
 await page.locator('.structured-figure').waitFor();
 assert.equal(await page.locator('[data-feedback]').count(),0);
 assert.equal(await page.locator('.official-paper-image').count(),0);
 await page.locator('[data-choice="√"]').click();
 await page.waitForFunction(()=>document.querySelector('#official-save').textContent==='Jawaban tersimpan di server.');
 await shot('structured-hsk1-desktop');
 await page.setViewportSize({width:390,height:844});await shot('structured-hsk1-hp');
 await page.locator('[data-next]').click();assert.equal(await page.locator('.structured-prompt').innerText(),'中午');
 await page.reload();await page.locator('[data-choice="√"][aria-pressed=true]').waitFor();
 for(let i=0;i<5;i++)await page.locator('[data-next]').click();
 assert.equal(await page.locator('.structured-option img').count(),6);
 await page.locator('[data-choice="B"]').click();
 await page.waitForFunction(()=>document.querySelector('#official-save').textContent==='Jawaban tersimpan di server.');
 assert.equal((await app.service.getExam(u,q.id)).answers[26],'B');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await shot('structured-hsk1-group-hp');
 await abandonOfficial(app.service,u,q.id);
 const h=await app.service.startExam(u,{mode:'hsk_learning',paper_id:'H31002'});
 await changeStudySection(app.service,u,h.id,'reading');
 await page.goto(base+'/#exam/'+h.id);await page.locator('.structured-prompt').waitFor();
 assert.equal(await page.locator('[data-choice]').count(),6);
 await page.locator('[data-choice="A"]').click();await page.locator('[data-next]').click();
 assert.equal(await page.locator('.structured-meta strong').innerText(),'Soal 42');
 await page.locator('[data-jump="0"]').click();assert.equal(await page.locator('[data-choice=A]').getAttribute('aria-pressed'),'true');
 await shot('structured-hsk3-group-hp');
 await page.setViewportSize({width:1440,height:1000});await shot('structured-hsk3-desktop');
 await changeStudySection(app.service,u,h.id,'writing');await page.reload();await page.locator('[data-written]').waitFor();
 await page.locator('[data-written]').fill('我们先看看菜单。');await page.locator('[data-next]').click();await page.locator('[data-previous]').click();
 assert.equal(await page.locator('[data-written]').inputValue(),'我们先看看菜单。');assert.deepEqual(errors,[]);
 await abandonOfficial(app.service,u,h.id);
 const simulation=await app.service.startExam(u,{mode:'hsk_simulation',paper_id:'H11112'});
 await page.goto(base+'/#exam/'+simulation.id);
 await page.locator('.structured-question').waitFor();
 assert.equal(await page.locator('#official-timer').count(),1);
 assert.equal(await page.locator('[data-feedback]').count(),0);
 await assert.rejects(()=>studyFeedback(app.service,u,simulation.id,1),/setelah/);
 await shot('structured-hsk1-simulation-desktop');

 await abandonOfficial(app.service,u,simulation.id);
 for(const [code,number] of [['H20901',56],['H41001',80],['H51001',46],['H61001',76]]){
  const v=await app.service.startExam(u,{mode:'hsk_learning',paper_id:code});
  await changeStudySection(app.service,u,v.id,'reading');await page.goto(base+'/#exam/'+v.id);await page.locator('.structured-question').waitFor();
  const first=Number((await page.locator('.structured-meta strong').innerText()).replace(/\D/g,''));
  for(let n=first;n<number;n++)await page.locator('[data-next]').click();
  assert.equal(await page.locator('.structured-meta strong').innerText(),'Soal '+number);
  if(number===76)assert((await page.locator('.structured-context').innerText()).includes('76'));
  await page.locator('[data-choice]').first().click();
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('structured-'+code+'-hp');
  await page.setViewportSize({width:1440,height:1000});await shot('structured-'+code+'-desktop');
  await abandonOfficial(app.service,u,v.id);
 }
 const timedWriting=await app.service.startExam(u,{mode:'hsk_simulation',paper_id:'H61001'});
 let state=timedWriting;
 for(let k=0;k<8&&state.phase?.id!=='writing_read';k++){now=state.phase.end+1;state=await app.service.getExam(u,state.id);}
 assert.equal(state.phase.id,'writing_read');assert(state.reading_context?.length>500);assert.equal(state.items.length,0);
 now=state.phase.end+1;state=await app.service.getExam(u,state.id);
 assert.equal(state.phase.id,'writing');assert.equal(state.reading_context,null);assert.equal(state.items[0].content.reading_context,undefined);
 assert.deepEqual(errors,[]);
 console.log('PASS HSK1–6 browser flows: pictures, shared passages, writing, save/reload, no early answers, writing phase privacy, desktop and HP');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
