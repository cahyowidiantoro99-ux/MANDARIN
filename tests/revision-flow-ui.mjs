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
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.locator('.dash-vocabulary').waitFor();
 assert.equal(await page.locator('.chart-pass-line').count(),1);await page.screenshot({path:'artifacts/revision-chart.png',fullPage:true});
 for(const mode of ['hsk_learning','hsk_simulation','hsk_section']){
 await page.goto(base+'/#examination');await page.locator('[data-exam-tab=simulation]').click();assert.equal(await page.locator('.exam-mode-stage').count(),0);
 await page.locator('#exam-list-level').selectOption('1');await page.locator('#exam-difficulty').selectOption('easy');
 const tile=page.locator('[data-select-paper]:not(:disabled)').first();const code=await tile.getAttribute('data-select-paper');await tile.click();assert.equal(await page.locator('[data-sim-mode]').count(),0);var fonts=await page.locator('.exam-step-title').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n);return [s.fontSize,s.fontWeight,s.fontFamily].join('|')}));assert.equal(new Set(fonts).size,1);
 if(mode==='hsk_learning'){for(const width of [1365,390]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/revision-simulation-'+width+'.png',fullPage:true});}}
 await page.locator(mode==='hsk_section'?'[data-section=listening]':'[data-direct-mode='+mode+']').click();await page.waitForURL(url=>url.hash.startsWith('#exam/'));const sid=page.url().split('/').at(-1);assert.equal((await db.get('SELECT mode FROM exam_sessions WHERE id=?',[sid])).mode,mode);assert.equal((await db.get('SELECT paper_id FROM official_exam_state WHERE session_id=?',[sid])).paper_id,code);await db.run("UPDATE exam_sessions SET status='void' WHERE id=?",[sid]);
 }
 assert.deepEqual(errors,[]);console.log('PASS ordered selection, three real session modes, chart line, desktop/mobile');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
