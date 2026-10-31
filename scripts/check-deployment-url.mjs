import {assert} from '../app/domain.mjs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export function checkDeploymentUrl(value){let url;try{url=new URL(value);}catch{assert(false,400,'URL deployment tidak valid.');}assert(url.protocol==='https:',400,'Deployment publik membutuhkan HTTPS.');const address=decodeURIComponent(url.hostname).toLowerCase().replace(/[-_.\s]/g,'');assert(!address.includes('anisnurhayati')&&!address.includes('nurhayati'),400,'Alamat mengandung nama yang dilarang pengguna.');assert(!['localhost','127.0.0.1','::1'].includes(url.hostname),400,'URL lokal bukan deployment publik.');return url.origin;}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){console.log(checkDeploymentUrl(process.argv[2]));}
