import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
if(process.env.DATABASE_URL)throw Error('PostgreSQL: gunakan backup terkelola Supabase atau pg_dump sesuai docs/OPERATIONS.md.');
const source=resolve(process.env.SQLITE_PATH||'data/development.sqlite'),target=resolve(arg('--out')||`data/backup-${Date.now()}.sqlite`);if(source===target||existsSync(target))throw Error('Target harus file baru dan berbeda dari database aktif.');mkdirSync(dirname(target),{recursive:true});const db=new DatabaseSync(source);try{db.prepare('VACUUM INTO ?').run(target);console.log('Backup konsisten dibuat: '+target);}finally{db.close();}
