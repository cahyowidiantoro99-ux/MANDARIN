"""Convert verified HSK PDFs into reflowable text and original illustration objects.
Run after layout audit. Source hashes and review report protect published content.
"""
from pathlib import Path
import json,re,io,hashlib,os
import pdfplumber
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];CACHE=ROOT/'artifacts/hsk-layout';OUT=ROOT/'data/official-hsk/structured'
HAN=re.compile(r'[\u3400-\u9fff]'); NUM=re.compile(r'^(\d{1,3})[．.、](.*)$'); LETTER=re.compile(r'^([A-F])(?:[．.、])?(.*)$')
# active-papers.json is an export of archivePapers from app/hsk-bank.mjs.
bank=json.loads((ROOT/'artifacts/active-papers.json').read_text(encoding='utf8'))
previous=json.loads((OUT/'content.json').read_text(encoding='utf8'));only=set(filter(None,os.environ.get('HSK_CODES','').split(',')));results={k:v for k,v in previous.items() if k not in only} if only else {k:v for k,v in previous.items() if k in ['H11112','H31002']};report=[]
if only:bank=[p for p in bank if p['id'] in only]
def lines(words,latin=True):
 rows=[]
 for w in sorted(words,key=lambda w:(round(w['top']/3),w['x0'])):
  if not rows or abs(w['top']-rows[-1][0])>5:rows.append([w['top'],[]])
  rows[-1][1].append(w)
 text=[]
 for _,row in rows:
  ordered=sorted(row,key=lambda w:w['x0']);value=''
  for index,w in enumerate(ordered):
   gap=w['x0']-ordered[index-1]['x1'] if index else 0
   value+=('　' if gap>18 else ' ' if index else '')+w['text']
  if not latin:value=re.sub(r'[A-Za-zÀ-ɏ\u0300-\u036f]+','',value)
  value=re.sub(r'(?<=[\u3400-\u9fff])[ \t]+(?=[\u3400-\u9fff])','',value).strip()
  if re.fullmatch(r'\d{5}\s*-\s*\d+',value):continue
  if value and (latin or HAN.search(value) or re.search(r'\d',value) or re.search(r'[ABCDEF]',value)):text.append(value)
 return '\n'.join(text)
def image_options(images):return [{'value':chr(65+i),'image':im['id']} for i,im in enumerate(images)]
def partition(level,n):
 bounds={1:[(1,5),(6,10),(11,15),(16,20),(21,25),(26,30),(31,35),(36,40)],2:[(1,10),(11,15),(16,20),(21,35),(36,40),(41,45),(46,50),(51,55),(56,60)],4:[(46,50),(51,55)],3:[(1,5),(6,10),(11,20),(21,30),(31,40),(41,45),(46,50),(51,55),(56,60),(61,70),(71,75),(76,80)]}
 return next((x for x in bounds.get(level,[]) if x[0]<=n<=x[1]),None)
def sorted_images(images):
 return sorted(images,key=lambda im:(round((im['top']+im['bottom'])/2/45),im['x']))
