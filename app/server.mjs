import http from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {openDatabase,ROOT} from './db.mjs';
import {Auth} from './auth.mjs';
import {Service} from './service.mjs';
import {assert,AppError,publicProfile,now} from './domain.mjs';
import {validateProductionConfig} from './production-config.mjs';
import {clientIp} from './client-ip.mjs';
export async function createApp(options={}){
 const production=process.env.NODE_ENV==='production';
 validateProductionConfig();
 const db=options.db||await openDatabase();if(options.migrate!==false)await db.migrate();const demo=options.demo??process.env.DEMO_MODE==='true',auth=new Auth(db,{demo,...options.auth}),service=new Service(db,{demo,...options.service});
 const reply=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...headers});res.end(JSON.stringify(data));};
 const server=http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");if(production)res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  try{const origin=process.env.APP_ORIGIN||`http://127.0.0.1:${server.address()?.port||3000}`,url=new URL(req.url,origin),path=url.pathname,method=req.method;const raw=(req.headers.cookie||'').match(/(?:^|;\s*)ecb_session=([a-f0-9]{64})(?:;|$)/)?.[1];
   if(path==='/api/health')return reply(res,200,{ok:true,mode:demo?'DEMO':'production_content',database:db.kind});
   if(!path.startsWith('/api/')){assert(['GET','HEAD'].includes(method),405,'Metode tidak diizinkan.');const allowed={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/i18n.js':'i18n.js','/style.css':'style.css','/logo.png':'logo.png'};const file=allowed[path];assert(file,404,'Halaman tidak ditemukan.');const data=await readFile(resolve(ROOT,'public',file));res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'}[extname(file)]});return res.end(method==='HEAD'?undefined:data);}
   const ip=clientIp(req,process.env.TRUST_PROXY_HOPS||0);let body={};if(!['GET','HEAD'].includes(method)){assert(req.headers.origin===origin,403,'Origin tidak diizinkan.');assert((req.headers['content-type']||'').startsWith('application/json'),415,'Gunakan JSON.');let data='';for await(const chunk of req){data+=chunk;assert(Buffer.byteLength(data)<=32768,413,'Request terlalu besar.');}try{body=JSON.parse(data||'{}');}catch{throw new AppError(400,'JSON tidak valid.');}assert(body&&typeof body==='object'&&!Array.isArray(body),400,'Objek JSON wajib.');}
   if(path==='/api/meta'&&method==='GET')return reply(res,200,{demo,source_content:service.sourceContent,curriculum:service.sourceContent?'HSK3.0':'fixture',departments:await db.all('SELECT * FROM departments ORDER BY name'),timezone:'Asia/Makassar'});
   if(path==='/api/register'&&method==='POST'){assert(!await auth.session(raw),403,'Registrasi hanya tersedia tanpa sesi portal.');return reply(res,201,await auth.register(body,ip));}
   if(path==='/api/login'&&method==='POST'){const login=await auth.login(body,ip);await service.audit(login.user,login.user.role==='leader'?'shared_leader_login':'employee_login');return reply(res,200,{user:login.user,csrf:login.csrf},{'Set-Cookie':`ecb_session=${login.raw}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${production?'; Secure':''}`});}
   if(path==='/api/forgot'&&method==='POST')return reply(res,200,await auth.forgot(body,ip));
   if(path==='/api/reset'&&method==='POST')return reply(res,200,await auth.reset(body,ip));
   const user=await auth.session(raw);assert(user,401,'Sesi berakhir. Silakan masuk.');if(!['GET','HEAD'].includes(method))assert(req.headers['x-csrf-token']===user.csrf,403,'Token keamanan tidak valid.');
   if(path==='/api/me'&&method==='GET')return reply(res,200,{user:publicProfile(user,true),csrf:user.csrf,demo});
   if(path==='/api/logout'&&method==='POST'){await auth.logout(raw);return reply(res,200,{ok:true},{'Set-Cookie':'ecb_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
   if(path==='/api/dashboard'&&method==='GET')return reply(res,200,await service.dashboard(user));
   const vocabularyMatch=path.match(/^\/api\/vocabulary\/([a-f0-9-]{36})\/progress$/);if(vocabularyMatch&&method==='PUT'){assert(Object.keys(body).every(k=>k==='status'),400,'Field status tidak valid.');return reply(res,200,await service.vocabularyProgress(user,vocabularyMatch[1],body.status));}
   if(path==='/api/profile'&&method==='PATCH')return reply(res,200,await service.updateProfile(user,body));
   if(path==='/api/packages'&&method==='GET')return reply(res,200,await service.packages(user));
   if(path==='/api/content-status'&&method==='GET')return reply(res,200,await service.contentStatus(user));
   if(path==='/api/library'&&method==='GET')return reply(res,200,await service.library());
   let assetMatch=path.match(/^\/api\/library\/([a-f0-9-]{36})(\/file)?$/);
   if(assetMatch&&method==='GET'){
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
   if(path==='/api/exams'&&method==='POST')return reply(res,201,await service.startExam(user,body));
   match=path.match(/^\/api\/exams\/([a-f0-9-]{36})(?:\/(answers|submit))?$/);if(match){if(!match[2]&&method==='GET')return reply(res,200,await service.getExam(user,match[1]));if(match[2]==='answers'&&method==='PUT')return reply(res,200,await service.saveAnswer(user,match[1],body.answers));if(match[2]==='submit'&&method==='POST')return reply(res,200,await service.submitExam(user,match[1],body.answers||{}));}
   if(path==='/api/rankings'&&method==='GET'){const at=url.searchParams.has('at')?Number(url.searchParams.get('at')):now();assert(Number.isFinite(at)&&at>=0&&at<=4102444800,400,'Tanggal tidak valid.');return reply(res,200,await service.rankings(url.searchParams.get('period')||'weekly',at,{track:url.searchParams.get('track'),level:url.searchParams.get('level')}));}
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
