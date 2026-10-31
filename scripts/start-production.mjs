import {prepareProduction} from './prepare-production.mjs';
try{
 await prepareProduction();
 if(process.env.PRODUCTION_VERIFY_ONCE==='true'){
  await import('./verify-production.mjs');
  if(process.exitCode)throw Error('Production verification did not pass.');
 }
 const {createApp}=await import('../app/server.mjs');
 const app=await createApp({migrate:false});const port=Number(process.env.PORT||10000);
 app.server.listen(port,process.env.HOST||'0.0.0.0',()=>console.log(`ECB Mandarin production ready on port ${port}`));
 let stopping=false;
 const stop=()=>{if(stopping)return;stopping=true;const timeout=setTimeout(()=>process.exit(1),20000);timeout.unref();app.server.close(async()=>{await app.db.close();clearTimeout(timeout);process.exit(0);});};
 process.once('SIGTERM',stop);process.once('SIGINT',stop);
}catch(error){console.error('Production startup failed:',error.status?error.message:error.code||error.name);process.exitCode=1;}
