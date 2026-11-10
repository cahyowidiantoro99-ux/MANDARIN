import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {createApp} from '../app/server.mjs';
import {atlasCatalog} from '../app/hanzi-atlas.mjs';

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
 let releaseSummary;
 const delayed=new Promise(resolve=>{releaseSummary=resolve;});
 await page.route('**/api/learn/summary',async route=>{await delayed;await route.continue();});
 await page.goto(base);
 await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');
 await page.locator('#login-form [type=submit]').click();
 await page.locator('.hero').waitFor({timeout:10000});
 assert.equal(await page.locator('.route-loading').count(),0);
 assert.equal(await page.locator('.dash-learning-stats').count(),0);
 assert.equal(await page.locator('.dashboard-actions a').first().getAttribute('href'),'#study/hsk-1');
 assert(await page.getByRole('heading',{name:'Evaluasi minggu ini',exact:true}).isVisible());
 await page.screenshot({path:'artifacts/dasbor-utama-tanpa-menunggu-ringkasan.png'});
 releaseSummary();
 await page.locator('.dash-learning-stats').waitFor();
 await page.setViewportSize({width:1365,height:900});
 await page.screenshot({path:'artifacts/dasbor-cepat-desktop.png'});
 await page.setViewportSize({width:390,height:850});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'artifacts/dasbor-cepat-hp.png'});
 await page.locator('a[href="#learning"]').first().evaluate(a=>a.click());
 await page.getByRole('heading',{name:/Pusat Pembelajaran/}).waitFor();
 await page.locator('a[href="#dashboard"]').first().evaluate(a=>a.click());
 await page.locator('.hero').waitFor();
 assert.equal(await page.locator('.route-loading').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS dashboard visible while summary blocked, summary updates, desktop/mobile, navigation without blank loader');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
