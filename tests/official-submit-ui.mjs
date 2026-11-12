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
 for(const [code,width] of [['H61009',1440],['H11112',390]]){
  await page.setViewportSize({width,height:900});
  const q=await app.service.startExam(u,{mode:'hsk_learning',paper_id:code});await changeStudySection(app.service,u,q.id,'reading');
  await page.goto(base+'/#exam/'+q.id);await page.locator('.structured-question').waitFor();await page.locator('[data-choice]').first().click();
  const number=Number((await page.locator('.structured-meta strong').innerText()).replace(/\D/g,''));
  await page.locator('#official-submit').click();await page.locator('dialog[open]').waitFor();await shot('submit-confirm-'+width);
  await page.locator('[data-cancel]').click();assert.equal((await app.service.getExam(u,q.id)).status,'active');assert(await page.locator('#official-submit').isEnabled());
  if(width===1440){
   await page.route('**/official-exams/'+q.id+'/submit',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Uji koneksi gagal'})}),{times:1});
   await page.locator('#official-submit').click();await page.locator('[data-confirm]').click();await page.waitForFunction(()=>!document.querySelector('#official-submit')?.disabled);assert.equal((await app.service.getExam(u,q.id)).status,'active');
  }
  await page.locator('#official-submit').click();await page.locator('[data-confirm]').click();await page.waitForFunction(()=>!document.querySelector('#official-submit'));
  const result=await app.service.getExam(u,q.id);assert.equal(result.status,'submitted');assert(result.answers[number]);await shot('submit-result-'+width);await page.waitForFunction(()=>!document.querySelector('#toast')?.classList.contains('show'));
 }
 assert.deepEqual(errors,[]);console.log('PASS official submit: desktop/HP, cancel retains active, failed request retry, saved answer, submitted result and no JS errors');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
