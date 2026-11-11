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
const grammar=JSON.parse(readFileSync('data/source-release.json')).lessons.find(g=>g.kind==='grammar'),gid=id(),cv=(await db.get('SELECT id FROM content_versions WHERE demo=1 LIMIT 1')).id;await db.run('INSERT INTO learning_lessons(id,title,track,level,kind,body,source_ref,version_id) VALUES(?,?,?,?,?,?,?,?)',[gid,grammar.title,'hsk',1,'grammar',JSON.stringify(grammar.body),JSON.stringify(grammar.source_ref),cv]);for(const lesson of JSON.parse(readFileSync('data/source-release.json')).lessons.filter(g=>g.kind==='grammar').slice(1,9)){await db.run('INSERT INTO learning_lessons(id,title,track,level,kind,body,source_ref,version_id) VALUES(?,?,?,?,?,?,?,?)',[id(),lesson.title,'hsk',1,'grammar',JSON.stringify(lesson.body),JSON.stringify(lesson.source_ref),cv]);}
const legacy=(await db.get('SELECT id FROM vocabulary LIMIT 1')).id;await db.run('INSERT INTO lc_saved_words(user_id,vocabulary_id,created_at) VALUES(?,?,?)',[u.id,legacy,now]);
const app=await createApp({db,demo:true,migrate:false,auth:{supabase:false,clock:()=>now},service:{clock:()=>now}});
await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+app.server.address().port;
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1672,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const shot=async(name)=>{await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode().catch(()=>{});})));await page.screenshot({path:'artifacts/refresh-'+name+'.png',fullPage:true});};
try{
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.locator('.dash-vocabulary').waitFor();

 await page.goto(base+'/#profile');
 await page.locator('.profile-summary').waitFor();
 assert.equal(await page.locator('.profile-summary-item').count(),3);
 assert(await page.locator('[name=division]').isDisabled());
 await shot('profile-desktop');
 await page.locator('#edit-profile').click();
 await page.locator('[name=division]').fill('QA Demo');
 await page.getByRole('button',{name:'Simpan profil'}).click();
 await page.locator('#edit-profile').waitFor();
 assert.equal(await page.locator('[name=division]').inputValue(),'QA Demo');
 await page.setViewportSize({width:390,height:844});
 await shot('profile-hp');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.addInitScript(()=>{
  window.spoken=[];
  window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
  Object.defineProperty(window,'speechSynthesis',{value:{
   getVoices:()=>[{name:'Mandarin QA',lang:'zh-CN',localService:true}],
   speak:u=>{window.spoken.push(u.text);u.onstart?.();u.onend?.();},
   cancel:()=>{}
  }});
 });
 await page.goto(base+'/#chengyu');
 await page.reload();
 const first=page.locator('.chengyu-card').first();
 await first.locator('button[data-speak]').waitFor();
 await first.locator('button[data-speak]').click();
 assert(page.url().endsWith('#chengyu'));
 assert.deepEqual(await page.evaluate(()=>window.spoken),[decodeURIComponent(await first.locator('button[data-speak]').getAttribute('data-speak'))]);
 await shot('idiom-audio-hp');
 await page.setViewportSize({width:1440,height:900});
 await page.goto(base+'/#learning');
 await page.locator('[data-learning-menu="grammar"]').click();
 const filter=page.locator('#lc-grammar-search');
 await filter.waitFor();
 const cards=page.locator('.lc-grammar-item');
 await cards.first().locator('button:enabled').waitFor();
 const count=await cards.count();
 assert(count>6);
 assert.equal(await page.locator('#lc-grammar-more').count(),0);
 const word=await cards.first().locator('strong').innerText();
 await filter.fill(word);
 await cards.first().locator('button:enabled').waitFor();
 await filter.fill('');
 assert.equal(await cards.count(),count);
 const bookmark=cards.first().locator('button[data-bookmark-kind]');
 await bookmark.click();
 await page.locator('.lc-grammar-item button[aria-pressed=true]').first().waitFor();
 await shot('grammar-list');
 await page.locator('[data-learning-menu="stories"]').click();
 await page.locator('.work-story-level').last().waitFor();
 assert.deepEqual(await page.locator('.work-story-level').evaluateAll(levels=>levels.map(l=>l.querySelectorAll('article').length)),[3,3,3,3,3,3]);
 await shot('work-stories');
 await page.locator('.work-story-level').last().locator('a[href^="#story/"]').first().click();
 await page.locator('#lp-narrate').waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS profile save and responsive layout, idiom audio control, grammar search/bookmarks, 18 stories and story detail');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
