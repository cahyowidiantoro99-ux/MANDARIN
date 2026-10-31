import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
const results=[];
function run(name,args){const r=spawnSync(process.execPath,args,{encoding:'utf8'});results.push({name,status:r.status===0?'PASS':'FAIL',command:'node '+args.join(' '),output:r.stdout.trim(),error:r.stderr.trim()});return r;}
run('Syntax/security lint',['scripts/check.mjs']);run('Production build',['scripts/build.mjs']);run('Idempotent development migration/seed',['--env-file=.env','scripts/seed.mjs','--demo']);
const target=resolve(`data/qa-backup-${Date.now()}.sqlite`);const backup=run('Consistent SQLite backup',['--env-file=.env','scripts/backup.mjs','--out',target]);if(backup.status===0){const restored=new DatabaseSync(target,{readOnly:true}),source=new DatabaseSync(process.env.SQLITE_PATH||'data/development.sqlite',{readOnly:true});try{const integrity=restored.prepare('PRAGMA integrity_check').get().integrity_check;const counts={};for(const table of ['profiles','learning_packages','questions','vocabulary','content_versions']){counts[table]={backup:restored.prepare(`SELECT COUNT(*) c FROM ${table}`).get().c,source:source.prepare(`SELECT COUNT(*) c FROM ${table}`).get().c};}const ok=integrity==='ok'&&Object.values(counts).every(x=>x.backup===x.source);results.push({name:'Backup restore read/integrity verification',status:ok?'PASS':'FAIL',integrity,counts});}finally{restored.close();source.close();}}
run('Expiry/reminder/snapshot worker',['--env-file=.env','scripts/worker.mjs']);
writeFileSync('artifacts/quality-results.json',JSON.stringify(results,null,2));for(const r of results)console.log(r.status,r.name);if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
