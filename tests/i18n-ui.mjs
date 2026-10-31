import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {createApp} from '../app/server.mjs';
const db=await openDatabase({file:':memory:',url:null});await db.migrate();await seed(db,{demo:true});
const app=await createApp({db,demo:true,migrate:false,auth:{supabase:false}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${app.server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);mkdirSync('artifacts',{recursive:true});
const switchLanguage=async value=>{await page.locator('[data-language-switch]').selectOption(value);await page.waitForFunction(value=>document.documentElement.lang===(value==='zh'?'zh-CN':'id'),value);};
const untranslated=new Set();
async function collect(){for(const text of await page.evaluate(()=>{const result=[],w=document.createTreeWalker(document.querySelector('#app'),NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){if(n.parentElement.closest('[data-i18n-skip],.user-copy strong,.avatar,.quiz-question,.option,.review h3,.hanzi,.pinyin,.meaning,.source-ref p,.source-examples p,.scroll-title,.demo,.auth-demo'))continue;const s=n.nodeValue.trim();if(/[A-Za-z]{4}/.test(s)&&!/[\u4e00-\u9fff]/.test(s))result.push(s);}return result;}))untranslated.add(text);}
try{
 await page.goto(origin);await page.locator('#login-form').waitFor();await page.locator('[name=username]').fill('DEMO002');
 await switchLanguage('zh');await page.getByRole('heading',{name:'开启学习之旅',exact:true}).waitFor();assert.equal(await page.locator('[name=username]').inputValue(),'DEMO002');assert.equal(await page.locator('[name=password]').getAttribute('placeholder'),'请输入密码');
 await page.reload();await page.getByRole('heading',{name:'开启学习之旅',exact:true}).waitFor();assert.equal(await page.locator('[data-language-switch]').inputValue(),'zh');
 await page.setViewportSize({width:360,height:800});await page.screenshot({path:'artifacts/i18n-login-zh-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.getByRole('heading',{name:/欢迎您/}).waitFor();
 await page.goto(origin+'/#examination');await page.getByRole('heading',{name:'检验您的学习成果',exact:true}).waitFor();await page.locator('[data-start=weekly][data-track=hsk]').click();await page.locator('.quiz-question').waitFor();
 const question=await page.locator('.quiz-question').textContent(),choice=await page.locator('.option').first().textContent();await page.locator('.option input').first().check();const selected=await page.locator('[name=answer]:checked').inputValue();
 await switchLanguage('id');await page.getByRole('button',{name:'Selesaikan & kirim',exact:false}).waitFor();assert.equal(await page.locator('.quiz-question').textContent(),question);assert.equal(await page.locator('.option').first().textContent(),choice);assert.equal(await page.locator('[name=answer]:checked').inputValue(),selected);
 await switchLanguage('zh');await page.getByRole('button',{name:'完成并提交',exact:false}).waitFor();assert.equal(await page.locator('[name=answer]:checked').inputValue(),selected);
 await page.goto(origin+'/#profile');await page.getByRole('heading',{name:'您的个人资料',exact:true}).waitFor();await page.locator('[name=name]').fill('Nama Tetap');await switchLanguage('id');assert.equal(await page.locator('[name=name]').inputValue(),'Nama Tetap');
 await switchLanguage('zh');for(const route of ['dashboard','learning','ranking','profile']){await page.goto(origin+'/#'+route);await page.locator('.content h1').waitFor();await page.waitForTimeout(100);await collect();}
 await switchLanguage('id');
 await page.locator('#menu').click();await page.locator('#logout').click();await page.locator('#login-form').waitFor();await page.locator('[data-portal=leader]').click();await page.locator('[name=username]').fill('LEADER');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.getByRole('heading',{name:'Gambaran pembelajaran perusahaan.',exact:true}).waitFor();
 await page.setViewportSize({width:1366,height:900});await switchLanguage('zh');await page.getByRole('heading',{name:'公司学习情况总览',exact:true}).waitFor();await page.screenshot({path:'artifacts/i18n-leader-zh-desktop.png',fullPage:true});
 await page.goto(origin+'/#employees');await page.getByRole('heading',{name:'员工学习进展',exact:true}).waitFor();await page.locator('[name=q]').fill('Ayu');await switchLanguage('id');assert.equal(await page.locator('[name=q]').inputValue(),'Ayu');await switchLanguage('zh');
 await page.setViewportSize({width:360,height:800});await page.screenshot({path:'artifacts/i18n-employees-zh-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await collect();writeFileSync('artifacts/i18n-untranslated.json',JSON.stringify([...untranslated].sort(),null,2));console.log('Remaining interface text:',JSON.stringify([...untranslated].sort()));
 assert.deepEqual(errors,[]);console.log('PASS: login, persistence, responsive header, live exam answers, form drafts, Leader and Employee language switching.');
 writeFileSync('artifacts/i18n-ui-report.json',JSON.stringify({passed:true,checks:['login','persistence','responsive','exam_content_and_answers_preserved','drafts_preserved','leader_portal','employee_portal'],errors},null,2));
}finally{await context.close();await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
