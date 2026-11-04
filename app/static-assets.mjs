import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzip} from 'node:zlib';
import {promisify} from 'node:util';
const compress=promisify(gzip);
const acceptsGzip=header=>{const entries=String(header||'').split(',').map(s=>s.trim().split(';')),match=entries.find(([name])=>name.toLowerCase()==='gzip')||entries.find(([name])=>name==='*');return !!match&&!match.slice(1).some(s=>/^\s*q\s*=\s*0(?:\.0*)?\s*$/i.test(s));};
// Only call this for the public allowlist. Personal/API responses never enter this cache.
export function createStaticAssets({production=false}={}){
 const cache=new Map();
 return async function serve(req,res,path,type){
  let pending=cache.get(path);
  if(!pending){pending=(async()=>{const raw=await readFile(path),packed=/^(text\/|application\/javascript)/.test(type)&&raw.length>=1024?await compress(raw):null;return {raw,gzip:packed&&packed.length<raw.length?packed:null};})();if(production){cache.set(path,pending);pending.catch(()=>cache.delete(path));}}
  const asset=await pending,encoded=!!asset.gzip&&acceptsGzip(req.headers['accept-encoding']),data=encoded?asset.gzip:asset.raw,etag='"'+createHash('sha256').update(data).digest('hex')+'"';
  res.setHeader('Content-Type',type);res.setHeader('Vary','Accept-Encoding');
  // Unversioned URLs must revalidate after deploy. HTML and private APIs remain no-store.
  const cacheable=!type.startsWith('text/html');
  if(cacheable){res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('ETag',etag);}
  if(encoded)res.setHeader('Content-Encoding','gzip');
  if(cacheable&&String(req.headers['if-none-match']||'').split(',').some(tag=>tag.trim().replace(/^W\//,'')===etag||tag.trim()==='*')){res.writeHead(304);return res.end();}
  res.setHeader('Content-Length',data.length);res.writeHead(200);res.end(req.method==='HEAD'?undefined:data);
 };
}
