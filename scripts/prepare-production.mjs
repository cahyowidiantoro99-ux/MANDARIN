import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {openDatabase} from '../app/db.mjs';
import {validateProductionConfig} from '../app/production-config.mjs';
import {installSourceRelease} from './install-source-release.mjs';
import {Auth} from '../app/auth.mjs';
import {assert,strongPassword,now} from '../app/domain.mjs';
export async function prepareProduction(){
 assert(process.env.NODE_ENV==='production',503,'Persiapan ini hanya untuk NODE_ENV=production.');validateProductionConfig();
 const db=await openDatabase();try{
  await db.migrate();
  assert(!(await db.get('SELECT id FROM profiles WHERE demo=1 LIMIT 1')),503,'Database target berisi akun demo. Gunakan database production terpisah.');
  const installed=await installSourceRelease(db,JSON.parse(readFileSync(resolve('data/source-release.json'),'utf8')));
  const leader=await db.get("SELECT id FROM profiles WHERE role='leader' AND demo=0");
  if(!leader){
   const email=process.env.LEADER_EMAIL,password=process.env.LEADER_PASSWORD;
   assert(typeof email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),503,'LEADER_EMAIL perusahaan diperlukan untuk pembuatan akun Leader pertama.');
   assert(strongPassword(password)&&password!=='DemoMandarin!2026',503,'LEADER_PASSWORD kuat yang berbeda dari password demo diperlukan.');
   const auth=new Auth(db,{demo:false,supabase:true});const remote=await auth.remote('admin/users',{email:email.toLowerCase(),password,email_confirm:true},{admin:true});
   try{await db.run("INSERT INTO profiles(id,employee_id,name,email,department,division,job_title,self_level,role,password_hash,demo,created_at) VALUES(?,?,?,?,?,?,?,1,'leader',NULL,0,?)",[remote.id,'LEADER','Leader Bersama ECB',email.toLowerCase(),'KMU','Pimpinan','Leader',now()]);}
   catch(error){await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${remote.id}`,{method:'DELETE',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`}}).catch(()=>{});throw error;}
  }
  const fixtures=await db.get("SELECT id FROM content_versions WHERE demo=1 AND status='published' LIMIT 1");assert(!fixtures,503,'Konten fixture masih aktif pada target production.');
  console.log(JSON.stringify({production_ready:true,source_release:installed.version,demo_accounts:0,leader_ready:true,source_questions:installed.questions}));
 }finally{await db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{await prepareProduction();}catch(error){console.error('Persiapan production gagal:',error.status?error.message:error.code||error.name);process.exitCode=1;}}
