// PostgreSQL owns isolation; independent users need not share a process-wide queue.
export async function postgresTransaction(pool,wrap,fn,{attempts=4}={}){
 for(let attempt=0;;attempt++){
  const client=await pool.connect(),t=wrap(client);
  try{
   await t.run('BEGIN ISOLATION LEVEL SERIALIZABLE');
   try{const result=await fn(t);await t.run('COMMIT');return result;}
   catch(error){await t.run('ROLLBACK');throw error;}
  }catch(error){if(!['40001','40P01'].includes(error.code)||attempt>=attempts-1)throw error;}
  finally{client.release();}
 }
}
