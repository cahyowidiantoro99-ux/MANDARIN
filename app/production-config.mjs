import {assert} from './domain.mjs';
export function validateProductionConfig(env=process.env){
 if(env.NODE_ENV!=='production')return;
 for(const key of ['DATABASE_URL','SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','APP_ORIGIN'])assert(typeof env[key]==='string'&&env[key].trim(),503,`${key} wajib untuk production.`);
 assert(env.DEMO_MODE==='false',503,'Production membutuhkan DEMO_MODE=false secara eksplisit.');
 assert(env.CONTENT_MODE==='source',503,'Production membutuhkan CONTENT_MODE=source.');
 let app,supabase,database;try{app=new URL(env.APP_ORIGIN);supabase=new URL(env.SUPABASE_URL);database=new URL(env.DATABASE_URL);}catch{assert(false,503,'URL konfigurasi production tidak valid.');}
 assert(app.protocol==='https:'&&app.origin===env.APP_ORIGIN&&!app.username&&!app.password&&!['localhost','127.0.0.1','::1'].includes(app.hostname),503,'APP_ORIGIN harus berupa origin HTTPS publik tanpa path.');
 assert(supabase.protocol==='https:'&&!supabase.username&&!supabase.password,503,'SUPABASE_URL harus HTTPS.');
 assert(['postgres:','postgresql:'].includes(database.protocol),503,'DATABASE_URL harus PostgreSQL.');
 assert(!['disable','false','0'].includes(env.PG_SSL),503,'Verifikasi TLS PostgreSQL tidak boleh dinonaktifkan pada production.');
}
