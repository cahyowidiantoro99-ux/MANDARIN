"""Repair source-layout defects; does not infer or change answer keys.
Requires cached PDF word coordinates from audit-hsk-layout.py.
Writes a per-item audit trail, including unresolved source checks.
"""
from pathlib import Path
import json,re,hashlib
ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/'data/official-hsk/structured/content.json'
data=json.loads(PATH.read_text(encoding='utf8'))
papers=json.loads((ROOT/'artifacts/active-papers.json').read_text(encoding='utf8'))
HAN=re.compile(r'[\u3400-\u9fff]')
corrections=json.loads((ROOT/'data/official-hsk/structured/source-text-corrections.json').read_text(encoding='utf8'))
report=[]
for paper in papers:
 code=paper['id'];layout=json.loads((ROOT/'artifacts/hsk-layout'/f'{code}.json').read_text(encoding='utf8')); level=paper['level']
 assert data[code]['source_sha256']==hashlib.sha256((ROOT/paper['source']).read_bytes()).hexdigest()
 for item in paper['items']:
  n=item['number'];c=data[code]['items'][str(n)];before=c['prompt'];changes=[];issues=[]
  for option in c['options']:
   source_label=corrections.get('image_labels',{}).get(code,{}).get(str(option.get('image')))
   if source_label:option['value']=source_label
   replacement=corrections['options'].get(code,{}).get(str(n),{}).get(option['value'])
   if replacement:option['text']=replacement
  c['options'].sort(key=lambda o:o['value'])
  replacement=corrections['prompts'].get(code,{}).get(str(n))
  if replacement:c['prompt']=replacement
  instruction=None
  if item['section']=='listening':
   instruction='Dengarkan audio, lalu pilih gambar yang sesuai.' if any(o.get('image') for o in c['options']) else 'Dengarkan audio, lalu pilih jawaban yang sesuai.'
   if item['kind']=='judgment':instruction='Dengarkan audio, lalu tentukan apakah pernyataan atau gambar sesuai.'
   if not HAN.search(c['prompt']):c['prompt']=instruction
  if level==6 and 51<=n<=60:
   instruction='Pilih kalimat yang mengandung kesalahan tata bahasa.'
   if not HAN.search(c['prompt']):c['prompt']=instruction
  if (level==1 and 36<=n<=40) or (level==2 and 41<=n<=45) or (level==3 and 51<=n<=60) or (level==4 and 46<=n<=55):
   instruction='Pilih kata yang tepat untuk melengkapi bagian kosong.'
   c['context']=None
   for page in layout['pages']:
    anchor=next((w for w in page['words'] if re.match(r'^'+str(n)+r'[．.、]',w['text'])),None)
    if not anchor:continue
    stops=[w['top'] for w in page['words'] if w['top']>anchor['top']+4 and (re.match(r'^\d{1,3}[．.、]',w['text']) or re.match(r'^第[一二三四五六七八九十]+部分',w['text']) or re.match(r'^\d{1,3}[-－—–]\d{1,3}',w['text']))]
    bottom=min(stops,default=page['height']*.92)
    words=[w for w in page['words'] if anchor['top']-2<=w['top']<bottom-3 and w['x0']<page['width']*.92 and not re.fullmatch(r'[a-z.]',w['text'])]
    rows=[]
    for w in sorted(words,key=lambda w:(round(w['top']/3),w['x0'])):
     if not rows or abs(rows[-1][0]-w['top'])>5:rows.append([w['top'],[]])
     rows[-1][1].append(w)
    text=[]
    for _,row in rows:
     value=''.join(re.sub(r'[A-Za-zÀ-ɏ\u0300-\u036f]+','',re.sub(r'^'+str(n)+r'[．.、]','',w['text'])) if not re.match(r'^(?:'+str(n)+r'[．.、])?[AB][:：]',w['text']) else re.sub(r'^'+str(n)+r'[．.、]','',w['text']) for w in sorted(row,key=lambda w:w['x0']))
     value=re.sub(r'^'+str(n)+r'[．.、]','',value)
     if value.strip():text.append(value)
    c['prompt']='\n'.join(text).strip()
    break
  # HSK6 word cloze: rebuild stem including the anchor suffix, retaining all
  # 36pt answer spaces. Ordinary line indentation is never considered a gap.
  if level==6 and 61<=n<=70:
   instruction='Pilih rangkaian kata yang melengkapi bagian kosong secara berurutan.'
   found=[]
   for page in layout['pages']:
    for w in page['words']:
     if re.match(r'^'+str(n)+r'[．.、]',w['text']):found.append((page,w))
   if len(found)==1:
    page,a=found[0];following=[w['top'] for w in page['words'] if re.match(r'^'+str(n+1)+r'[．.、]',w['text']) and w['top']>a['top']]
    stop=min(following,default=page['height']*.93)
    letters=[w for w in page['words'] if a['top']<=w['top']<stop and re.match(r'^[A-D](?:[．.、]|$|[\u3400-\u9fff])',w['text'])]
    stop=min([w['top'] for w in letters],default=stop)
    words=[dict(w) for w in page['words'] if a['top']-1<=w['top']<stop-2 and w['top']<page['height']*.93 and not re.fullmatch(r'[a-z.]',w['text'])]
    rows=[]
    for w in sorted(words,key=lambda w:(round(w['top']/3),w['x0'])):
     if not rows or abs(rows[-1][0]-w['top'])>5:rows.append([w['top'],[]])
     rows[-1][1].append(w)
    text=[];count=0
    for row_index,(_,row) in enumerate(rows):
     value='';prev=None
     if row_index and min(w['x0'] for w in row)- (a['x0']+24)>=24:
      count+=1;value+='【'+str(count)+'】____'
     for w in sorted(row,key=lambda w:w['x0']):
      if prev and w['x0']-prev['x1']>=24:
       count+=1;value+='【'+str(count)+'】____'
      value+=re.sub(r'[a-z]','',w['text']);prev=w
     value=re.sub(r'^'+str(n)+r'[．.、]\s*','',value)
     text.append(value)
    if count>=2:c['prompt']='\n'.join(text);c['blank_count']=count
    else:issues.append('cloze source gaps require review')
   else:issues.append('cloze anchor ambiguous')
  if level==5 and 46<=n<=60:
   instruction='Pilih kata atau kalimat untuk bagian kosong bernomor '+str(n)+' pada bacaan.'
   if not HAN.search(c['prompt']):c['prompt']=instruction
   if not c.get('context'):issues.append('missing shared cloze passage')
  if c.get('context') and c.get('group') and (level==5 and 46<=n<=60 or level==6 and 71<=n<=80):
   start,end=map(int,re.findall(r'\d+',c['group']['id']))
   context=c['context']
   for blank in range(start,end+1):
    context=re.sub(r'(?<!\d)(?:[（(]\s*)?'+str(blank)+r'(?:\s*[）)])?(?!\d)(?!】)', '【'+str(blank)+'】____',context) if '【'+str(blank)+'】' not in context else context
   c['context']=context
   if '【'+str(n)+'】' not in context:issues.append('numbered blank absent from passage')
  if level==3 and 76<=n<=80:
   instruction='Tuliskan Hanzi pada bagian kosong sesuai pinyin yang diberikan.'
   candidates=[]
   for page in layout['pages']:
    for a in page['words']:
     if re.match(r'^'+str(n)+r'[．.、]',a['text']):
      candidates += [w['text'].rstrip('，．。、,.' ) for w in page['words'] if a['top']-18<w['top']<a['top']+3 and w['x0']>=a['x0'] and re.fullmatch(r'[A-Za-zÀ-ɏ\u0300-\u036f]+[，．。、,.]?',w['text']) and len(w['text'])>1]
   if len(candidates)==1:c['pinyin']='Pinyin: '+candidates[0]
   elif not c.get('pinyin') and not re.search(r'[（(][a-zāáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜ]+[）)]',c['prompt'],re.I):issues.append('writing pinyin requires review')
  # Preserve printed brackets but make empty positions visible.
  if item['section']!='listening':
   c['prompt']=re.sub(r'([（(])[\s\u3000]*([）)])',r'\1____\2',c['prompt'])
  if item['kind']=='ordering':c['prompt']=re.sub(r'^([A-F])\s+\1\s',r'\1 ',c['prompt'])
  if instruction:c['instruction']=instruction
  if c['prompt']!=before:changes.append('source stem / task instruction repaired')
  if not c['prompt'].strip():issues.append('empty prompt')
  if re.fullmatch(r'[A-F\s.．、]+',c['prompt']):issues.append('orphan option label')
  # Text extraction cannot prove illustration labels, linguistic accuracy,
  # or scanned keys. These require separate source verification.
  report.append({'code':code,'number':n,'section':item['section'],'kind':item['kind'],'changes':changes,'issues':issues,'source_sha256':paper['sha256']})
PATH.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'artifacts/prompt-repair-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'items':len(report),'changed':sum(bool(r['changes']) for r in report),'issues':[r for r in report if r['issues']]},ensure_ascii=False))
