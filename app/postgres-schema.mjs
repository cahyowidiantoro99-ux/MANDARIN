import {readFileSync} from 'node:fs';
export function databaseSchema(value=process.env.DATABASE_SCHEMA||'public'){
 if(!['public','ecb_mandarin'].includes(value))throw Error('DATABASE_SCHEMA harus public atau ecb_mandarin.');
 return value;
}
export function postgresMigration(path,schema=databaseSchema()){
 databaseSchema(schema);
 const sql=readFileSync(path,'utf8');
 if(schema==='public')return sql;
 return `CREATE SCHEMA IF NOT EXISTS ${schema}; GRANT USAGE ON SCHEMA ${schema} TO authenticated; SET search_path=${schema};\n`+sql.replace(/\bpublic\./g,`${schema}.`).replace(/search_path=public,/g,`search_path=${schema},`);
}
