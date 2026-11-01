import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {createApp} from '../app/server.mjs';
const db=await openDatabase({file:':memory:',url:null});await db.migrate();await seed(db,{demo:true});
const app=await createApp({db,demo:true,migrate:false,auth:{supabase:false}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${app.server.address().port}`,browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('[data-portal="leader"]').click();await page.locator('[name=username]').fill('LEADER');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.locator('[href="#learning-analytics"]').waitFor();await page.locator('[href="#learning-analytics"]').click();await page.locator('#la-filter').waitFor();assert((await page.locator('h1').innerText()).includes('Analitik'));
 await page.screenshot({path:'artifacts/learning-analytics-desktop.png',fullPage:true});
 await page.setViewportSize({width:360,height:800});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/learning-analytics-mobile.png',fullPage:true});
 await page.locator('#la-filter [name=q]').fill('NO MATCH');await page.locator('#la-filter button').click();await page.getByText('Belum ada karyawan sesuai filter.',{exact:true}).waitFor();await page.reload();await page.locator('#la-filter').waitFor();assert.deepEqual(errors,[]);
 const employee=await browser.newPage({viewport:{width:360,height:800}});await employee.goto(base);await employee.locator('[name=username]').fill('DEMO002');await employee.locator('[name=password]').fill('DemoMandarin!2026');await employee.locator('#login-form [type=submit]').click();await employee.locator('[href="#learning"]').first().waitFor();await employee.goto(base+'/#learning');await employee.getByText('Langkah berikutnya untuk Anda',{exact:true}).waitFor();assert(await employee.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await employee.reload();await employee.getByText('Langkah berikutnya untuk Anda',{exact:true}).waitFor();await employee.goto(base+'/#learning-analytics');await employee.waitForURL('**/#dashboard');
 console.log('PASS Leader analytics desktop/360px, filter empty state, refresh, Employee recommendations/refresh, forbidden Leader route.');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
