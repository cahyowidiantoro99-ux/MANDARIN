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
const app=await createApp({db,demo:true,migrate:false,auth:{supabase:false,clock:()=>now},service:{clock:()=>now}});
await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+app.server.address().port;
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1672,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const shot=async(name)=>{await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode().catch(()=>{});})));await page.screenshot({path:'artifacts/refresh-'+name+'.png',fullPage:true});};
try{
 assert.equal((await page.request.get(base+'/api/material-pdf/hanzi/1')).status(),401);
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.locator('.dash-vocabulary').waitFor();
 assert.match(await page.locator('.dash-vocabulary').innerText(),/HSK 1/);await shot('dashboard');
 console.log('CENTER PREF', (await (await page.request.get(base+'/api/learn/summary?view=center')).json()).preferences);await page.goto(base+'/#learning');await page.locator('.learning-game-card').first().waitFor();
 assert.equal(await page.locator('.learning-tool-links a').count(),3);assert.equal(await page.locator('a[href="#library"]').count(),0);
 await shot('learning-desktop');
 for(const width of [360,390,768]){await page.setViewportSize({width,height:850});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);if(width===390)await shot('learning-hp');}
 await page.setViewportSize({width:1672,height:1000});
 const pkg=await db.get("SELECT id FROM learning_packages WHERE track='hsk' AND level=1 LIMIT 1");
 await db.run('UPDATE learning_packages SET demo=1 WHERE id=?',[pkg.id]);await page.goto(base+'/#study/package-'+pkg.id);await page.locator('#lc-reveal').waitFor();assert(await page.locator('[data-rating=known]').isEnabled());await shot('flashcard-optional');
 let n=0;
 while(await page.locator('[data-rating=known]').count()){
  now+=12;await page.locator('[data-rating=known]').click();await page.locator('#lc-next').waitFor();assert.equal(await page.locator('.lc-recall').count(),0);await page.locator('#lc-next').click();
  await page.waitForFunction(()=>document.querySelector('[data-rating=known]:not(:disabled)')||document.querySelector('.lc-finish'));if(++n>200)throw Error('deck loop');
 }
 await shot('flashcard-finish');await page.locator('.lc-finish a[href^="#recall/"]').click();await page.locator('[data-recall]').first().waitFor();
 const challenge=await db.get("SELECT answers FROM lc_challenges WHERE user_id=? AND kind='recall' ORDER BY created_at DESC LIMIT 1",[u.id]);
 const answer=JSON.parse(challenge.answers).choice;await page.locator('[data-recall="'+answer+'"]').click();await page.locator('.recall-correct').waitFor();await shot('recall-correct');
 now+=1;await page.locator('#recall-next').click();await page.locator('[data-recall]').first().waitFor();if(await page.locator('[data-recall]').count()){const q=await db.get("SELECT answers FROM lc_challenges WHERE user_id=? AND kind='recall' ORDER BY created_at DESC LIMIT 1",[u.id]);const a=JSON.parse(q.answers).choice;await page.locator('[data-recall]:not([data-recall="'+a+'"])').first().click();await page.locator('.recall-wrong').waitFor();assert.equal(await page.locator('.recall-correct').count(),1);await shot('recall-wrong');}
 await page.goto(base+'/#vocab-atlas');await page.locator('.material-download').waitFor();await page.locator('.material-download summary').click();await page.locator('[data-pdf-level]').selectOption('2');assert.equal(await page.locator('[data-pdf-kind]').getAttribute('href'),'/api/material-pdf/kosakata/2');
 const pdf=await page.request.get(base+'/api/material-pdf/kosakata/2');assert(pdf.ok());assert.equal((await pdf.body()).subarray(0,4).toString(),'%PDF');await shot('vocab-pdf-desktop');
 await page.goto(base+'/#hanzi');await page.locator('.material-download summary').click();await page.locator('[data-pdf-level]').selectOption('7-9');const hp=await page.request.get(base+'/api/material-pdf/hanzi/7-9');assert(hp.ok());assert.equal((await hp.body()).subarray(0,4).toString(),'%PDF');await shot('hanzi-pdf-desktop');
 await page.setViewportSize({width:390,height:850});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('hanzi-pdf-hp');
 await page.goto(base+'/#examination');await page.getByRole('heading',{name:'Pusat Ujian ECB',exact:true}).waitFor();await shot('exam-header');
 await page.goto(base+'/#practice');await page.locator('.learning-game-card').first().waitFor();assert.equal(new URL(page.url()).hash,'#learning');
 await page.locator('[data-language-switch]').selectOption('zh');await page.getByRole('heading',{name:'互动学习区',exact:true}).waitFor();await shot('learning-zh-hp');await page.locator('[data-language-switch]').selectOption('id');
 const leaderPage=await browser.newPage();await leaderPage.goto(base);await leaderPage.locator('[data-portal=leader]').click();await leaderPage.locator('[name=username]').fill('LEADER');await leaderPage.locator('[name=password]').fill('DemoMandarin!2026');await leaderPage.locator('#login-form [type=submit]').click();await leaderPage.locator('.sidebar').waitFor();assert.equal((await leaderPage.request.get(base+'/api/material-pdf/hanzi/1')).status(),403);await leaderPage.close();
 assert.deepEqual(errors,[]);console.log('PASS optional flashcard '+n+' cards, end recall correct/wrong, level dashboard, desktop/360/390/768 navigation, authenticated PDF, generic exam header, removed hub redirect.');
}catch(error){console.error(errors,await page.locator('body').innerText());throw error;}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
