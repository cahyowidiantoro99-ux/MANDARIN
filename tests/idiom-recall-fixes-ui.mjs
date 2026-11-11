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
 const ws=await db.all("SELECT v.id,v.pinyin FROM vocabulary v JOIN content_versions cv ON cv.id=v.version_id WHERE cv.demo=1 AND v.track='hsk' AND v.level=1 ORDER BY v.hanzi LIMIT 2");for(const w of ws){await db.run('INSERT INTO vocabulary_progress(user_id,vocabulary_id,status,updated_at) VALUES(?,?,?,?)',[u.id,w.id,'known',now]);await db.run('INSERT INTO lc_review_state(user_id,vocabulary_id,due_at,interval_seconds,repetitions,recall_successes,last_correct,reviewed_at) VALUES(?,?,0,600,1,0,0,?)',[u.id,w.id,now]);}
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.locator('.dash-vocabulary').waitFor();
 await page.goto(base+'/#chengyu');await page.locator('.chengyu-card').first().waitFor();await page.locator('.chengyu-card').first().click();await page.locator('#chengyu-detail-next').waitFor();await page.locator('[data-chengyu-status=known]').click();await page.getByText('✓ Status tersimpan.',{exact:true}).waitFor();assert.equal(await page.locator('[data-chengyu-status=known]').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(24, 117, 62)');
 const first=page.url();await page.locator('#chengyu-detail-next').click();await page.waitForURL(url=>url.toString()!==first);await page.locator('.chengyu-position').filter({hasText:'2 / 2.144'}).waitFor();await page.locator('[data-chengyu-status=review]').click();await page.getByText('✓ Status tersimpan.',{exact:true}).waitFor();assert.equal(await page.locator('[data-chengyu-status=review]').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(229, 180, 48)');
 for(const [tag,width]of [['desktop',1440],['hp',390]]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.chengyu-detail').screenshot({path:'artifacts/idiom-next-'+tag+'.png'});}
 await page.goto(base+'/#chengyu');await page.locator('.chengyu-card').first().waitFor();assert.equal(await page.locator('.chengyu-state-known').count(),1);assert.equal(await page.locator('.chengyu-state-review').count(),1);assert(await page.locator('.chengyu-state-new').count());await page.setViewportSize({width:1440,height:900});await page.locator('#chengyu-results').screenshot({path:'artifacts/idiom-status-desktop.png'});
 await page.goto(base+'/#recall');await page.locator('[data-recall]').first().waitFor();assert(await page.locator('#recall-answer-pinyin').isHidden());const q=await db.get("SELECT answers FROM lc_challenges WHERE user_id=? AND kind='recall' ORDER BY created_at DESC LIMIT 1",[u.id]),answer=JSON.parse(q.answers).choice;await page.locator('[data-recall]:not([data-recall="'+answer+'"])').first().click();await page.locator('.recall-wrong').waitFor();assert(await page.locator('#recall-answer-pinyin').isVisible());assert((await page.locator('#recall-answer-pinyin').innerText()).trim());
 for(const[tag,width]of [['desktop',1440],['hp',390]]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.lc-recall').screenshot({path:'artifacts/recall-pinyin-'+tag+'.png'});}
 now+=1;await page.locator('#recall-next').click();await page.locator('[data-recall]').first().waitFor();assert(await page.locator('#recall-answer-pinyin').isHidden());const q2=await db.get("SELECT answers FROM lc_challenges WHERE user_id=? AND kind='recall' ORDER BY created_at DESC LIMIT 1",[u.id]),a2=JSON.parse(q2.answers).choice;await page.locator('[data-recall="'+a2+'"]').click();await page.locator('.recall-correct').waitFor();assert(await page.locator('#recall-answer-pinyin').isVisible());assert.deepEqual(errors,[]);console.log('PASS idiom next navigation, three status colors, responsive detail and recall pinyin hidden before / visible after correct and wrong answers');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
