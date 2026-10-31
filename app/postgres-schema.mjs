import {readFileSync} from 'node:fs';
export function databaseSchema(value=process.env.DATABASE_SCHEMA||'public'){
 if(!['public','ecb_mandarin'].includes(value))throw Error('DATABASE_SCHEMA harus public atau ecb_mandarin.');
 return value;
}
export function postgresMigration(path,schema=databaseSchema()){
 databaseSchema(schema);
 const sql=readFileSync(path,'utf8');
 if(schema==='public')return sql;
 return `DO $schema$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='${schema}') THEN CREATE SCHEMA ${schema}; END IF; END $schema$; GRANT USAGE ON SCHEMA ${schema} TO authenticated; SET search_path=${schema};\n`+sql.replace(/\bpublic\./g,`${schema}.`).replace(/search_path=public,/g,`search_path=${schema},`).replace(/\bauth\.uid\(\)/g,`${schema}.request_user_id()`);
}
