from pathlib import Path
from pypdf import PdfReader
import re,json,hashlib,subprocess,concurrent.futures,os
ROOT=Path(__file__).resolve().parents[1]; SOURCE=Path(os.environ.get('HSK_SOURCE_ROOT',str(ROOT))); OUT=ROOT/'data/official-hsk'; CACHE=ROOT/'artifacts/hsk-text';CACHE.mkdir(parents=True,exist_ok=True)
selection=json.loads((OUT/'selection-plan.json').read_text(encoding='utf8')); selected={p['id']:p for p in selection['papers']}
overrides=json.loads((OUT/'verified-source-overrides.json').read_text(encoding='utf8'))
previous=json.loads((OUT/'bank.json').read_text(encoding='utf8')) if (OUT/'bank.json').exists() else []
legacy=json.loads((OUT/'manifest.json').read_text(encoding='utf8')); groups={};report=[];bank=[]
for p in (SOURCE/'SOAL HSK LENGKAP').rglob('*.pdf'):
 code=p.stem.removesuffix('_soal_dan_kunci')
 if code in selected:groups.setdefault(code,[]).append(p)
def texts(p):
 h=hashlib.sha256(p.read_bytes()).hexdigest();c=CACHE/(h+'.json')
 if c.exists():return json.loads(c.read_text(encoding='utf8'))
 v=[x.extract_text()or'' for x in PdfReader(p).pages];c.write_text(json.dumps(v,ensure_ascii=False),encoding='utf8');return v
def duration(p):
 data=p.read_bytes();i=0;seconds=0;frames=0
 if data[:3]==b'ID3':i=10+sum((data[6+j]&127)<<(7*(3-j)) for j in range(4))
 while i+4<len(data):
  h=int.from_bytes(data[i:i+4],'big');v=(h>>19)&3;l=(h>>17)&3;b=(h>>12)&15;r=(h>>10)&3
  if h>>21!=2047 or v==1 or l!=1 or b in (0,15) or r==3:i+=1;continue
  sr=[44100,48000,32000][r]//(1 if v==3 else 2 if v==2 else 4);br=([0,32,40,48,56,64,80,96,112,128,160,192,224,256,320] if v==3 else [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160])[b]*1000
  size=(144 if v==3 else 72)*br//sr+((h>>9)&1)
  if i+size>len(data):break
  seconds+=(1152 if v==3 else 576)/sr;frames+=1;i+=size
 assert frames>100,'Audio tidak dapat divalidasi'
 return round(seconds,2)
def choices(level,n):
 if level==1 and(n<=5 or 21<=n<=25) or level==2 and(n<=10 or 46<=n<=50) or level==3 and 11<=n<=20 or level==4 and n<=10:return ['√','×']
 if level==4 and 56<=n<=65:return ['ABC','ACB','BAC','BCA','CAB','CBA']
 if level==1:return list('ABC' if 6<=n<=10 or 16<=n<=20 else 'ABCDEF')
 if level==2:return list('ABCDE' if 16<=n<=20 else 'ABC' if 21<=n<=35 else 'ABCDEF')
 if level==3:return list('ABCDE' if 6<=n<=10 else 'ABC' if 21<=n<=40 or 61<=n<=70 else 'ABCDEF')
 if level==4:return list('ABCDEF' if 46<=n<=55 else 'ABCD')
 if level==6 and 71<=n<=80:return list('ABCDE')
 return list('ABCD')
