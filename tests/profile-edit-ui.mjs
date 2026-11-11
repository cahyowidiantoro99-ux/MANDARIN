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
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.locator('.dash-vocabulary').waitFor();await page.goto(base+'/#profile');await page.locator('#edit-profile').click();
 for(const name of ['employee_id','department','division','job_title','name','email','self_level'])assert(await page.locator('[name='+name+']').isEnabled());await page.locator('[name=employee_id]').fill('NEWDEMO002');await page.locator('[name=email]').fill('profile-new@example.com');await page.locator('[name=name]').fill('Nama Baru');await page.locator('[name=division]').fill('Divisi Baru');await page.locator('[name=job_title]').fill('Jabatan Baru');await page.locator('[name=self_level]').selectOption('4');await page.locator('[name=current_password]').fill('DemoMandarin!2026');
 for(const width of [1365,390]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/profile-all-fields-'+width+'.png',fullPage:true});}
 await page.locator('#profile-form [type=submit]').click();await page.locator('#edit-profile').waitFor({state:'visible'});assert.equal(await page.locator('[name=employee_id]').inputValue(),'NEWDEMO002');assert.equal(await page.locator('[name=email]').inputValue(),'profile-new@example.com');await page.reload();await page.locator('#edit-profile').waitFor();assert.equal(await page.locator('[name=division]').inputValue(),'Divisi Baru');assert.deepEqual(errors,[]);console.log('PASS edit all fields, save identity/email, refresh and desktop/mobile');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
