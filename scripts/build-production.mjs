import {mkdirSync,readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const check=spawnSync(process.execPath,['scripts/check.mjs'],{stdio:'inherit'});if(check.status)process.exit(check.status);
let js=readFileSync('public/app.js','utf8');
js=js.replace(/function demoBanner\(\)\{[\s\S]*?\}\r?\nconst brand=/,"function demoBanner(){return '';}\nconst brand=");
js=js.replace(/\$\{meta\.demo\?'<div class="auth-demo">[\s\S]*?<\/div>':''\}/g,'');
if(js.includes('DemoMandarin!2026')||js.includes('Employee: DEMO001')||js.includes('LINGKUNGAN DEMO')||js.includes('<strong>AKUN UJI</strong>'))throw Error('Production client still exposes demo credentials/banner.');
mkdirSync('dist-production',{recursive:true});const manifest={};for(const f of ['index.html','app.js','i18n.js','learning-i18n.js','speech.js','read-cache.js','official-exam.js','learning-center.js','learning-play.js','hanzi-atlas.js','vocab-atlas.js','dashboard-plan.js','learning-analytics.js','leader-portal.js','exam-center.js','achievements.js','style.css','hub-matching.webp','hub-sentence.webp','hub-listening.webp','exam-hsk.webp','exam-work.webp','exam-skills.webp','exam-vocab.webp','exam-grammar.webp','exam-translation.webp','logo.png','recommend-panda.webp','study-atmosphere.webp']){const bytes=f==='app.js'?Buffer.from(js):readFileSync('public/'+f);writeFileSync('dist-production/'+f,bytes);manifest[f]=createHash('sha256').update(bytes).digest('hex');}
writeFileSync('dist-production/manifest.json',JSON.stringify(manifest,null,2));console.log('Production client built without demo credentials or account banners.');
