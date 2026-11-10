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
 await db.run("UPDATE exam_results SET official_key=NULL WHERE user_id=(SELECT id FROM profiles WHERE employee_id='DEMO002')");
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.waitForURL('**/#dashboard');
 await page.goto(base+'/#examination');await page.locator('.exam-menu-grid').waitFor();
 assert.equal(await page.locator('[data-exam-tab]').count(),5);
 for(const tab of ['evaluation','simulation','vocabulary','grammar','translation']){
  await page.locator('[data-exam-tab='+tab+']').click();
  await page.locator('.exam-mascot').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  for(const [tag,width,height] of [['desktop',1672,1000],['hp',390,850]]){
   await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:'artifacts/ujian-baru-'+tab+'-'+tag+'.png',fullPage:true});
  }
 }
 await page.locator('[data-exam-tab=simulation]').click();
 assert.equal(await page.locator('[data-select-skill=writing]').count(),0);
 await page.locator('[data-exam-level="3"]').click();await page.locator('[data-select-skill=writing]').click();
 assert.equal(await page.locator('[data-select-skill=writing]').getAttribute('aria-pressed'),'true');
 const code=await page.locator('#exam-practice-paper').inputValue();
 await page.getByRole('button',{name:'Mulai per keterampilan →',exact:true}).click();
 await page.waitForURL(url=>url.hash.startsWith('#exam/'));
 let sid=page.url().split('/').at(-1);
 assert.equal((await db.get('SELECT paper_id FROM official_exam_state WHERE session_id=?',[sid])).paper_id,code);
 assert.equal((await db.get('SELECT section FROM hsk_attempt_options WHERE session_id=?',[sid])).section,'writing');
 await db.run("UPDATE exam_sessions SET status='void' WHERE id=?",[sid]);
 for(const [tab,mode,track] of [['evaluation','weekly','hsk'],['vocabulary','random100','work'],['grammar','grammar','hsk'],['translation','translation','work']]){
  await page.goto(base+'/#examination');await page.locator('[data-exam-tab='+tab+']').click();
  if(track==='work')await page.locator('#exam-track').selectOption('work');
  if(mode==='random100')await page.locator('#exam-practice-mode').selectOption('random100');
  await page.locator('[data-exam-start='+mode+'][data-track='+track+']').click();await page.waitForURL(url=>url.hash.startsWith('#exam/'));
  sid=page.url().split('/').at(-1);const session=await db.get('SELECT mode,track FROM exam_sessions WHERE id=?',[sid]);assert.equal(session.mode,mode);assert.equal(session.track,track);
  await db.run("UPDATE exam_sessions SET status='void' WHERE id=?",[sid]);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS 5 menus at desktop/mobile, source-code selection, skills by level, real weekly/vocabulary/grammar/translation launches');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
