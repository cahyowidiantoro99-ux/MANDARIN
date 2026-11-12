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

 for(const code of ['H21005','H21112']){
  const q=await app.service.startExam(u,{mode:'hsk_learning',paper_id:code});await changeStudySection(app.service,u,q.id,'reading');
  await page.goto(base+'/#exam/'+q.id);await page.locator('.structured-question').waitFor();await page.locator('.structured-source-example').waitFor();assert(await page.locator('.structured-source-example').innerText());await shot('source-example-'+code+'-desktop');
  await page.setViewportSize({width:390,height:844});await shot('source-example-'+code+'-hp');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(let i=0;i<8;i++)await page.locator('[data-next]').click();await shot('source-cloze-'+code+'-hp');assert(!/Pilih kata|Dengarkan audio|？？/.test(await page.locator('.structured-question').innerText()));
  await abandonOfficial(app.service,u,q.id);await page.setViewportSize({width:1440,height:1000});
 }
 assert.deepEqual(errors,[]);console.log('PASS original examples, HSK2 cloze, private images, desktop and HP');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
