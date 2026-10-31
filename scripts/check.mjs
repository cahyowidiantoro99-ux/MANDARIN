import {readdirSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
let count=0;for(const dir of ['app','scripts','tests','public'])for(const file of readdirSync(dir)){if(!/\.(mjs|js)$/.test(file))continue;const path=`${dir}/${file}`,p=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(p.status){console.error(p.stderr);process.exit(1);}const source=readFileSync(path,'utf8');if(/\beval\s*\(|new Function\s*\(/.test(source))throw Error(`Unsafe dynamic execution: ${path}`);count++;}console.log(`Syntax/security lint: ${count} JS files passed.`);
