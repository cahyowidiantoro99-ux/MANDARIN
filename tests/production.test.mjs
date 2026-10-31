import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {validateProductionConfig} from '../app/production-config.mjs';
import {clientIp} from '../app/client-ip.mjs';
import {checkDeploymentUrl} from '../scripts/check-deployment-url.mjs';
import {insertRows} from '../app/bulk-insert.mjs';
import {PGlite} from '@electric-sql/pglite';
const config={NODE_ENV:'production',DEMO_MODE:'false',CONTENT_MODE:'source',APP_ORIGIN:'https://ecb-mandarin.example.com',DATABASE_URL:'postgresql://fixture:unit-test-only@db.example.invalid/postgres',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_ANON_KEY:'unit-test-public',SUPABASE_SERVICE_ROLE_KEY:'unit-test-private',PG_SSL:'verify'};
test('[Production] requires real production settings and refuses demo, fixture, local origin and insecure database TLS',()=>{
 assert.doesNotThrow(()=>validateProductionConfig(config));
 for(const patch of [{DEMO_MODE:'true'},{DEMO_MODE:''},{CONTENT_MODE:'fixture'},{APP_ORIGIN:'http://ecb-mandarin.example.com'},{APP_ORIGIN:'https://localhost'},{APP_ORIGIN:'https://ecb-mandarin.example.com/path'},{PG_SSL:'disable'},{DATABASE_URL:'sqlite://local'},{SUPABASE_URL:'http://fixture.supabase.co'}])assert.throws(()=>validateProductionConfig({...config,...patch}));
 for(const key of ['DATABASE_URL','SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','APP_ORIGIN'])assert.throws(()=>validateProductionConfig({...config,[key]:''}),new RegExp(key));
});
test('[Production] proxy-aware rate limiting uses the trusted rightmost client IP and rejects spoofed or invalid forwarding',()=>{
 const request={socket:{remoteAddress:'10.0.0.1'},headers:{'x-forwarded-for':'203.0.113.5, 198.51.100.7'}};
 assert.equal(clientIp(request,0),'10.0.0.1');assert.equal(clientIp(request,1),'198.51.100.7');assert.equal(clientIp({...request,headers:{'x-forwarded-for':'spoofed'}},1),'10.0.0.1');assert.equal(clientIp(request,99),'10.0.0.1');
});
test('[Production] public URL policy rejects the prohibited personal name and local/non-HTTPS addresses',()=>{
 assert.equal(checkDeploymentUrl('https://ecb-mandarin.example.com/'),'https://ecb-mandarin.example.com');
 for(const url of ['https://ecb-mandarin.anis-nurhayati313.example.com','https://anis.nurhayati.example.com','http://ecb-mandarin.example.com','https://localhost'])assert.throws(()=>checkDeploymentUrl(url));
});
test('[Production] generated browser bundle has no demo credential/banner and remains valid JavaScript',()=>{
 const source=readFileSync('dist-production/app.js','utf8');for(const marker of ['DemoMandarin!2026','Employee: DEMO001','LINGKUNGAN DEMO','<strong>AKUN UJI</strong>'])assert(!source.includes(marker));
 const result=spawnSync(process.execPath,['--check','dist-production/app.js'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert(readFileSync('Dockerfile','utf8').includes('/app/dist-production ./public'));
});
test('[Production] PostgreSQL batch import preserves parameters, foreign keys and rollback across chunks',async()=>{
 const pg=new PGlite();const tx={async run(sql,params){let n=0;return pg.query(sql.replace(/\?/g,()=>`$${++n}`),params);}};
 try{await pg.exec('CREATE TABLE parent(id integer PRIMARY KEY,label text NOT NULL);CREATE TABLE child(id integer PRIMARY KEY,parent_id integer REFERENCES parent(id));');
 const rows=Array.from({length:1201},(_,i)=>[i,`quoted '\" text ${i}`]);await insertRows(tx,'parent',['id','label'],rows);assert.equal((await pg.query('SELECT count(*)::int AS c FROM parent')).rows[0].c,1201);assert.equal((await pg.query('SELECT label FROM parent WHERE id=1200')).rows[0].label,rows[1200][1]);
 await pg.exec('BEGIN');try{await insertRows(tx,'child',['id','parent_id'],[[1,1],[2,999999]]);assert.fail('Foreign key should fail');}catch{await pg.exec('ROLLBACK');}assert.equal((await pg.query('SELECT count(*)::int AS c FROM child')).rows[0].c,0);
 await assert.rejects(()=>insertRows(tx,'parent;drop_table',['id'],[[1]]),/tidak valid/);
 }finally{await pg.close();}
});
