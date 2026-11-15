import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url),dist=new URL('./dist/',import.meta.url);await mkdir(new URL('assets/',dist),{recursive:true});
for(const file of ['style.css','activation.js','assets/ecb-logo.png','assets/panda-reading.webp'])await copyFile(new URL(file,root),new URL(file,dist));
const html=(await readFile(new URL('index.html',root),'utf8')).replace('data-preview="true"','data-preview="false"').replace('<span class="preview-label">PRATINJAU LOKAL</span>','');await writeFile(new URL('index.html',dist),html);console.log('Activation static site built: production health check and automatic redirect enabled.');
