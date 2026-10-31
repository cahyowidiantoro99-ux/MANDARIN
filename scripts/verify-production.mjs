import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {openDatabase} from '../app/db.mjs';
import {createApp} from '../app/server.mjs';

// Runs inside the deployed container. Only this run's temporary learner is removed.
const db=await openDatabase();let app,learnerId,learnerSession,leaderSession,base,verifiedValue;
const marker='deployment_smoke_v1',checks=[];
const suffix=randomUUID().slice(0,8),employeeId=`VERIFY-${suffix}`;
const leaderEmail=process.env.LEADER_EMAIL;
const email=`${leaderEmail.split('@')[0].split('+')[0]}+mandarin-check-${suffix}@${leaderEmail.split('@')[1]}`;
const password='Verify!'+randomBytes(24).toString('base64url')+'9a';
async function request(path,{method='GET',body,session,headers={}}={}){
 return fetch(base+path,{method,headers:{Origin:process.env.APP_ORIGIN,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(120000)});
}
async function json(path,options={},status=200){const r=await request(path,options);assert.equal(r.status,status,`Production check failed: ${path} status ${r.status}`);return r.json();}
async function login(username,password){const r=await request('/api/login',{method:'POST',body:{username,password}});assert.equal(r.status,200,'Production login failed');const data=await r.json();return {cookie:r.headers.get('set-cookie').split(';')[0],csrf:data.csrf,user:data.user};}
try{
 const version=await db.get("SELECT id FROM content_versions WHERE source LIKE 'source-release:%' AND status='published' ORDER BY created_at DESC LIMIT 1");assert(version,'Source release is missing');
 const prior=await db.get('SELECT value FROM app_config WHERE id=?',[marker]);
 if(prior&&JSON.parse(prior.value).version===version.id){console.log(JSON.stringify({production_smoke:true,already_verified:true}));}
 else{
  app=await createApp({db,migrate:false});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${app.server.address().port}`;
  const health=await json('/api/health');assert.equal(health.database,'postgres');checks.push('postgres_health');
  const meta=await json('/api/meta');assert.equal(meta.demo,false);assert.equal(meta.curriculum,'HSK3.0');checks.push('production_content');
  const created=await json('/api/register',{method:'POST',body:{employee_id:employeeId,name:'Temporary Deployment Verification',email,department:meta.departments[0].id,division:'Verification',job_title:'Verification',self_level:1,password}},201);learnerId=created.id;
  learnerSession=await login(employeeId,password);assert.equal(learnerSession.user.id,learnerId);checks.push('supabase_registration_login');
  await json('/api/dashboard',{session:learnerSession});assert.equal((await request('/api/leader',{session:learnerSession})).status,403);checks.push('employee_portal_access');
  const exam=await json('/api/exams',{method:'POST',body:{track:'hsk',mode:'placement'},session:learnerSession},201);assert.equal(exam.questions.length,20);assert(!JSON.stringify(exam).includes('correct_id'));
  const answers=Object.fromEntries(exam.questions.map(q=>[q.id,q.options[0].id]));await json(`/api/exams/${exam.id}/answers`,{method:'PUT',body:{answers},session:learnerSession});
  const submitted=await json(`/api/exams/${exam.id}/submit`,{method:'POST',body:{answers},session:learnerSession});assert(submitted.result.completed);checks.push('source_exam_save_submit');
  for(const type of ['pdf','mp3']){const asset=await db.get("SELECT id FROM source_assets WHERE status='available' AND media_type=? LIMIT 1",[type]);assert(asset);const r=await request(`/api/library/${asset.id}/file`,{session:learnerSession,headers:{Range:'bytes=0-15'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,16);}checks.push('pdf_audio_ranges');
  leaderSession=await login('LEADER',process.env.LEADER_PASSWORD);assert.equal(leaderSession.user.role,'leader');await json('/api/leader',{session:leaderSession});checks.push('leader_portal');
  verifiedValue=JSON.stringify({version:version.id,checked_at:new Date().toISOString(),checks});
 }
}catch(error){console.error('Production verification failed:',error.code||error.message);process.exitCode=1;}
finally{
 try{
  if(base)for(const session of [learnerSession,leaderSession])if(session)await json('/api/logout',{method:'POST',body:{},session});
  if(learnerId){
   const own=await db.get('SELECT employee_id,email FROM profiles WHERE id=?',[learnerId]);assert.equal(own.employee_id,employeeId);assert.equal(own.email,email);
   await db.tx(async t=>{
    for(const table of ['exam_answers','placement_answers','exam_session_questions','exam_session_metadata','exam_exposure_order'])await t.run(`DELETE FROM ${table} WHERE session_id IN (SELECT id FROM exam_sessions WHERE user_id=?)`,[learnerId]);
    await t.run('DELETE FROM placement_sessions WHERE id IN (SELECT id FROM exam_sessions WHERE user_id=?)',[learnerId]);
    for(const table of ['exam_results','exam_sessions','auth_sessions','reset_tokens','weekly_targets','learning_progress','notification_preferences','notifications','audit_logs','profile_curriculum'])await t.run(`DELETE FROM ${table} WHERE user_id=?`,[learnerId]);
    await t.run('DELETE FROM profiles WHERE id=?',[learnerId]);
   });
   const r=await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${learnerId}`,{method:'DELETE',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`},signal:AbortSignal.timeout(15000)});assert(r.ok,'Temporary verification Auth cleanup failed');
   console.log(JSON.stringify({temporary_verification_user_removed:true}));
  }
  if(verifiedValue&&!process.exitCode){await db.run('INSERT INTO app_config(id,value) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value',[marker,verifiedValue]);console.log(JSON.stringify({production_smoke:true,checks}));}
 }catch(error){console.error('Production verification cleanup failed:',error.code||error.message);process.exitCode=1;}
 if(app)await new Promise(r=>app.server.close(r));await db.close();
}
