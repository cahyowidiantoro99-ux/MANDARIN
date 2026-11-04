import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {createApp} from '../app/server.mjs';
const db=await openDatabase({file:':memory:',url:null});await db.migrate();await seed(db,{demo:true});
const app=await createApp({db,demo:true,migrate:false,auth:{supabase:false}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${app.server.address().port}`,browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),page=await browser.newPage({viewport:{width:360,height:800}}),errors=[],reads=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>reads.push(new URL(r.url()).pathname));
try{
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.locator('.hero').waitFor();
 assert(!reads.includes('/official-exam.js'),'archive viewer stays lazy until an archive exam opens');
 let attempts=0,release;await page.route('**/api/hsk-mistakes',async route=>{attempts++;if(attempts===1)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Koneksi uji belum tersedia.'})});await new Promise(r=>release=r);await route.continue();});
 await page.evaluate(()=>location.hash='examination');await page.locator('[data-exam-tab=practice]').waitFor();assert.equal(attempts,0,'evaluation must not query the mistake history');
 await page.locator('[data-exam-tab=practice]').click();await page.locator('#exam-retry-mistakes').waitFor();assert(await page.locator('[data-section=reading]').isEnabled(),'history failure must not block section practice');
 await page.locator('#exam-retry-mistakes').click();await page.waitForFunction(()=>document.querySelector('#exam-mistakes-body')?.textContent.includes('Memuat'));await page.locator('#exam-level').selectOption('6');
 const options=await page.locator('#exam-practice-paper option').allTextContents();if(options.length>1)await page.locator('#exam-practice-paper').selectOption(options.at(-1));const selected=await page.locator('#exam-practice-paper').inputValue();release();await page.getByText('Belum ada soal salah untuk diulang.',{exact:false}).waitFor();assert.equal(await page.locator('#exam-practice-paper').inputValue(),selected,'late history must preserve selected paper');assert.equal(attempts,2);
 // A fresh mount receives a delayed history; leaving it must not replace Dashboard.
 await page.evaluate(()=>location.hash='dashboard');await page.locator('.hero').waitFor();await page.evaluate(()=>location.hash='examination');await page.locator('[data-exam-tab=practice]').click();await page.locator('#exam-mistakes-body [role=status]').waitFor();await page.evaluate(()=>location.hash='dashboard');await page.locator('.hero').waitFor();release();await page.waitForTimeout(150);assert.equal(await page.locator('.exam-center').count(),0);
 // Shorten only the configured read deadline in the test; a retry must still work.
 await page.evaluate(()=>{const original=AbortSignal.timeout.bind(AbortSignal);AbortSignal.timeout=ms=>original(ms===15000?100:ms);});
 await page.route('**/api/hsk-center',async route=>{await new Promise(r=>setTimeout(r,300));try{await route.continue();}catch{}});
 await page.evaluate(()=>location.hash='examination');await page.getByText('Koneksi terlalu lambat. Coba muat halaman kembali.',{exact:true}).waitFor();assert(await page.locator('#retry').isVisible());await page.unroute('**/api/hsk-center');await page.locator('#retry').click();await page.locator('[data-exam-tab=simulation]').waitFor();
 // Exercise speech lifecycle with deterministic browser events, not synthetic audibility claims.
 const speech=await page.evaluate(async()=>{
  let cancel=0,calls=0;const synth=new EventTarget();synth.getVoices=()=>[{lang:'zh-CN',name:'Microsoft Kangkang',localService:true}];synth.speak=u=>{calls++;window.auditUtterance=u;};synth.cancel=()=>{cancel++;};Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  const {speakMandarin,stopSpeech,wireSpeech}=await import('/speech.js');let oldEnd=0,newStart=0;speakMandarin('你好',{end:()=>oldEnd++});const old=window.auditUtterance;speakMandarin('谢谢',{start:()=>newStart++});old.onend();window.auditUtterance.onstart();const overlap={cancel,calls,oldEnd,newStart};stopSpeech();
  const box=document.createElement('div');box.innerHTML='<button data-speak="%E4%BD%A0%E5%A5%BD">Audio</button>';document.body.append(box);const clean=wireSpeech(box);box.querySelector('button').click();window.auditUtterance.onstart();const playing=box.querySelector('button').getAttribute('aria-pressed');Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));const stopped=box.querySelector('button').getAttribute('aria-pressed');clean();box.remove();return {overlap,playing,stopped};
 });
 assert.deepEqual(speech,{overlap:{cancel:1,calls:2,oldEnd:0,newStart:1},playing:'true',stopped:'false'});assert.deepEqual(errors,[]);
 console.log('PASS mobile: lazy archive viewer/history, independent failure and retry, preserved selections, stale response isolation; speech overlap cancellation and hidden-tab stop (mock engine).');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
