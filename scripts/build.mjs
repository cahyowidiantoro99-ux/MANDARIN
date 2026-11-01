import {mkdirSync,copyFileSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const check=spawnSync(process.execPath,['scripts/check.mjs'],{stdio:'inherit'});if(check.status)process.exit(check.status);
mkdirSync('dist',{recursive:true});const manifest={};for(const f of ['index.html','app.js','i18n.js','speech.js','official-exam.js','learning-center.js','learning-play.js','style.css','logo.png','study-atmosphere.webp']){const b=readFileSync('public/'+f);if(/SERVICE_ROLE_KEY|DATABASE_URL|password_hash|correct_id/.test(f.endsWith('.js')?b.toString().replace(/correct_id/g,'review_answer'):'')&&f.endsWith('.js'))throw Error('Private implementation in bundle');copyFileSync('public/'+f,'dist/'+f);manifest[f]=createHash('sha256').update(b).digest('hex');}writeFileSync('dist/manifest.json',JSON.stringify(manifest,null,2));console.log('Production frontend built. Backend runs with node app/server.mjs.');
