import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {openDatabase} from '../app/db.mjs';import {seed} from '../scripts/seed.mjs';import {createApp} from '../app/server.mjs';import {id,periodBounds} from '../app/domain.mjs';import {learningDay} from '../app/learning-motivation.mjs';
const db=await openDatabase({file:':memory:',url:null});await db.migrate();await seed(db,{demo:true});let now=Date.parse('2026-11-05T12:00:00+08:00')/1000,u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'"),other=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO003'");await db.run('UPDATE profiles SET placement_level=6 WHERE id IN (?,?)',[u.id,other.id]);await db.run('INSERT INTO lc_xp(user_id,day,activity,target_id,amount,created_at) VALUES(?,?,?,?,?,?)',[u.id,learningDay(now),'review',id(),2,now-30]);
for(const track of ['hsk','work']){const sid=id(),score=track==='hsk'?80:100;await db.run('INSERT INTO exam_sessions(id,user_id,track,mode,level,week,status,started_at,deadline,submitted_at,official,demo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[sid,u.id,track,'weekly',6,periodBounds('weekly',now).key,'submitted',now-900,now+900,now-60,1,1]);await db.run('INSERT INTO exam_results(id,session_id,user_id,score,passed,official_key,created_at) VALUES(?,?,?,?,?,?,?)',[id(),sid,u.id,score,1,id(),now-60]);}
const before=(await db.get('SELECT COUNT(*) AS n FROM lc_xp')).n,app=await createApp({db,demo:true,migrate:false,auth:{supabase:false,clock:()=>now},service:{clock:()=>now}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.server.address().port}`,browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];let loads=0;page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/achievements'))loads++;});

try{
 await page.goto(base);
 await page.locator('[name=username]').fill('DEMO002');
 await page.locator('[name=password]').fill('DemoMandarin!2026');
 await page.locator('#login-form [type=submit]').click();
 const form=page.locator('#dashboard-target-form');
 await form.locator('[name=level]').selectOption('8');
 await form.locator('[name=date]').fill('2027-12-01');
 assert.equal(await form.locator('#dashboard-target-tasks li').count(),5);
 assert.equal(await form.locator('input[type=checkbox]').count(),0);
 await form.locator('button[type=submit]').click();
 await page.locator('#dashboard-countdown').filter({hasText:'Target Level 8'}).waitFor();
 assert.match(await page.locator('#dashboard-countdown').innerText(),/hari.*jam.*menit.*detik/);
 const panel=page.locator('.panel').filter({has:page.locator('#dashboard-plan')});
 const edit=page.locator('#dashboard-target-edit');
 await edit.waitFor();
 assert.equal(await form.count(),0);
 assert(await panel.locator('#dashboard-countdown + h2').isVisible());
 await panel.screenshot({path:'artifacts/target-tersimpan-desktop.png'});
 await page.reload();
 await edit.click();
 assert.equal(await form.locator('[name=level]').inputValue(),'8');
 await form.locator('[name=level]').selectOption('4');
 await page.locator('#dashboard-target-cancel').click();
 assert.match(await panel.innerText(),/Level Perusahaan 8/);
 await edit.click();
 await form.locator('[name=level]').selectOption('4');
 await form.locator('[name=date]').fill('2027-12-02');
 await page.setViewportSize({width:390,height:900});
 await panel.screenshot({path:'artifacts/target-edit-hp.png'});
 await form.locator('button[type=submit]').click();
 await page.locator('#dashboard-countdown').filter({hasText:'Target Level 4'}).waitFor();
 assert.match(await panel.innerText(),/2 Desember 2027/);
 for(const type of ['exams','xp','learning','activities']){
   const region=page.locator('[data-dashboard-history="'+type+'"]');
   assert.equal(await region.getAttribute('open'),null);
   const response=page.waitForResponse(r=>r.url().includes('/dashboard/history/'+type));
   await region.locator('summary').click();
   assert((await response).ok());
 }
 await page.setViewportSize({width:360,height:800});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto(base+'/#profile');
 await page.locator('#edit-profile').waitFor();
 assert.equal(await page.getByText('Riwayat belajar aktif',{exact:true}).count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS target persistence, level-specific guidance, countdown, lazy histories, profile, mobile');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
