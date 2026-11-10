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
const now=Date.parse('2026-11-10T12:00:00+08:00')/1000;
const u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'");
await db.run('UPDATE profiles SET placement_level=6 WHERE id=?',[u.id]);
const words=await db.all("SELECT v.id FROM vocabulary v JOIN content_versions cv ON cv.id=v.version_id WHERE cv.demo=1 AND cv.status='published' AND v.track='hsk' LIMIT 10");
for(let i=0;i<words.length;i++){
 const state=i<7?'known':i<9?'review':'unknown';
 await db.run('INSERT INTO vocabulary_progress(user_id,vocabulary_id,status,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,vocabulary_id) DO UPDATE SET status=excluded.status',[u.id,words[i].id,state,now-20]);
 await db.run('INSERT INTO lc_xp(user_id,day,activity,target_id,amount,created_at) VALUES(?,?,?,?,?,?)',[u.id,learningDay(now),'review',words[i].id,2,now-20]);
}
for(let i=0;i<3;i++)await db.run('INSERT INTO lc_xp(user_id,day,activity,target_id,amount,created_at) VALUES(?,?,?,?,?,?)',[u.id,learningDay(now),'recall',words[i].id,3,now-10]);
await db.run('INSERT INTO lc_xp(user_id,day,activity,target_id,amount,created_at) VALUES(?,?,?,?,?,?)',[u.id,learningDay(now),'grammar',id(),15,now-5]);
const pkg=await db.get("SELECT id FROM learning_packages WHERE track='hsk' AND level=6 LIMIT 1");
await db.run('UPDATE learning_packages SET demo=1 WHERE id=?',[pkg.id]);
await db.run('INSERT INTO learning_sessions(id,user_id,package_id,started_at,last_heartbeat,active_seconds,closed) VALUES(?,?,?,?,?,?,1)',[id(),u.id,pkg.id,now-1200,now-5,840]);
for(const track of ['hsk','work']){
 const sid=id();
 await db.run('INSERT INTO exam_sessions(id,user_id,track,mode,level,week,status,started_at,deadline,submitted_at,official,demo) VALUES(?,?,?,?,?,?,?,?,?,?,1,1)',[sid,u.id,track,'weekly',6,periodBounds('weekly',now).key,'submitted',now-1000,now+500,now-60]);
 await db.run('INSERT INTO exam_results(id,session_id,user_id,score,passed,official_key,created_at) VALUES(?,?,?,?,1,?,?)',[id(),sid,u.id,track==='hsk'?90:97,id(),now-60]);
}
const xpBefore=(await db.get('SELECT COUNT(*) AS n FROM lc_xp')).n;
const app=await createApp({db,demo:true,migrate:false,auth:{supabase:false,clock:()=>now},service:{clock:()=>now}});
await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+app.server.address().port;
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1672,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const ready=async()=>{await page.locator('.dash-vocabulary').waitFor();await page.locator('.dashboard-redesign img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode();})));};
try{
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await ready();
 const form=page.locator('#dashboard-target-form');
 await form.locator('[name=level]').selectOption('8');await form.locator('[name=date]').fill('2027-02-01');await form.locator('[type=submit]').click();await page.locator('#dashboard-target-edit').waitFor();
 assert.equal(await page.locator('.dash-mission-grid article.is-complete').count(),3);
 assert.equal(await page.locator('.dash-word-counts>div').count(),4);
 assert.equal(await page.locator('.dashboard-target-guidance').getAttribute('open'),null);
 assert.equal(await page.locator('.route-loading').count(),0);
 assert.match(await page.locator('.dash-stat-xp').innerText(),/\+44/);
 for(const [name,selector] of Object.entries({target:'.dashboard-target-panel',stats:'.dash-learning-stats',missions:'.dash-missions',vocabulary:'.dash-vocabulary',evaluation:'.dashboard-evaluation-row',history:'.dashboard-history-panel',reminders:'.dashboard-bottom-row'})){
  await page.locator(selector).screenshot({path:'artifacts/dasbor-baru-'+name+'-desktop.png'});
 }
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/dasbor-baru-desktop.png'});
 await page.locator('.dashboard-redesign').screenshot({path:'artifacts/dasbor-baru-lengkap.png'});
 for(const width of [360,390,768]){
  await page.setViewportSize({width,height:850});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at '+width);
  if(width===390){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/dasbor-baru-hp.png'});await page.screenshot({path:'artifacts/dasbor-baru-lengkap-hp.png',fullPage:true});await page.locator('.dash-missions').screenshot({path:'artifacts/dasbor-baru-missions-hp.png'});}
 }
 await page.locator('#dashboard-target-edit').click();await form.locator('[name=level]').selectOption('4');await page.locator('#dashboard-target-cancel').click();assert.match(await page.locator('#dashboard-plan').innerText(),/Level Perusahaan 8/);
 await page.locator('.dashboard-target-guidance summary').click();assert(await page.locator('.dashboard-checklist').isVisible());await page.locator('.dashboard-target-guidance summary').click();
 for(const kind of ['exams','xp','learning','activities']){
  const details=page.locator('[data-dashboard-history='+kind+']');assert.equal(await details.getAttribute('open'),null);
  const response=page.waitForResponse(r=>r.url().includes('/dashboard/history/'+kind));await details.locator('summary').click();assert((await response).ok());assert((await details.locator('.dashboard-history-list').innerText()).length>0);await details.locator('summary').click();
 }
 await page.reload();await ready();await page.locator('#dashboard-target-edit').waitFor();assert.match(await page.locator('#dashboard-plan').innerText(),/Level Perusahaan 8/);
 await page.locator('[data-language-switch]').selectOption('zh');await page.getByRole('heading',{name:'今日学习任务',exact:true}).waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/dasbor-baru-zh-hp.png',fullPage:true});await page.locator('[data-language-switch]').selectOption('id');
 await page.locator('.dashboard-actions a').first().click();await page.locator('#lc-reveal').waitFor();
 await page.goto(base+'/#dashboard');await ready();
 await page.locator('.dashboard-actions a[href="#levelup"]').click();await page.locator('.exam-promotion').waitFor();
 assert.equal((await db.get('SELECT COUNT(*) AS n FROM lc_xp')).n,xpBefore);
 assert.deepEqual(errors,[]);
 console.log('PASS dashboard desktop/360/390/768, images, actual demo metrics, completed missions, target edit/cancel/persistence, collapsible guidance, lazy histories, ID/Chinese, learning and promotion routes; no XP for viewing.');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