for code,files in sorted(groups.items()):
 try:
  hashes={hashlib.sha256(p.read_bytes()).hexdigest() for p in files};assert len(hashes)==1,'Duplikasi kode dengan isi berbeda; perlu pemeriksaan manual'
  p=files[0];level=int(code[1]);pages=texts(p);compact=[re.sub(r'\s+','',t) for t in pages];front=compact[0]
  assert code in front,'Sampul tidak memiliki kode teks yang cocok'
  counts=[];minutes=[]
  for section in ['听力','阅读']+(['书写'] if level>=3 else []):
   m=re.search(section+r'[（(](\d+)题[，,]约?(\d+)分钟',front);assert m,'Jumlah/waktu '+section+' tidak dapat diverifikasi';counts.append(int(m[1]));minutes.append(int(m[2]))
  if level<3:counts.append(0);minutes.append(0)
  assert tuple(counts)=={1:(20,20,0),2:(35,25,0),3:(40,30,10),4:(45,40,15),5:(45,45,10),6:(50,50,1)}[level],'Struktur berbeda; perlu pemetaan manual'
  tm=re.search(r'听力结束后[，,]有(\d+)分钟',front);assert tm and re.search(r'填写个人信息时间5分钟',front),'Waktu persiapan/pemindahan belum terverifikasi'
  transfer=int(tm[1]);override=overrides.get(code);keyidx=next((i for i,t in enumerate(compact) if '卷答案' in t),None);keytext=''
  if override:
   assert override['sha256']==next(iter(hashes)),'Sumber berubah; transkripsi kunci harus diverifikasi ulang'
   keyidx=override['key_page_index'];keytext=override['key_text']
  elif keyidx is not None:keytext='\n'.join(pages[keyidx:])
  else:
   k=next((x for x in p.parent.glob('*.pdf') if '答案' in x.name and x!=p),None);assert k,'Kunci sumber tidak ditemukan';keytext='\n'.join(texts(k))
  norm=re.sub(r'(?<=\d)\s+(?=\d)','',keytext);keys={int(n):a for n,a in re.findall(r'(\d{1,3})\s*[．.、]\s*([A-F]{1,3}|[√×])',norm)};lc,rc,wc=counts
  if 'Salinan teks' in keytext:keys.update({int(n):a for n,a in re.findall(r'(?<!\d)(\d{1,3})[ \t]+([A-F]{1,3}|[√×])(?=\s|$)',keytext)})
  assert set(range(1,lc+rc+1)).issubset(keys),'Kunci objektif belum lengkap'
  def section_start(marker):return next(i for i,t in enumerate(compact) if marker in t[:220] and '卷答案' not in t and '听力材料' not in t[:220])
  ls=section_start('一、听力');rs=section_start('二、阅读');ws=section_start('三、书写') if wc else None
  assert not wc or ws is not None and (keyidx is None or ws<keyidx),'Naskah Writing tidak ditemukan sebelum halaman kunci; perlu lampiran Writing sesuai kode'
  transcript=next((i for i,t in enumerate(compact) if '卷听力材料' in t[:100]),None);stops=[x for x in [transcript,keyidx] if x is not None];assert stops,'Batas soal dengan kunci/transkrip belum jelas';end=min([x for x in stops if x>rs]);assert 0<ls<rs<end and (not wc or rs<ws<end),'Urutan bagian tidak konsisten'
  lp=list(range(ls+1,rs+1));rp=list(range(rs+1,(ws if wc else end)+1));wp=list(range(ws+1,end+1)) if wc else []
  assert all('卷答案' not in compact[i-1] and '卷听力材料' not in compact[i-1][:100] for i in lp+rp+wp),'Kunci tercampur halaman soal'
  audio=p.with_name(code+'.mp3');assert audio.exists(),'Audio belum ada';secs=duration(audio);assert minutes[0]*30<secs<minutes[0]*105,'Durasi audio tidak wajar'
  items=[]
  for n in range(1,sum(counts)+1):
   section='listening' if n<=lc else 'reading' if n<=lc+rc else 'writing';cs=choices(level,n);item={'number':n,'section':section,'kind':'writing' if section=='writing' else 'judgment' if cs==['√','×'] else 'ordering' if level==4 and 56<=n<=65 else 'choice','choices':[] if section=='writing' else cs}
   if section!='writing':assert keys[n] in cs,'Kunci tidak cocok jenis soal';item['key']=keys[n]
   else:
    m=re.search(str(n)+r'[．.、]\s*([^\n]*)',keytext);item['reference']=m[1].strip() if m else '';item['weight']=30 if level==5 and n>=99 else 5 if level==5 else 6 if level==4 and n<=95 else 8 if level==4 else 100 if level==6 else 10
   items.append(item)
  phases=[{'id':'preparation','minutes':5,'pages':[1],'section':None},{'id':'listening','minutes':minutes[0],'seconds':secs,'pages':lp,'section':'listening'},{'id':'transfer','minutes':transfer,'pages':lp,'section':'listening'},{'id':'reading','minutes':minutes[1],'pages':rp,'section':'reading'}]
  if wc:phases+=([{'id':'writing_read','minutes':10,'pages':wp,'section':None},{'id':'writing','minutes':35,'pages':[],'section':'writing'}] if level==6 else [{'id':'writing','minutes':minutes[2],'pages':wp,'section':'writing'}])
  paper={'id':code,'level':level,'source':str(p.relative_to(SOURCE)).replace('\\','/'),'sha256':next(iter(hashes)),'audio':str(audio.relative_to(SOURCE)).replace('\\','/'),'audio_sha256':hashlib.sha256(audio.read_bytes()).hexdigest(),'audio_seconds':secs,'minutes':5+sum(minutes)+transfer,'total_seconds':sum(x.get('seconds',x['minutes']*60) for x in phases),'counts':dict(zip(['listening','reading','writing'],counts)),'total':sum(counts),'max_score':300 if wc else 200,'items':items,'phases':phases,'writing_pages':wp,'writing_context':'\n'.join(pages[ws:end]) if wc else '', 'writing_key_context':keytext.split('三、',1)[-1] if wc else '', 'page_numbers':{str(page):sorted({int(n) for n in re.findall(r'(?<![0-9A-Za-z])(\d{1,3})\s*[．.、]',pages[page-1]) if 1<=int(n)<=sum(counts)} | {n for a,b in re.findall(r'(\d{1,3})\s*[-–]\s*(\d{1,3})',pages[page-1]) if 1<=int(a)<=int(b)<=sum(counts) and int(b)-int(a)<20 for n in range(int(a),int(b)+1)}) for page in lp+rp+wp},'question_last_page':end,'validated':'source-structure-keys-audio-v1'}
  paper.update(difficulty=selected[code]['difficulty'],reserved=selected[code]['purpose']=='promotion');bank.append(paper);report.append({'id':code,'status':'validated','pages':end})
 except Exception as e:report.append({'id':code,'status':'legacy_retained' if any(x['id']==code for x in legacy) else 'excluded','reason':str(e)})
