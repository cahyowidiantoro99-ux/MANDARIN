import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {createApp} from '../app/server.mjs';


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
 const bad=[];
 await page.goto(base);await page.locator('[name=username]').fill('DEMO002');await page.locator('[name=password]').fill('DemoMandarin!2026');await page.locator('#login-form [type=submit]').click();await page.waitForURL('**/#dashboard');page.on('response',r=>{if(r.status()>=400)bad.push(r.url()+' '+r.status());});
 for(const [name,hash,ready] of [['prestasi-v2','#ranking','.ach-v2 .ach-category'],['pdf-kosakata-v2','#vocab-atlas','.pdf-redesign'],['pdf-hanzi-v2','#hanzi','.pdf-redesign'],['chengyu-v2','#chengyu','.chengyu-card']]){
 await page.goto(base+'/'+hash);if(name==='pdf-hanzi-v2')await page.getByRole('heading',{name:'Katalog Hanzi HSK 1–9',exact:true}).waitFor();await page.locator(ready).first().waitFor();
 if(name==='prestasi-v2'){assert.equal(await page.locator('.ach-category-art').count(),6);const paths=await page.locator('.ach-category-art').evaluateAll(imgs=>imgs.map(i=>i.getAttribute('src')));assert.equal(new Set(paths).size,6);assert(paths.every(p=>p.includes('/prestasi-')));await page.locator('[data-ach-category=xp]').click();await page.locator('.ach-rules summary').click();assert.equal(await page.locator('.ach-xp-rules tbody tr').count(),16);await page.locator('[data-ach-category=hsk]').click();}
 for(const [tag,width,height] of [['desktop',1600,1000],['tablet',768,1000],['hp',390,850]]){
 await page.setViewportSize({width,height});await page.locator(ready).first().waitFor();await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.decode())));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' overflow '+tag);
 if(name==='prestasi-v2'){await page.locator('.ach-category-art').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));}
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/'+name+'-'+tag+'.png',fullPage:name==='prestasi-v2'&&tag==='desktop'});
 if(name.startsWith('pdf-'))await page.locator('.pdf-redesign').screenshot({path:'artifacts/banner-'+name+'-'+tag+'.png'});
 if(name==='prestasi-v2')await page.locator('.ach-categories').screenshot({path:'artifacts/cards-'+name+'-'+tag+'.png'});
 if(name==='chengyu-v2')await page.locator('.chengyu-hero').screenshot({path:'artifacts/hero-'+name+'-'+tag+'.png'});
 }
 if(name.startsWith('pdf-')){await page.locator('.pdf-redesign summary').click();await page.locator('[data-pdf-level]').selectOption('3');assert((await page.locator('[data-pdf-kind]').getAttribute('href')).endsWith('/3'));await page.locator('.pdf-redesign summary').click();}
 }
 await page.goto(base+'/#learning');await page.locator('a[href="#chengyu"] svg').waitFor();
 assert.deepEqual(bad,[]);assert.deepEqual(errors,[]);console.log('PASS redesigned Prestasi, unique six category assets, XP rules, PDF expand/filter, Chengyu hero; desktop/tablet/HP; zero failed requests or JS errors');
}finally{await browser.close();await new Promise(r=>app.server.close(r));await db.close();}
