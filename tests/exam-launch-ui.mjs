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
let now=Date.now()/1000;
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
 const {archivePapers}=await import('../app/hsk-bank.mjs');
 const select=async code=>{const p=archivePapers.find(p=>p.id===code);await page.goto(base+'/#examination');await page.locator('[data-exam-tab=simulation]').click();await page.locator('#exam-list-level').selectOption(String(p.level));await page.locator('#exam-difficulty').selectOption(p.difficulty);await page.locator('[data-select-paper='+code+']').click();};
 const starts=[['H11112','hsk_learning'],['H11112','hsk_simulation'],['H11112','listening'],['H11112','reading'],...['H61008','H61009','H61110','H61111','H61218','H61219','H61220','H61221'].map(code=>[code,'writing'])];
 for(const [code,mode] of starts){
  await select(code);const locator=mode.startsWith('hsk_')?'[data-direct-mode='+mode+']':'[data-section='+mode+']';
  if(code==='H61008')await shot('hsk6-complete-papers-desktop');
  await page.locator(locator).click();await page.waitForURL(/#exam\//);await page.locator('.structured-question').waitFor();
  const sid=page.url().split('/').at(-1),state=await app.service.getExam(u,sid);assert.equal(state.paper.id,code);assert(state.items.every(i=>i.content));
  if(mode==='writing'){assert.equal(state.items[0].number,101);assert(state.reading_context?.length>500,'writing practice source must be readable');await page.setViewportSize({width:390,height:844});await shot('writing-'+code+'-hp');await page.setViewportSize({width:1440,height:1000});}
  await abandonOfficial(app.service,u,sid);
 }
 await select('H11112');await page.locator('[data-direct-mode=hsk_learning]').click();await page.waitForURL(/#exam\//);await page.locator('.structured-question').waitFor();const activeId=page.url().split('/').at(-1);
 await select('H11222');await page.locator('[data-direct-mode=hsk_simulation]').click();await page.locator('.exam-start-feedback.error').waitFor();assert(await page.locator('.exam-start-feedback.error').isVisible());assert(await page.locator('[data-direct-mode=hsk_simulation]').isEnabled());await shot('exam-start-conflict-desktop');
 await page.locator('.exam-active-session a').click();await page.waitForURL(new RegExp(activeId));await page.locator('.structured-question').waitFor();await abandonOfficial(app.service,u,activeId);
 assert.deepEqual(errors,[]);console.log('PASS actual start buttons, both full modes, all skills, eight HSK6 writing papers, visible conflict and active session resume');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