# Preserve every legacy paper byte-for-byte for existing sessions. New bank is separate.
legacyids={p['id'] for p in legacy}
def render(p):
 import pypdfium2 as pdfium
 target=OUT/p['id'];target.mkdir(exist_ok=True);last=p['question_last_page'];doc=None
 for page in range(1,last+1):
  image=target/(str(page)+'.jpg')
  if not image.exists():
   if doc is None:doc=pdfium.PdfDocument(str(SOURCE/p['source']))
   pg=doc[page-1];scale=1400/max(pg.get_size());pg.render(scale=scale).to_pil().convert('RGB').save(image,quality=80)
 return p['id']
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
 for code in pool.map(render,[] if os.environ.get('HSK_VALIDATE_ONLY') else bank):print(code,flush=True)
if not os.environ.get('HSK_VALIDATE_ONLY'):bank += [p for p in previous if not any(n['id']==p['id'] for n in bank)]
(OUT/('bank-candidate.json' if os.environ.get('HSK_VALIDATE_ONLY') else 'bank.json')).write_text(json.dumps(bank,ensure_ascii=False,indent=2),encoding='utf8');(OUT/'bank-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'validated':len(bank),'excluded':sum(r['status']=='excluded' for r in report),'levels':{n:sum(p['level']==n for p in bank) for n in range(1,7)}}),flush=True)
