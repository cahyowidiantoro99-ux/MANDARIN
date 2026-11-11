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
 for(const [code,section,numbers] of [['H61009','reading',[51,62,69]],['H31002','listening',[1,35]],['H31002','reading',[51]],['H31001','writing',[76]]]){
  const q=await app.service.startExam(u,{mode:'hsk_learning',paper_id:code});await changeStudySection(app.service,u,q.id,section);
  for(const number of numbers){
   await page.goto(base+'/#exam/'+q.id);await page.locator('.structured-question').waitFor();
   const first=Number((await page.locator('.structured-meta strong').innerText()).replace(/\D/g,''));
   for(let n=first;n<number;n++)await page.locator('[data-next]').click();
   assert(!/^[A-F\s.．、]+$/.test(await page.locator('.structured-prompt').innerText()));
   if(number===62)assert.equal((await page.locator('.structured-prompt').innerText()).match(/____/g).length,3);
   if(number===69)assert.equal((await page.locator('.structured-prompt').innerText()).match(/____/g).length,4);
   await shot('repair-'+code+'-'+number+'-desktop');
   await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('repair-'+code+'-'+number+'-hp');await page.setViewportSize({width:1440,height:1000});
  }
  await abandonOfficial(app.service,u,q.id);
 }
 const {archivePapers}=await import('../app/hsk-bank.mjs');const {structuredItems}=await import('../app/official-content.mjs');
 const fixtures=archivePapers.map(p=>({id:p.id,items:structuredItems(p,p.items)}));
 const checked=await page.evaluate(async fixtures=>{
  const {mountStructuredQuestions}=await import('/structured-exam.js');let count=0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  for(const paper of fixtures){
   const host=document.createElement('div');mountStructuredQuestions(host,{items:paper.items,answers:{},sessionId:'audit',esc,onAnswer:()=>{}});
   for(let i=0;i<paper.items.length;i++){
    const item=paper.items[i],stem=host.querySelector('.structured-prompt');
    if(!stem?.textContent.trim()||/^[A-F\s.．、]+$/.test(stem.textContent))throw Error(paper.id+' '+item.number+' bad stem');
    if(item.kind!=='writing'&&host.querySelectorAll('[data-choice]').length!==(item.content.options.length||item.choices.length))throw Error(paper.id+' '+item.number+' missing choice');
    if(item.kind==='writing'&&!host.querySelector('[data-written]'))throw Error(paper.id+' missing writing input');
    if(item.content.context&&!host.querySelector('.structured-context'))throw Error(paper.id+' missing passage');
    count++;if(i<paper.items.length-1)host.querySelector('[data-next]').click();
   }
  }return count;
 },fixtures);
 assert.equal(checked,10281);assert.deepEqual(errors,[]);console.log('PASS rendered all '+checked+' items / 129 banks; reported defects desktop+HP screenshots; no account mutation');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
