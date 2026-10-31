import {openDatabase} from '../app/db.mjs';
import {id,now} from '../app/domain.mjs';
const db=await openDatabase();try{await db.migrate();await db.tx(async t=>{
 if(await t.get("SELECT id FROM audit_logs WHERE action='source_learning_transition_v2'"))return;
 await t.run("UPDATE learning_progress SET completed=0,updated_at=? WHERE user_id NOT IN (SELECT DISTINCT ls.user_id FROM learning_sessions ls JOIN learning_session_metadata lm ON lm.session_id=ls.id WHERE lm.content_mode='source')",[now()]);
 await t.run("UPDATE learning_sessions SET closed=1 WHERE id NOT IN (SELECT session_id FROM learning_session_metadata WHERE content_mode='source')");
 const policy=await t.get("SELECT formula FROM ranking_policy_versions WHERE id='v1-normalized-gain'");await t.run('INSERT INTO ranking_policy_versions(id,formula,created_at) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING',['hsk3-source-v2',policy?.formula||'{}',now()]);await t.run("UPDATE app_config SET value=? WHERE id='ranking_policy'",[JSON.stringify('hsk3-source-v2')]);
 await t.run('INSERT INTO audit_logs(id,action,detail,created_at) VALUES(?,?,?,?)',[id(),'source_learning_transition_v2','Legacy fixture study history retained; new curriculum progress/eligibility separated.',now()]);
 });console.log('Source curriculum progress transition verified; historical records preserved.');}finally{await db.close();}
