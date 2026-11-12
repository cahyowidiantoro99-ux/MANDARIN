import {postgresTransaction} from './postgres-transaction.mjs';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {databaseSchema,postgresMigration} from './postgres-schema.mjs';
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function openDatabase({url=process.env.DATABASE_URL, file=process.env.SQLITE_PATH || resolve(ROOT,'data/development.sqlite')}={}) {
  let pool, sqlite;
  if(url) { const {Pool}=await import('pg'); pool=new Pool({connectionString:url,ssl:process.env.PG_SSL==='disable'?false:{rejectUnauthorized:true,...(process.env.PG_SSL_CA_FILE?{ca:readFileSync(resolve(ROOT,process.env.PG_SSL_CA_FILE),'utf8')}:{})},options:`-c search_path=${databaseSchema()}`,max:8}); }
  else { if(process.env.NODE_ENV==='production') throw Error('Production requires PostgreSQL and Supabase Auth'); mkdirSync(dirname(file),{recursive:true}); sqlite=new DatabaseSync(file); sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;'); }
  const wrap=client=>({
    async all(sql, params=[]) { if(client){let n=0;return (await client.query(sql.replace(/\?/g,()=>`$${++n}`),params)).rows;} return sqlite.prepare(sql).all(...params); },
    async get(sql,params=[]) { return (await this.all(sql,params))[0]; },
    async run(sql,params=[]) { if(client){let n=0;return client.query(sql.replace(/\?/g,()=>`$${++n}`),params);}return sqlite.prepare(sql).run(...params); },
  });
  const db=wrap(pool); let tail=Promise.resolve();
  db.tx=async (fn,options)=>{if(pool)return postgresTransaction(pool,wrap,fn,options);let release;const prev=tail;tail=new Promise(r=>release=r);await prev;let client;
    try { client=pool?await pool.connect():null; const t=wrap(client);await t.run(pool?'BEGIN ISOLATION LEVEL SERIALIZABLE':'BEGIN IMMEDIATE');try{const result=await fn(t);await t.run('COMMIT');return result;}catch(e){await t.run('ROLLBACK');throw e;} }
    finally{client?.release();release();}
  };
  db.migrate=async()=>{ if(sqlite){sqlite.exec(readFileSync(resolve(ROOT,'migrations/001_local.sql'),'utf8'));sqlite.exec(readFileSync(resolve(ROOT,'migrations/002_sources.sql'),'utf8'));}else await pool.query(postgresMigration(resolve(ROOT,'migrations/001_supabase.sql'))); };
  db.close=async()=>{await tail;if(pool)await pool.end();else sqlite.close();};
  db.kind=pool?'postgres':'sqlite'; return db;
}
