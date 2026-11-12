"""Restore source-only section examples; never infer answer keys or translations.
Example snippets retain exact PDF glyphs/pinyin/answer box, not an entire paper page.
"""
from pathlib import Path
import json,re,hashlib
import pypdfium2 as pdfium
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/'data/official-hsk/structured/content.json'
data=json.loads(PATH.read_text(encoding='utf8'))
papers=json.loads((ROOT/'artifacts/active-papers.json').read_text(encoding='utf8'))
HAN=re.compile(r'[\u3400-\u9fff]')
report=[]
def rows(words):
 out=[]
 for w in sorted(words,key=lambda w:(round(w['top']/3),w['x0'])):
  if not out or abs(out[-1][0]-w['top'])>5:out.append([w['top'],[]])
  out[-1][1].append(w)
 return [(y,sorted(ws,key=lambda w:w['x0'])) for y,ws in out]
def clean(words):
 return [w for w in words if not (re.fullmatch(r'[a-z.]',w['text']) and w['bottom']-w['top']>20)]
def text(ws):return ' '.join(w['text'] for w in sorted(ws,key=lambda w:w['x0']))
for paper in papers:
 code=paper['id'];layout_path=ROOT/'artifacts/hsk-layout'/f'{code}.json'
 if code not in data or not layout_path.exists():continue
 layout=json.loads(layout_path.read_text(encoding='utf8'));src=ROOT/paper['source']
 assert hashlib.sha256(src.read_bytes()).hexdigest()==data[code]['source_sha256'],code
 doc=pdfium.PdfDocument(src);rendered={};events=[];anchors={};native={};examples=[]
 for page in layout['pages']:
  pn=page['page'];ws=clean(page['words']);rs=rows(ws)
  for y,row in rs:
   value=text(row);compact=re.sub(r'\s','',value)
   if re.search(r'第[一二三四五六七八九十]+部分',compact):
    events.append((pn*10000+y,value))
  for item in paper['items']:
   n=item['number']
   candidates=[w for w in ws if re.match(r'^'+str(n)+r'[．.、]',w['text']) and w['x0']<page['width']*(.95 if item['section']=='writing' else .7 if paper['level']>=5 else .32) and w['top']>45]
   if candidates and n not in anchors:anchors[n]=(pn,candidates[0])
  for e in [w for w in ws if re.match(r'^例如(?:[:：]|$)',w['text']) and w['x0']<150]:
   part_top=max([y for position,value in events if int(position//10000)==pn for y in [position-pn*10000] if y<e['top']],default=0)
   previous=[w for w in ws if part_top<w['top']<e['top'] and re.match(r'^\d{1,3}[．.、](?!\d)',w['text']) and w['x0']<page['width']*.32]
   if previous:continue
   # The next numbered question, after its pinyin line, bounds the example.
   following=[w for w in ws if w['top']>e['top']+5 and re.match(r'^\d{1,3}[．.、](?!\d)',w['text']) and w['x0']<page['width']*.4]
   if not following:continue
   stop=min(w['top'] for w in following)
   py=[y for y,row in rs if e['bottom']<y<stop and any(re.search(r'[A-Za-zÀ-ɏ]',w['text']) and len(w['text'])>1 for w in row)]
   bottom=min(py,default=stop)-2
   top=max(40,e['top']-22)
   # Include original example illustrations if they belong to its row.
   for im in page['images']:
    try:
     it=float(im['top']);ib=float(im['bottom'])
     if top-35<it<e['bottom']+8 and ib<bottom+5:top=min(top,it-2)
    except (KeyError,ValueError):pass
   if bottom<=top:continue
   ident=20000+len(examples);rect=[65,top,page['width']-45,bottom]
   if pn not in rendered:rendered[pn]=doc[pn-1].render(scale=2).to_pil()
   rendered[pn].crop(tuple(round(v*2) for v in rect)).save(ROOT/'data/official-hsk/structured'/f'{code}-{ident}.webp','WEBP',quality=90)
   has_images=any(top<float(im.get('bottom',0)) and float(im.get('top',9999))<bottom for im in page['images'])
   sample_lines=[{'text':text(row),'pinyin':not bool(HAN.search(text(row)))} for y,row in rs if top<=y<bottom and any(HAN.search(w['text']) or len(w['text'])>1 for w in row)]
   examples.append({'position':pn*10000+e['top'],'figure':ident,'page':pn,'rect':list(rect),'lines':sample_lines,'has_images':has_images})
 for item in paper['items']:
  n=item['number'];c=data[code]['items'][str(n)]
  if n not in anchors:
   group=re.findall(r'\d+',c.get('group',{}).get('id','')) if c.get('group') else []
   candidates=[]
   for page in layout['pages']:
    for w in clean(page['words']):
     compact=re.sub(r'\s','',w['text'])
     grouped=len(group)==2 and re.search(r'(?<!\d)'+group[0]+r'[-－—–]'+group[1]+r'(?!\d)',compact)
     writing=n==101 and item['section']=='writing' and '101' in compact and page['page'] in paper.get('writing_pages',[])
     standalone=compact==str(n) and w['x0']<page['width']*.32 and 200<w['top']<page['height']*.9
     if grouped or writing or standalone:candidates.append((page['page'],w))
   if candidates:anchors[n]=candidates[0]
   if code=='H11007' and n==9:
    page=next(p for p in layout['pages'] if p['page']==4)
    anchors[n]=(4,next(w for w in page['words'] if w['text']=='9' and w['x0']<150))
  a=anchors.get(n)
  # Generated Indonesian helpers are not part of an official source question.
  c.pop('instruction',None)
  if re.search(r'\b(?:Pilih|Dengarkan|Tuliskan|Tulis|Bacalah|Susun|jawaban|bagian kosong)\b',c['prompt']):c['prompt']=''
  c['prompt']=re.sub(r'(?m)^\s*[?？](?:\s*[?？])+\s*$','',c['prompt']).strip()
  if paper['level']==6 and n==101 and c.get('reading_context'):
   rc=c['reading_context'];rules=list(re.finditer(r'[（(][1-9][）)]',rc))
   if rules:
    end=rc.find('。',rules[-1].start())
    if end>=0:c['prompt']=rc[:end+1]
  c.pop('example_figures',None);c.pop('source_examples',None)
  if c.get('group'):c['group']['label']='—'.join(re.findall(r'\d+',c['group']['id']))
  if paper['level']<=2 and c.get('context') and '例如' in c['context']:c['context']=None
  if a:
   pn,anchor=a;pos=pn*10000+anchor['top'];ev=[v for v in events if v[0]<pos];part=ev[-1] if ev else None
   if part:
    c['instruction']=part[1]
    ex=[v for v in examples if part[0]<v['position']<pos]
    if ex:
     c['example_figures']=[v['figure'] for v in ex]
     c['source_examples']=[{k:v[k] for k in ['figure','lines','has_images']} for v in ex]
   if paper['level']<=2:
    page=next(p for p in layout['pages'] if p['page']==pn)
    line=[w for w in clean(page['words']) if anchor['top']-23<w['top']<anchor['top']-3 and w['x0']>=anchor['x0']+15 and not HAN.search(w['text'])]
    line=[w for w in line if re.search(r'[A-Za-zÀ-ɏ]',w['text']) and not re.fullmatch(r'[A-F]',w['text'])]
    if line:c['pinyin']=text(line)
  report.append({'code':code,'number':n,'source_section':c.get('instruction'),'examples':c.get('example_figures',[]),'anchor_found':bool(a)})
 doc.close()
PATH.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'artifacts/source-example-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'items':len(report),'with_examples':sum(bool(r['examples']) for r in report),'unlocated':sum(not r['anchor_found'] for r in report)}))
