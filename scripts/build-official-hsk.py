from pathlib import Path
from pypdf import PdfReader
import json,re,subprocess,hashlib
root=Path(__file__).resolve().parents[1]; out=root/'data/official-hsk';out.mkdir(exist_ok=True)
config=[(1,'H11007',20,20,0,15,17,0,3,[2,6],[7,10],[]),(2,'H20901',35,25,0,25,22,0,3,[2,7],[8,13],[]),(3,'H31001',40,30,10,35,30,15,5,[2,6],[7,12],[13,14]),(4,'H41001',45,40,15,30,40,25,5,[2,6],[7,14],[15,16]),(5,'H51001',45,45,10,30,45,40,5,[2,5],[6,15],[16,17]),(6,'H61001',50,50,1,35,50,45,5,[2,7],[8,18],[19,20])]
manifest=[]
for level,code,lc,rc,wc,lm,rm,wm,tm,lp,rp,wp in config:
 p=next((root/'SOAL HSK LENGKAP').rglob(code+'.pdf'));pages=[x.extract_text()or'' for x in PdfReader(p).pages];keypages=[x for x in pages if '卷答案' in re.sub(r'\s+','',x)]
 if level==1:
  keyfile=next(p.parent.glob('*答案.pdf'));keytext='\n'.join(x.extract_text()or'' for x in PdfReader(keyfile).pages)
 else:
  keyindex=next(i for i,x in enumerate(pages) if '卷答案' in re.sub(r'\s+','',x));keytext='\n'.join(pages[keyindex:])
 normalized=re.sub(r'(?<=\d)\s+(?=\d)','',keytext)
 keys={int(n):a for n,a in re.findall(r'(\d{1,3})\s*[．.、]\s*([A-F]{1,3}|[√×])',normalized)}
 assert set(range(1,lc+rc+1)).issubset(keys),(code,'missing keys',set(range(1,lc+rc+1))-set(keys))
 def choices(n):
  if (level==1 and (n<=5 or 21<=n<=25))or(level==2 and(n<=10 or 46<=n<=50))or(level==3 and 11<=n<=20)or(level==4 and n<=10):return ['√','×']
  if level==4 and 56<=n<=65:return ['ABC','ACB','BAC','BCA','CAB','CBA']
  if level==1:return list('ABC' if 6<=n<=10 or 16<=n<=20 else 'ABCDEF')
  if level==2:return list('ABCDE' if 16<=n<=20 else 'ABC' if 21<=n<=35 else 'ABCDEF')
  if level==3:return list('ABCDE' if 6<=n<=10 else 'ABC' if 21<=n<=40 or 61<=n<=70 else 'ABCDEF')
  if level==4:return list('ABCDEF' if 46<=n<=55 else 'ABCD')
  if level==6 and 71<=n<=80:return list('ABCDE')
  return list('ABCD')
 items=[]
 for n in range(1,lc+rc+wc+1):
  section='listening' if n<=lc else 'reading' if n<=lc+rc else 'writing'
  kind='writing' if section=='writing' else 'judgment' if choices(n)==['√','×'] else 'ordering' if level==4 and 56<=n<=65 else 'choice'
  item={'number':n,'section':section,'kind':kind,'choices':[] if section=='writing' else choices(n)}
  if section!='writing':assert keys[n] in item['choices'];item['key']=keys[n]
  else:
   remaining=keytext.split(str(n)+'．',1)
   item['reference']=remaining[1].split('\n',1)[0].strip() if len(remaining)>1 else ''
   item['weight']=30 if level==5 and n>=99 else 5 if level==5 else 6 if level==4 and n<=95 else 8 if level==4 else 100 if level==6 else 10
  items.append(item)
 paper={'id':code,'level':level,'source':str(p.relative_to(root)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'audio':str(p.with_suffix('.mp3').relative_to(root)).replace('\\','/'),'minutes':5+lm+tm+rm+wm,'counts':{'listening':lc,'reading':rc,'writing':wc},'total':lc+rc+wc,'max_score':300 if wc else 200,'items':items,'phases':[{'id':'preparation','minutes':5,'pages':[1],'section':None},{'id':'listening','minutes':lm,'pages':list(range(lp[0],lp[1]+1)),'section':'listening'},{'id':'transfer','minutes':tm,'pages':list(range(lp[0],lp[1]+1)),'section':'listening'},{'id':'reading','minutes':rm,'pages':list(range(rp[0],rp[1]+1)),'section':'reading'}],'writing_context':'\n'.join(pages[wp[0]-1:wp[1]]) if wp else '', 'writing_key_context':keytext.split('三、',1)[-1] if wc else ''}
 if wc:
  paper['writing_pages']=list(range(wp[0],wp[1]+1))
  if level==6:paper['phases'] +=[{'id':'writing_read','minutes':10,'pages':paper['writing_pages'],'section':None},{'id':'writing','minutes':35,'pages':[],'section':'writing'}]
  else:paper['phases'].append({'id':'writing','minutes':wm,'pages':paper['writing_pages'],'section':'writing'})
 duration_file=out/'audio-durations.json'
 if duration_file.exists():
  durations=json.loads(duration_file.read_text(encoding='utf8'));paper['audio_seconds']=durations[code];paper['phases'][1]['seconds']=durations[code]
 paper['total_seconds']=sum(phase.get('seconds',phase['minutes']*60) for phase in paper['phases'])
 target=out/code;target.mkdir(exist_ok=True)
 for page in range(1,(wp or rp)[-1]+1):
  image=target/(str(page)+'.jpg')
  if not image.exists():subprocess.run(['pdftoppm','-f',str(page),'-l',str(page),'-scale-to','1400','-jpeg','-jpegopt','quality=83','-singlefile',str(p),str(target/str(page))],check=True,capture_output=True)
 manifest.append(paper);print(code,paper['total'],paper['minutes'],'minutes',len(list(target.glob('*.jpg'))),'pages')
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
