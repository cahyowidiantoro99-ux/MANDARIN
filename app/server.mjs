import {learningTarget,setLearningTarget,goalOptions,dashboardHistory} from './learning-target.mjs';
import {vocabularyList,startVocabulary,answerVocabulary,vocabularyMistakes} from './vocab-atlas.mjs';
import {atlasCatalog,atlasProgress,startAtlas,getAtlasAttempt,answerAtlas} from './hanzi-atlas.mjs';
import {createStaticAssets} from './static-assets.mjs';
import {hskCatalog,mistakeBank} from './hsk-bank.mjs';
import {leaderPortal} from './leader-portal.mjs';
import {achievements} from './achievements.mjs';
import {learningAnalytics} from './learning-analytics.mjs';
import {LearningPlay} from './learning-play.mjs';
import {LearningCenter} from './learning-center.mjs';
import {officialCatalog,advanceSimulation,abandonOfficial,changeStudySection,studyFeedback,ownedOfficial,officialView,saveOfficial,submitOfficial,officialAsset} from './official-hsk.mjs';
import {gradeOfficialWriting} from './official-writing.mjs';
import http from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {openDatabase,ROOT} from './db.mjs';
import {Auth} from './auth.mjs';
import {Service} from './service.mjs';
import {assert,AppError,publicProfile,now,hash} from './domain.mjs';
import {validateProductionConfig} from './production-config.mjs';
import {clientIp} from './client-ip.mjs';
export async function createApp(options={}){
 const production=process.env.NODE_ENV==='production',serveStatic=createStaticAssets({production});
 validateProductionConfig();
 const db=options.db||await openDatabase();if(options.migrate!==false)await db.migrate();const demo=options.demo??process.env.DEMO_MODE==='true',auth=new Auth(db,{demo,...options.auth}),service=new Service(db,{demo,...options.service});
 const reply=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...headers});res.end(JSON.stringify(data));};
 const server=http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');res.setHeader('Permissions-Policy','camera=(), microphone=(self), geolocation=()');res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data: https://i.ytimg.com; style-src 'self'; script-src 'self'; connect-src 'self'; media-src 'self' blob:; frame-src https://www.youtube-nocookie.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");if(production)res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  try{const origin=process.env.APP_ORIGIN||`http://127.0.0.1:${server.address()?.port||3000}`,url=new URL(req.url,origin),path=url.pathname,method=req.method;const raw=(req.headers.cookie||'').match(/(?:^|;\s*)ecb_session=([a-f0-9]{64})(?:;|$)/)?.[1];
   if(path==='/api/health')return reply(res,200,{ok:true,mode:demo?'DEMO':'production_content',database:db.kind});
   if(!path.startsWith('/api/')){assert(['GET','HEAD'].includes(method),405,'Metode tidak diizinkan.');const allowed={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/i18n.js':'i18n.js','/learning-i18n.js':'learning-i18n.js','/speech.js':'speech.js','/read-cache.js':'read-cache.js','/official-exam.js':'official-exam.js','/learning-center.js':'learning-center.js','/learning-play.js':'learning-play.js','/hanzi-atlas.js':'hanzi-atlas.js','/vocab-atlas.js':'vocab-atlas.js','/dashboard-plan.js':'dashboard-plan.js','/learning-analytics.js':'learning-analytics.js','/leader-portal.js':'leader-portal.js','/exam-center.js':'exam-center.js','/achievements.js':'achievements.js','/style.css':'style.css','/hub-matching.webp':'hub-matching.webp','/hub-sentence.webp':'hub-sentence.webp','/hub-listening.webp':'hub-listening.webp','/dash-welcome.webp':'dash-welcome.webp','/dash-missions.webp':'dash-missions.webp','/exam-hsk.webp':'exam-hsk.webp','/exam-work.webp':'exam-work.webp','/exam-skills.webp':'exam-skills.webp','/exam-vocab.webp':'exam-vocab.webp','/exam-grammar.webp':'exam-grammar.webp','/exam-translation.webp':'exam-translation.webp','/logo.png':'logo.png','/recommend-panda.webp':'recommend-panda.webp','/study-atmosphere.webp':'study-atmosphere.webp'};const file=allowed[path];assert(file,404,'Halaman tidak ditemukan.');return await serveStatic(req,res,resolve(ROOT,'public',file),{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp'}[extname(file)]);}
   const ip=clientIp(req,process.env.TRUST_PROXY_HOPS||0);let body={};if(!['GET','HEAD'].includes(method)){assert(req.headers.origin===origin,403,'Origin tidak diizinkan.');assert((req.headers['content-type']||'').startsWith('application/json'),415,'Gunakan JSON.');let data='';for await(const chunk of req){data+=chunk;assert(Buffer.byteLength(data)<=32768,413,'Request terlalu besar.');}try{body=JSON.parse(data||'{}');}catch{throw new AppError(400,'JSON tidak valid.');}assert(body&&typeof body==='object'&&!Array.isArray(body),400,'Objek JSON wajib.');}
   if(path==='/api/meta'&&method==='GET')return reply(res,200,{demo,source_content:service.sourceContent,curriculum:service.sourceContent?'HSK3.0':'fixture',departments:await db.all('SELECT * FROM departments ORDER BY name'),timezone:'Asia/Makassar'});
   if(path==='/api/register'&&method==='POST'){assert(!await auth.session(raw),403,'Registrasi hanya tersedia tanpa sesi portal.');return reply(res,201,await auth.register(body,ip));}
   if(path==='/api/login'&&method==='POST'){const login=await auth.login(body,ip);await service.audit(login.user,login.user.role==='leader'?'shared_leader_login':'employee_login');return reply(res,200,{user:login.user,csrf:login.csrf},{'Set-Cookie':`ecb_session=${login.raw}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${production?'; Secure':''}`});}
   if(path==='/api/forgot'&&method==='POST')return reply(res,200,await auth.forgot(body,ip));
   if(path==='/api/reset'&&method==='POST')return reply(res,200,await auth.reset(body,ip));
   const user=await auth.session(raw);assert(user,401,'Sesi berakhir. Silakan masuk.');if(!['GET','HEAD'].includes(method))assert(req.headers['x-csrf-token']===user.csrf,403,'Token keamanan tidak valid.');
   if(path==='/api/me'&&method==='GET')return reply(res,200,{user:publicProfile(user,true),csrf:user.csrf,demo});
   if(path==='/api/logout'&&method==='POST'){await auth.logout(raw);return reply(res,200,{ok:true},{'Set-Cookie':'ecb_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
   if(path.startsWith('/api/vocabulary/')){
    service.employee(user);
    if(path==='/api/vocabulary/list'&&method==='GET')return reply(res,200,vocabularyList(url.searchParams));
    if(path==='/api/vocabulary/mistakes'&&method==='GET')return reply(res,200,await vocabularyMistakes(db,user));
    if(path==='/api/vocabulary/attempts'&&method==='POST')return reply(res,201,await startVocabulary(db,user,body,service.clock()));
    const attempt=path.match(/^\/api\/vocabulary\/attempts\/([a-f0-9-]{36})$/);
    if(attempt&&method==='PUT')return reply(res,200,await answerVocabulary(db,user,attempt[1],body,service.clock()));
    assert(false,404,'Fitur Kosakata tidak ditemukan.');
   }
   if(path.startsWith('/api/atlas/')){
    service.employee(user);
    if(path==='/api/atlas/catalog'&&method==='GET')return reply(res,200,atlasCatalog());
    if(path==='/api/atlas/progress'&&method==='GET')return reply(res,200,await atlasProgress(db,user));
    if(path==='/api/atlas/attempts'&&method==='POST')return reply(res,201,await startAtlas(db,user,body,service.clock()));
    const attempt=path.match(/^\/api\/atlas\/attempts\/([a-f0-9-]{36})$/);
    if(attempt&&method==='GET')return reply(res,200,await getAtlasAttempt(db,user,attempt[1]));
    if(attempt&&method==='PUT')return reply(res,200,await answerAtlas(db,user,attempt[1],body,service.clock()));
    assert(false,404,'Fitur Atlas tidak ditemukan.');
   }
   if(path.startsWith('/api/play/')){service.employee(user);const play=new LearningPlay(new LearningCenter(service));if(path==='/api/play/catalog'&&method==='GET')return reply(res,200,await play.catalog(user));if(path==='/api/play/start'&&method==='POST')return reply(res,201,await play.start(user,body));if(path==='/api/play/preferences'&&method==='PUT')return reply(res,200,await play.savePreferences(user,body));const pm=path.match(/^\/api\/play\/(stories|words|submit)\/([a-zA-Z0-9-]+)$/);if(pm){if(pm[1]!=='stories')assert(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(pm[2]),400,'ID aktivitas tidak valid.');if(pm[1]==='stories'&&method==='GET')return reply(res,200,await play.story(user,pm[2]));if(pm[1]==='words'&&method==='POST')return reply(res,200,await play.saveWord(user,pm[2]));if(pm[1]==='submit'&&method==='POST')return reply(res,200,await play.submit(user,pm[2],body));}assert(false,404,'Aktivitas tidak ditemukan.');}
   if(path.startsWith('/api/learn/')){const lc=new LearningCenter(service);service.employee(user);if(path==='/api/learn/summary'&&method==='GET')return reply(res,200,await lc.summary(user,Object.fromEntries(url.searchParams)));if(path==='/api/learn/deck'&&method==='GET')return reply(res,200,await lc.deck(user,Object.fromEntries(url.searchParams)));if(path==='/api/learn/challenges'&&method==='POST')return reply(res,201,await lc.challenge(user,body));const cm=path.match(/^\/api\/learn\/challenges\/([a-f0-9-]{36})\/(reveal|submit)$/);if(cm&&method==='POST')return reply(res,200,cm[2]==='reveal'?await lc.reveal(user,cm[1]):await lc.submit(user,cm[1],body));assert(false,404,'Menu belajar tidak ditemukan.');}
   if(path==='/api/learning-target'&&method==='GET')return reply(res,200,{...await learningTarget(service,user),options:goalOptions});
   if(path==='/api/learning-target'&&method==='PUT')return reply(res,200,await setLearningTarget(service,user,body));
   const dashboardHistoryMatch=path.match(/^\/api\/dashboard\/history\/(exams|xp|learning|activities)$/);
   if(dashboardHistoryMatch&&method==='GET')return reply(res,200,await dashboardHistory(service,user,dashboardHistoryMatch[1],Number(url.searchParams.get('offset')||0)));
   if(path==='/api/dashboard'&&method==='GET')return reply(res,200,await service.dashboard(user));
   const vocabularyMatch=path.match(/^\/api\/vocabulary\/([a-f0-9-]{36})\/progress$/);if(vocabularyMatch&&method==='PUT'){assert(Object.keys(body).every(k=>k==='status'),400,'Field status tidak valid.');return reply(res,200,await service.vocabularyProgress(user,vocabularyMatch[1],body.status));}
   if(path==='/api/profile'&&method==='PATCH')return reply(res,200,await service.updateProfile(user,body));
   if(path==='/api/packages'&&method==='GET')return reply(res,200,await service.packages(user));
   if(path==='/api/content-status'&&method==='GET')return reply(res,200,await service.contentStatus(user));
   if(path==='/api/hsk-center'&&method==='GET')return reply(res,200,await hskCatalog(service,user));
   if(path==='/api/hsk-mistakes'&&method==='GET')return reply(res,200,await mistakeBank(service,user));
   if(path==='/api/official-hsk'&&method==='GET')return reply(res,200,officialCatalog());
   const officialMatch=path.match(/^\/api\/official-exams\/([a-f0-9-]{36})(?:\/(answers|submit|grade|audio|page|section|feedback|abandon|advance)(?:\/(\d+))?)?$/);
   if(officialMatch){const sid=officialMatch[1],action=officialMatch[2];
    if(action==='advance'&&method==='POST')return reply(res,200,await advanceSimulation(service,user,sid,body.phase));
    if(action==='abandon'&&method==='POST')return reply(res,200,await abandonOfficial(service,user,sid));
    if(action==='section'&&method==='PUT')return reply(res,200,await changeStudySection(service,user,sid,body.section));
    if(action==='feedback'&&method==='GET')return reply(res,200,await studyFeedback(service,user,sid,Number(officialMatch[3])));
    if(action==='answers'&&method==='PUT')return reply(res,200,await saveOfficial(service,user,sid,body.answers));
    if(action==='submit'&&method==='POST')return reply(res,200,await submitOfficial(service,user,sid,body.answers||{}));
    if(action==='grade'&&method==='POST')return reply(res,200,await gradeOfficialWriting(service,user,sid));
    if(['audio','page'].includes(action)&&['GET','HEAD'].includes(method)){const asset=await officialAsset(service,user,sid,action,Number(officialMatch[3])),info=await stat(asset.path);let start=0,end=info.size-1,status=200;if(req.headers.range){const r=req.headers.range.match(/^bytes=(\d+)-(\d*)$/);assert(r,416,'Range tidak valid.');start=Number(r[1]);end=r[2]?Number(r[2]):end;assert(start<=end&&end<info.size,416,'Range tidak valid.');status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);}res.writeHead(status,{'Content-Type':asset.mime,'Content-Length':end-start+1,'Accept-Ranges':'bytes'});if(method==='HEAD')return res.end();const stream=createReadStream(asset.path,{start,end});stream.on('error',()=>res.destroy());return stream.pipe(res);}
   }
   if(path==='/api/library'&&method==='GET')return reply(res,200,await service.library());
   let assetMatch=path.match(/^\/api\/library\/([a-f0-9-]{36})(\/file)?$/);
   if(assetMatch&&method==='GET'){assert(!await db.get("SELECT s.id FROM exam_sessions s JOIN official_exam_state o ON o.session_id=s.id WHERE s.user_id=? AND s.status='active' LIMIT 1",[user.id]),403,'Perpustakaan sumber dikunci selama simulasi HSK berlangsung.');
    if(!assetMatch[2])return reply(res,200,await service.libraryDetail(assetMatch[1]));
    const asset=await db.get("SELECT * FROM source_assets WHERE id=? AND status='available'",[assetMatch[1]]);assert(asset&&['pdf','mp3','docx'].includes(asset.media_type),404,'File ini tidak dilayani langsung; baca materi hasil ekstraksi.');
    const file=resolve(ROOT,...asset.path.split(/[\\/]/)),base=resolve(ROOT)+sep;assert(file.startsWith(base)&&['SOAL HSK LENGKAP','KOSAKATA PEKERJAAN','MATERI HSK LENGKAP'].some(folder=>file.startsWith(resolve(ROOT,folder)+sep)),403,'Path sumber tidak diizinkan.');
    const info=await stat(file);let start=0,end=info.size-1,status=200;
    if(req.headers.range){const r=req.headers.range.match(/^bytes=(\d+)-(\d*)$/);assert(r,416,'Range tidak valid.');start=Number(r[1]);end=r[2]?Number(r[2]):end;assert(start<=end&&end<info.size,416,'Range tidak valid.');status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);}
    const mime={pdf:'application/pdf',mp3:'audio/mpeg',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}[asset.media_type];res.writeHead(status,{'Content-Type':mime,'Content-Length':end-start+1,'Accept-Ranges':'bytes','Content-Disposition':`${asset.media_type==='docx'?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(asset.title)}`});const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());return stream.pipe(res);
   }
   let match=path.match(/^\/api\/packages\/([a-f0-9-]{36})$/);if(match&&method==='GET')return reply(res,200,await service.package(user,match[1]));
   if(path==='/api/learning/start'&&method==='POST')return reply(res,201,await service.startLearning(user,body.package_id));
   match=path.match(/^\/api\/learning\/([a-f0-9-]{36})\/heartbeat$/);if(match&&method==='POST')return reply(res,200,await service.heartbeat(user,match[1],body));
   if(path==='/api/exams'&&method==='POST'){const exam=await service.startExam(user,body);if(exam.format==='official_archive'&&!exam.untimed){const expiry=Number(exam.deadline)+900;await db.run('UPDATE auth_sessions SET expires_at=CASE WHEN expires_at<? THEN ? ELSE expires_at END WHERE id=? AND user_id=?',[expiry,expiry,hash(raw),user.id]);return reply(res,201,exam,{'Set-Cookie':`ecb_session=${raw}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.max(3600,expiry-exam.server_now)}${production?'; Secure':''}`});}return reply(res,201,exam);}
   match=path.match(/^\/api\/exams\/([a-f0-9-]{36})(?:\/(answers|submit))?$/);if(match){if(!match[2]&&method==='GET')return reply(res,200,await service.getExam(user,match[1]));if(match[2]==='answers'&&method==='PUT')return reply(res,200,await service.saveAnswer(user,match[1],body.answers));if(match[2]==='submit'&&method==='POST')return reply(res,200,await service.submitExam(user,match[1],body.answers||{}));}
   if(path==='/api/achievements'&&method==='GET')return reply(res,200,await achievements(service,user,Object.fromEntries(url.searchParams)));
   if(path==='/api/leader/portal'&&method==='GET')return reply(res,200,await leaderPortal(service,user,Object.fromEntries(url.searchParams)));
   if(path==='/api/leader/learning'&&method==='GET')return reply(res,200,await learningAnalytics(service,user,Object.fromEntries(url.searchParams)));
   if(path==='/api/leader'&&method==='GET')return reply(res,200,await service.leader(user,Object.fromEntries(url.searchParams)));
   match=path.match(/^\/api\/leader\/employees\/([a-f0-9-]{36})$/);if(match&&method==='GET')return reply(res,200,await service.employeeDetail(user,match[1]));
   if(path==='/api/leader/export'&&method==='GET'){const c=await service.config();assert(c.allow_export,403,'Ekspor belum diizinkan perusahaan.');const data=await service.leader(user,Object.fromEntries(url.searchParams));await service.audit(user,'shared_leader_export',`rows:${data.employees.length}`);const cell=v=>'"'+String(v??'').replace(/^(?:\s*[=+@-]|[\t\r\n])/,"'\u0024&").replaceAll('"','""')+'"';const csv=[['Nama','Departemen','Divisi','Jabatan','Level','HSK minggu ini','Work minggu ini','Menit minggu ini'],...data.employees.map(e=>[e.name,e.department,e.division,e.job_title,e.placement_level,e.weekly.hsk?.score,e.weekly.work?.score,e.weekly.minutes])].map(r=>r.map(cell).join(',')).join('\r\n');res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="ecb-report.csv"'});return res.end('\uFEFF'+csv);}
   match=path.match(/^\/api\/notifications\/([a-f0-9-]{36})\/read$/);if(match&&method==='POST'){service.employee(user);await db.run('UPDATE notifications SET read_at=? WHERE id=? AND user_id=?',[now(),match[1],user.id]);return reply(res,200,{ok:true});}
   throw new AppError(404,'Endpoint tidak ditemukan.');
  }catch(e){const status=e.status||500;if(status===500)console.error('Request failed:',e.code||e.name);reply(res,status,{error:status===500?'Kesalahan server. Coba kembali.':e.message});}
 });
 const sweep=setInterval(()=>service.expire().catch(e=>console.error('Expiry worker:',e.code||e.name)),15000);sweep.unref();server.on('close',()=>clearInterval(sweep));
 return {server,db,auth,service};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const app=await createApp();const port=Number(process.env.PORT||3000);app.server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`ECB ${process.env.DEMO_MODE==='true'?'DEMO':''} — http://127.0.0.1:${port}`));}
