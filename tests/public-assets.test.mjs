import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {gunzipSync} from 'node:zlib';
import {readFile} from 'node:fs/promises';
import {createApp} from '../app/server.mjs';

test('Public assets compress/revalidate while HTML and private endpoints remain no-store',async()=>{
 const app=await createApp({db:{kind:'audit'},migrate:false,auth:{supabase:false}});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const request=(path,headers={},method='GET')=>new Promise((resolve,reject)=>{http.request({host:'127.0.0.1',port:app.server.address().port,path,headers,method},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));}).on('error',reject).end();});
 try{
  const raw=await request('/app.js'),gzip=await request('/app.js',{'Accept-Encoding':'gzip'});
  assert.equal(raw.status,200);assert.equal(gzip.headers['content-encoding'],'gzip');assert.equal(gzip.headers.vary,'Accept-Encoding');assert.deepEqual(gunzipSync(gzip.body),raw.body);assert(gzip.body.length<raw.body.length*.5);assert.notEqual(raw.headers.etag,gzip.headers.etag);
  for(const encoding of ['gzip;q=0','gzip;q=0.000, *;q=1'])assert.equal((await request('/app.js',{'Accept-Encoding':encoding})).headers['content-encoding'],undefined);
  assert.equal((await request('/app.js',{'Accept-Encoding':'*'})).headers['content-encoding'],'gzip');
  const hit=await request('/app.js',{'Accept-Encoding':'gzip','If-None-Match':'W/'+gzip.headers.etag});assert.equal(hit.status,304);assert.equal(hit.body.length,0);assert.match(hit.headers['cache-control'],/must-revalidate/);
  assert.equal((await request('/app.js',{'If-None-Match':gzip.headers.etag})).status,200,'different representation must not reuse a strong ETag');
  const head=await request('/app.js',{'Accept-Encoding':'gzip'},'HEAD');assert.equal(head.body.length,0);assert.equal(Number(head.headers['content-length']),gzip.body.length);
  assert.equal((await request('/style.css')).headers['cache-control'],'public, max-age=0, must-revalidate');
  for(const path of ['/','/api/health','/api/me','/data/official-hsk/bank.json']){const r=await request(path,{'Accept-Encoding':'gzip','If-None-Match':'*'});assert.equal(r.headers['cache-control'],'no-store');assert.equal(r.headers.etag,undefined);assert.notEqual(r.status,304);}
  assert.equal((await request('/api/me')).status,401);assert.equal((await request('/data/official-hsk/bank.json')).status,404);
  assert.deepEqual(raw.body,await readFile('public/app.js'));
 }finally{await new Promise(r=>app.server.close(r));}
});
