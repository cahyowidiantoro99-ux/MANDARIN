import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {createApp} from '../app/server.mjs';


const db=await openDatabase({file:':memory:',url:null});
await db.migrate();await seed(db,{demo:true});
const app=await createApp({db,demo:true,migrate:false,auth:{supabase:false}});
await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+app.server.address().port;
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1365,height:900}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const heading=name=>page.getByRole('heading',{name,exact:true});

try{
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.waitForURL('**/#dashboard');
 await page.goto(base+'/#learning');await page.locator('a[href="#chengyu"]').waitFor();
 assert(await page.locator('details').filter({has:page.locator('summary', {hasText:'Alur belajar Anda'})}).count());
 await page.locator('a[href="#chengyu"]').click();await page.locator('.chengyu-card').first().waitFor();assert.equal(await page.locator('.chengyu-card').count(),12);
 await page.locator('#chengyu-search').fill('春暖花开');await page.waitForTimeout(400);await page.locator('.chengyu-card').first().click();await page.locator('[data-chengyu-status=known]').waitFor();await page.locator('[data-chengyu-status=known]').click();await page.getByText('✓ Status tersimpan.',{exact:true}).waitFor();await page.reload();await page.locator('[data-chengyu-status=known][aria-pressed=true]').waitFor();
 for(const [name,hash,ready] of [['chengyu','#chengyu','.chengyu-card'],['kosakata','#vocab-atlas','.material-download'],['hanzi','#hanzi','.material-download'],['prestasi','#ranking','.ach-category']]){
 await page.goto(base+'/'+hash);await page.locator(ready).first().waitFor();
 for(const [tag,width,height] of [['desktop',1440,1000],['hp',390,850]]){await page.setViewportSize({width,height});await page.waitForTimeout(150);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' overflow '+tag);await page.screenshot({path:'artifacts/refresh-'+name+'-'+tag+'.png',fullPage:name==='prestasi'&&tag==='desktop'});}
 }
 await page.goto(base+'/#examination');await page.locator('[data-exam-tab=grammar]').click();await page.locator('[data-exam-start=grammar]').first().click();await page.locator('#submit-exam').waitFor();assert.equal(await page.locator('#submit-exam').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(201, 37, 60)');
 assert.equal(await page.locator('#next').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(17, 124, 120)');await page.locator('#submit-exam').click();await page.locator('dialog[open]').waitFor();await page.screenshot({path:'artifacts/refresh-konfirmasi-hp.png'});await page.getByRole('button',{name:'Tidak, periksa lagi'}).click();assert.equal(await page.locator('dialog[open]').count(),0);await page.locator('#submit-exam').click();await page.getByRole('button',{name:'Ya, kirim jawaban'}).click();await page.locator('.result-score').waitFor();
 assert.deepEqual(errors,[]);console.log('PASS Chengyu search/detail/persistence, 4 desktop/mobile screens, exam confirmation cancel/submit, no JS errors');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