for paper in bank:
 code=paper['id']; cache=CACHE/(code+'.json')
 if code in results:report.append({'id':code,'status':'pilot_verified','items':paper['total']});continue
 if not cache.exists():continue
 if code=='H11007':
  results.update(json.loads((OUT/'legacy-manual.json').read_text(encoding='utf8')));report.append({'id':code,'status':'manual_verified','items':40});continue
 try:
  doc=json.loads(cache.read_text(encoding='utf8'));pages={p['page']:p for p in doc['pages']};items={};figures=[];assets={};anchors={};section_for={}
  for phase in paper['phases']:
   if phase['id']=='transfer':continue
   for pn in phase['pages']:section_for[pn]=phase.get('section')
  # Reconstruct photographs split into strips in the original PDF.
  # Only native image objects are assembled; no page screenshot is used.
  rawdir=ROOT/'artifacts/hsk-raw-images'/code;rawdir.mkdir(parents=True,exist_ok=True)
  original_count=sum(len(page['images']) for pn,page in pages.items() if pn!=1)
  for original_id in range(1,original_count+1):
   target=rawdir/(str(original_id)+'.webp')
   if not target.exists():
    original=OUT/(code+'-'+str(original_id)+'.webp')
    if original.exists():target.write_bytes(original.read_bytes())
    else:
     with pdfplumber.open(doc['source']) as source:
      count=0
      for page_no in pages:
       if page_no==1:continue
       for meta in source.pages[page_no-1].images:
        count+=1
        if count!=original_id:continue
        raw=meta['stream'].get_data()
        try:img=Image.open(io.BytesIO(raw))
        except Exception:img=Image.frombytes('RGB' if 'RGB' in str(meta['colorspace']) else 'L',meta['srcsize'],raw)
        img.convert('RGB').save(target,'WEBP',quality=90)
  raw_id=0
  for pn,page in pages.items():
   section=section_for.get(pn)
   if pn==1:continue
   # Remove the rotated website watermark and document footer by position.
   page['words']=[w for w in page['words'] if w['top']<page['height']*.93 and w['x0']<page['width']*.99 and not(re.fullmatch(r'[a-z.]',w['text']) and w['x0']>page['width']*.65)]
   cleaned=[]
   for word in page['words']:
    word=dict(word)
    if paper['level']>=3 and section!='writing':word['text']=re.sub(r'[a-z]','',word['text']) if HAN.search(word['text']) or re.fullmatch(r'[a-z]*[A-F][a-z]*',word['text']) else word['text']
    if re.fullmatch(r'\d{1,3}',word['text']):
     dot=next((v for v in page['words'] if re.fullmatch(r'[．.、]',v['text']) and abs(v['top']-word['top'])<6 and 0<=v['x0']-word['x1']<8),None)
     if dot:word['text']+='．';word['x1']=dot['x1']
    cleaned.append(word)
   for word in cleaned:
    if re.fullmatch(r'[A-F]',word['text']):word['x1']=word['x0']+8
   page['words']=cleaned
   valid={i['number'] for i in paper['items'] if i['section']==section}
   for w in page['words']:
    m=NUM.match(w['text'])
    if m and not (w['text'].startswith(m[1]+'.') and re.match(r'^\d',m[2])) and int(m[1]) in valid and w['x0']<page['width']*(.95 if section=='writing' else .7 if paper['level']>=5 else .32) and w['top']>45:
     n=int(m[1]);anchors.setdefault(n,{'page':pn,**w,'suffix':m[2]})
   objects=[]
   for meta in page['images']:
    raw_id+=1;rawfile=rawdir/(str(raw_id)+'.webp')
    if not rawfile.exists():rawfile.write_bytes((OUT/(code+'-'+str(raw_id)+'.webp')).read_bytes())
    native=Image.open(rawfile).convert('RGB')
    ratio=(native.width/native.height)/((float(meta['x1'])-float(meta['x0']))/(float(meta['bottom'])-float(meta['top'])))
    if ratio>3 or ratio<1/3:continue
    im={'image':native,'x':float(meta['x0']),'top':float(meta['top']),'bottom':float(meta['bottom']),'right':float(meta['x1'])}
    merged=next((g for g in objects if abs(g['x']-im['x'])<1.5 and abs(g['right']-im['right'])<1.5 and min(abs(g['bottom']-im['top']),abs(im['bottom']-g['top']))<1.5),None)
    if merged:
     merged['parts'].append(im);merged['top']=min(merged['top'],im['top']);merged['bottom']=max(merged['bottom'],im['bottom'])
    else:objects.append({**im,'parts':[im]})
   for obj in objects:
    fid=len(figures)+1
    factor=max(part['image'].width/(part['right']-part['x']) for part in obj['parts'])
    canvas=Image.new('RGB',(max(1,round((obj['right']-obj['x'])*factor)),max(1,round((obj['bottom']-obj['top'])*factor))),'white')
    for part in obj['parts']:
     im=part['image'].resize((max(1,round((part['right']-part['x'])*factor)),max(1,round((part['bottom']-part['top'])*factor))))
     canvas.paste(im,(round((part['x']-obj['x'])*factor),round((part['top']-obj['top'])*factor)))
    canvas.save(OUT/(code+'-'+str(fid)+'.webp'),'WEBP',quality=90)
    figures.append({'id':fid,'page':pn,'x':obj['x'],'top':obj['top'],'bottom':obj['bottom']})
  if code=='H10902':
   duplicate=next(w for w in pages[8]['words'] if w['text']=='28．' and w['top']>670)
   anchors[29]={'page':8,**duplicate,'suffix':''}
  for n,a in anchors.items():a['number']=n
  ranges=[]
  for pn,page in pages.items():
   for w in page['words']:
    match=re.fullmatch(r'(\d{1,3})[-－—–](\d{1,3})[．.、]?',w['text'])
    if match and w['x0']<page['width']*.35 and w['top']>55:
     start,end=map(int,match.groups())
     if 0<end-start<=4 and start in [i['number'] for i in paper['items']] and end<=paper['total']:
      first=anchors.get(start)
      if first and first['page']==pn and first['top']>w['top']+15:
       region=[v for v in page['words'] if v['top']>w['bottom']+2 and v['top']<first['top']-2]
       context=lines(region,False)
       if len(HAN.findall(context))>35:ranges.append({'start':start,'end':end,'page':pn,'top':w['top'],'context':context})
     if paper['level']==6 and 0<end-start<=4 and 71<=start<=80 and 71<=end<=80:
      letter_top=min([v['top'] for v in page['words'] if re.match(r'^[A-E](?:$|[\u3400-\u9fff])',v['text'])],default=page['height']*.93)
      context=lines([v for v in page['words'] if w['bottom']+2<v['top']<letter_top-2],False)
      ranges.append({'start':start,'end':end,'page':pn,'top':w['top'],'context':context})
      for number in range(start,end+1):anchors[number]={'page':pn,'top':letter_top,'bottom':letter_top,'x0':0,'x1':0,'text':'','suffix':'','number':number,'synthetic':True}
  # Shared reading passages may number the range once and mark its questions with stars.
  for pn,page in pages.items():
   range_words=[]
   for w in page['words']:
    match=re.fullmatch(r'(\d{1,3})[-－—–](\d{1,3})[．.、]',w['text'])
    if match:range_words.append((w,*map(int,match.groups())))
   for marker,start,end in range_words:
    if start in anchors or end>paper['total'] or end-start>4:continue
    stop=min([v['top'] for v,_,_ in range_words if v['top']>marker['top']],default=page['height']*.93)
    stars=[w for w in page['words'] if w['text'].startswith('★') and marker['top']<w['top']<stop]
    if len(stars)!=end-start+1:continue
    context=lines([w for w in page['words'] if marker['bottom']<w['top']<stars[0]['top']-2],False)
    ranges.append({'start':start,'end':end,'page':pn,'top':marker['top'],'context':context})
    for n,star in zip(range(start,end+1),stars):anchors[n]={'page':pn,**star,'suffix':star['text'][1:],'number':n,'synthetic':True}
  if paper['level']==6:
   anchors[101]={'page':paper['writing_pages'][0],'top':50,'bottom':50,'x0':0,'text':'','suffix':'','number':101,'synthetic':True}

  def extract_options(words):
   letters=[]
   for w in words:
    m=LETTER.match(w['text'])
    if m and (not m[2] or HAN.search(m[2])):letters.append({**w,'value':m[1],'suffix':m[2]})
   choices=[]
   for l in letters:
    if any(o['value']==l['value'] for o in choices):continue
    row=[x for x in letters if abs(x['top']-l['top'])<8 and x['x0']>l['x0']+2]
    right=min([x['x0'] for x in row],default=10000)
    below=[x for x in letters if x['top']>l['top']+8 and abs(x['x0']-l['x0'])<35]
    bottom=min([x['top'] for x in below],default=max([w['bottom'] for w in words],default=l['bottom'])+1)
    selected=[w for w in words if w is not l and w['x0']>=l['x1']-1 and w['x0']<right-1 and w['top']>=l['top']-8 and w['top']<bottom-2]
    text=(l['suffix']+' '+lines(selected,False)).strip()
    text=re.sub(r'[ \t]+',' ',text).strip()
    if text:choices.append({'value':l['value'],'text':text})
   return sorted(choices,key=lambda o:o['value'])
  shared={}
  # Shared picture/word pools are keyed by the source's fixed part ranges.
  for item in paper['items']:
   n=item['number'];a=anchors.get(n);part=partition(paper['level'],n)
   if not a or not part:continue
   key=str(part);pn=a['page'];page=pages[pn];first=min([v['top'] for k,v in anchors.items() if v['page']==pn and part[0]<=k<=part[1]],default=page['height'])
   is_image=(paper['level']==1 and part[0] in [11,26]) or(paper['level']==2 and part[0] in [11,16,36])or(paper['level']==3 and part[0] in [1,6])
   if is_image:
    pool=sorted_images([im for im in figures if im['page']==pn and im['bottom']<=first+12])
    if len(pool)>=len(item['choices']):shared[key]={'options':image_options(pool[-len(item['choices']):])}
   elif item['kind']=='choice':
    pool_words=[w for w in page['words'] if w['top']<first-2 or (paper['level']==1 and part[0]==31 and w['x0']>page['width']*.5)]
    example=min([w['top'] for w in pool_words if '例如' in w['text']],default=page['height'])
    if not(paper['level']==1 and part[0]==31):pool_words=[w for w in pool_words if w['top']<example-2]
    opts=extract_options(pool_words)
    if len(opts)>=2:shared[key]={'options':opts}
  for item in paper['items']:
   n=item['number'];a=anchors.get(n)
   if not a:raise ValueError('Missing question anchor '+str(n))
   if paper['level']==6 and n==101:
    context='\n\n'.join(lines(pages[pn]['words'],False) for pn in paper['writing_pages'])
    items[str(n)]={'prompt':'Tulis ringkasan dari bahan yang telah dibaca, sesuai instruksi sumber.','options':[],'figures':[],'group':None,'reading_context':context};continue
   pn=a['page'];page=pages[pn];two_columns=(item['section']=='writing' or (paper['level']>=5 and item['section']=='listening')) and any(v['x0']>page['width']*.45 for v in anchors.values() if v['page']==pn);column_right=a['x0']>page['width']*.45;neighbors=sorted([v for v in anchors.values() if v['page']==pn and (not two_columns or (v['x0']>page['width']*.45)==column_right)],key=lambda w:w['top']);following=[v['top'] for v in neighbors if v['top']>a['top']+3];bottom=min(following,default=page['height']*.93)
   later_ranges=[r['top'] for r in ranges if r['page']==pn and r['top']>a['top']+4]
   bottom=min([bottom]+later_ranges)
   region=[w for w in page['words'] if a['top']-(24 if paper['level']<=2 else 8)<=w['top']<bottom-2 and w['text']!=a['text'] and (not two_columns or (w['x0']>page['width']*.45)==column_right)]
   if a['suffix'] in list('ABCDEF'):
    region.insert(0,{'text':a['suffix'],'x0':a['x1']-8,'x1':a['x1'],'top':a['top'],'bottom':a['bottom']})
   prompt=(a['suffix']+' '+lines(region,False)).strip();prompt=re.sub(r'\n?[A-F]\s*$', '',prompt)
   options=extract_options(region);part=partition(paper['level'],n);group=None;context=None;ims=[]
   if item['kind']=='choice' and part and str(part) in shared:
    options=shared[str(part)]['options'];group={'id':str(part),'label':'Pilihan bersama untuk soal '+str(part[0])+'–'+str(part[1])}
    if paper['level']==1 and part[0]==31:
     region=[w for w in region if w['x0']<page['width']*.5];prompt=(a['suffix']+' '+lines(region,False)).strip()
   # Pictures belonging to one numbered row are matched by the closest number baseline.
   local_images=[im for im in figures if im['page']==pn and (not two_columns or (im['x']>page['width']*.45)==column_right) and min(neighbors,key=lambda v:abs((im['top']+im['bottom'])/2-v['top']))['number']==n]
   if item['kind']=='judgment':
    ims=[im['id'] for im in local_images if im['bottom']>a['top']-45]
    if prompt in list('ABCDEF'):prompt='Pilih jawaban untuk bagian ('+str(n)+') pada bacaan.'
   if item['kind']=='ordering' and re.match(r'^([A-F])\s+\1\s',prompt):prompt=re.sub(r'^([A-F])\s+','',prompt,count=1)
   if not prompt:prompt='Dengarkan audio, lalu pilih Benar atau Salah.'
   if item['kind']=='choice' and local_images and (not options or (paper['level']==1 and 6<=n<=10)):
    options=image_options(sorted([im for im in local_images if im['bottom']>a['top']-80],key=lambda im:im['x']))
   if options and item['kind']!='ordering':
    letters=[w for w in region if re.fullmatch(r'[A-F]',w['text'])]
    if letters:prompt=(a['suffix']+' '+lines([w for w in region if w['top']<min(x['top'] for x in letters)-2],False)).strip()
   source_range=next((r for r in ranges if r['start']<=n<=r['end']),None)
   if source_range:
    group={'id':str(source_range['start'])+'-'+str(source_range['end']),'label':'Bacaan bersama untuk soal '+str(source_range['start'])+'–'+str(source_range['end'])}
    context=source_range['context']
    if a.get('synthetic') and paper['level']==6 and 71<=n<=80:
     options=extract_options([w for w in page['words'] if w['top']>=a['top']-2])
     prompt='Pilih kalimat untuk bagian ('+str(n)+') pada bacaan.'
   if not prompt:prompt='Dengarkan audio dan pilih jawaban.' if item['section']=='listening' else 'Pilih jawaban untuk soal '+str(n)+'.'
   if item['kind']=='ordering':
    prompt=(a['suffix']+' '+lines(region,True)).strip();options=[]
   if item['kind']=='writing':ims=[im['id'] for im in local_images if im['bottom']>a['top']-90]
   expected=5 if (paper['level']==3 and 46<=n<=50) or (paper['level']==2 and 56<=n<=60) else len(item['choices'])
   if item['kind']=='choice' and (len(options)!=expected or item['key'] not in [o['value'] for o in options]):raise ValueError('Unverified choices '+str(n)+' '+str([o['value'] for o in options]))
   items[str(n)]={'prompt':prompt,'options':options,'figures':ims,'group':group,'context':context}
  results[code]={'source_sha256':paper['sha256'],'items':items}
  report.append({'id':code,'status':'extracted','items':len(items)});print(code,'OK',len(items),flush=True)
 except Exception as error:report.append({'id':code,'status':'needs_review','reason':str(error)});print(code,'REVIEW',str(error).encode('ascii','replace').decode(),flush=True)
(OUT/'candidate.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
(ROOT/'artifacts/hsk-structured-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'extracted':len(results),'needs_review':[r for r in report if r['status']=='needs_review']},ensure_ascii=False),flush=True)
