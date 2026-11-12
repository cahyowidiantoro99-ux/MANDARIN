from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1];path=ROOT/'data/official-hsk/structured/content.json'
data=json.loads(path.read_text(encoding='utf8'));han=lambda s:''.join(re.findall(r'[\u3400-\u9fff]',s));count=0
for code,paper in data.items():
 if not code.startswith(('H1','H2')):continue
 layout=json.loads((ROOT/'artifacts/hsk-layout'/f'{code}.json').read_text(encoding='utf8'))
 for n,c in paper['items'].items():
  candidate_pages=[p for p in layout['pages'] if any(re.match(r'^'+str(n)+r'[．.、]',w['text']) and w['x0']<p['width']*.32 for w in p['words'])]
  for o in c['options']:
   o.pop('pinyin',None)
   target=han(o.get('text',''))
   if not target or len(target)>8:continue
   hits=[]
   for page in candidate_pages or layout['pages']:
    words=list(page['words']);by_row=[]
    for w in sorted(words,key=lambda w:(round(w['top']/3),w['x0'])):
     if not by_row or abs(by_row[-1][0]-w['top'])>4:by_row.append((w['top'],[]))
     by_row[-1][1].append(w)
    for y,row in by_row:
     row=sorted(row,key=lambda w:w['x0'])
     for start in range(len(row)):
      for end in range(start+2,min(start+9,len(row)+1)):
       selected=row[start:end]
       if han(''.join(w['text'] for w in selected))==target:words.append({'text':target,'x0':selected[0]['x0'],'x1':selected[-1]['x1'],'top':y,'bottom':max(w['bottom'] for w in selected)})
    for w in words:
     if han(w['text'])!=target or w['bottom']-w['top']>23:continue
     upper=[x for x in page['words'] if w['top']-23<x['top']<w['top']-3 and x['x0']>=w['x0']-12 and x['x1']<=w['x1']+25 and re.search(r'[A-Za-zÀ-ɏ]',x['text']) and not han(x['text']) and not re.fullmatch(r'[A-F]',x['text']) and x['bottom']-x['top']<20]
     value=' '.join(x['text'] for x in sorted(upper,key=lambda x:x['x0']))
     if value:hits.append(value)
   unique=set(hits)
   if len(unique)==1:o['pinyin']=next(iter(unique));count+=1
for paper in data.values():
 for c in paper['items'].values():
  if c.get('pinyin','').startswith('Pinyin: '):c['pinyin']=c['pinyin'][8:]
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print('Original source option pinyin:',count)
