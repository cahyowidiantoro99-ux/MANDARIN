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
const grammar=JSON.parse(readFileSync('data/source-release.json')).lessons.find(g=>g.kind==='grammar'),gid=id(),cv=(await db.get('SELECT id FROM content_versions WHERE demo=1 LIMIT 1')).id;await db.run('INSERT INTO learning_lessons(id,title,track,level,kind,body,source_ref,version_id) VALUES(?,?,?,?,?,?,?,?)',[gid,grammar.title,'hsk',1,'grammar',JSON.stringify(grammar.body),JSON.stringify(grammar.source_ref),cv]);const legacy=(await db.get('SELECT id FROM vocabulary LIMIT 1')).id;await db.run('INSERT INTO lc_saved_words(user_id,vocabulary_id,created_at) VALUES(?,?,?)',[u.id,legacy,now]);
const app=await createApp({db,demo:true,migrate:false,auth:{supabase:false,clock:()=>now},service:{clock:()=>now}});
await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+app.server.address().port;
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1672,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const shot=async(name)=>{await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode().catch(()=>{});})));await page.screenshot({path:'artifacts/refresh-'+name+'.png',fullPage:true});};
try{
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.locator('.dash-vocabulary').waitFor();
 await page.goto(base+'/#learning');await page.locator('.recall-launch').waitFor();assert.equal(await page.locator('.learning-launchers a[href="#recall"]').count(),0);assert.equal(await page.locator('.recall-launch a[href="#recall"]').count(),1);assert.equal(await page.getByRole('link',{name:'Kata Perlu Diulang',exact:true}).count(),1);await shot('bookmarks-learning-desktop');
 await page.goto(base+'/#vocab-atlas');const vocab=page.locator('[data-bookmark-kind="atlas-vocab"]').first();await vocab.waitFor();await page.waitForFunction(()=>document.querySelector('[data-bookmark-kind="atlas-vocab"]:not(:disabled)'));await vocab.click();await page.locator('[data-bookmark-kind="atlas-vocab"][aria-pressed="true"]').first().waitFor();await page.reload();await page.locator('[data-bookmark-kind="atlas-vocab"][aria-pressed="true"]').first().waitFor();await shot('bookmarks-vocab');
 await page.goto(base+'/#hanzi/爱');const hanzi=page.locator('[data-bookmark-kind="hanzi"]');await hanzi.waitFor();await page.waitForFunction(()=>document.querySelector('[data-bookmark-kind="hanzi"]:not(:disabled)'));await hanzi.click();await page.locator('[data-bookmark-kind="hanzi"][aria-pressed="true"]').waitFor();
 await page.goto(base+'/#grammar/'+gid);const gb=page.locator('[data-bookmark-kind="grammar"]');await gb.waitFor();await page.waitForFunction(()=>document.querySelector('[data-bookmark-kind="grammar"]:not(:disabled)'));await gb.click();await page.locator('[data-bookmark-kind="grammar"][aria-pressed="true"]').waitFor();await shot('bookmarks-grammar');
 await page.goto(base+'/#study/hsk-1');await page.locator('#lc-reveal').waitFor();await page.waitForFunction(()=>document.querySelector('[data-bookmark-kind="vocabulary"]:not(:disabled)'));const fb=page.locator('[data-bookmark-kind="vocabulary"]');const prior=await fb.getAttribute('aria-pressed');await fb.click();await page.waitForFunction(prior=>document.querySelector('[data-bookmark-kind="vocabulary"]').getAttribute('aria-pressed')!==prior,prior);await shot('bookmarks-flashcard');
 await page.goto(base+'/#saved');await page.locator('.saved-card').first().waitFor();assert(await page.locator('.saved-card').count()>=4);await shot('bookmarks-saved-desktop');await page.locator('#saved-kind').selectOption('grammar');await page.waitForFunction(()=>document.querySelectorAll('.saved-card').length===1);await page.locator('.saved-card .bookmark-button').click();await page.getByRole('heading',{name:'Belum ada materi tersimpan',exact:true}).waitFor();await page.locator('#saved-kind').selectOption('');await page.locator('.saved-card').first().waitFor();
 for(const width of [360,390,768]){await page.setViewportSize({width,height:850});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);if(width===390)await shot('bookmarks-saved-hp');}
 await page.setViewportSize({width:390,height:850});await page.goto(base+'/#learning');await page.locator('.recall-launch').waitFor();await shot('bookmarks-learning-hp');await page.locator('[data-language-switch]').selectOption('zh');await page.getByRole('heading',{name:'记忆挑战',exact:true}).waitFor();await shot('bookmarks-learning-zh');
 const other=await browser.newPage();await other.goto(base);await other.locator('[name=username]').fill('DEMO003');await other.locator('[name=password]').fill('DemoMandarin!2026');await other.locator('#login-form [type=submit]').click();await other.locator('.dash-vocabulary').waitFor();await other.goto(base+'/#saved');await other.getByRole('heading',{name:'Belum ada materi tersimpan',exact:true}).waitFor();await other.close();assert.equal((await db.get('SELECT COUNT(*) AS n FROM lc_xp')).n,0);assert.deepEqual(errors,[]);console.log('PASS catalog/hanzi/grammar/bookmark refresh, legacy saves, independent accounts, delete/filter, desktop/360/390/768, Chinese labels, no XP');
}catch(error){console.error(errors,await page.locator('body').innerText());throw error;}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
