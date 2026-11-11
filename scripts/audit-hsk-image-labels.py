from pathlib import Path
import json,re
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'data/official-hsk/structured/content.json').read_text(encoding='utf8'))
papers=json.loads((ROOT/'artifacts/active-papers.json').read_text(encoding='utf8'));report=[]
for p in papers:
 code=p['id'];doc=json.loads((ROOT/'artifacts/hsk-layout'/f'{code}.json').read_text(encoding='utf8'));figures=[];raw_id=0
 if code in ['H11112','H31002','H11007']:
  figures=json.loads((ROOT/'artifacts'/f'{code}-figures.json').read_text(encoding='utf8'))
 else:
  for page in doc['pages']:
   if page['page']==1:continue
   objects=[]
   for m in page['images']:
    raw_id+=1;im=Image.open(ROOT/'artifacts/hsk-raw-images'/code/f'{raw_id}.webp')
    ratio=(im.width/im.height)/((float(m['x1'])-float(m['x0']))/(float(m['bottom'])-float(m['top'])))
    if ratio>3 or ratio<1/3:continue
    obj={'x':float(m['x0']),'right':float(m['x1']),'top':float(m['top']),'bottom':float(m['bottom'])}
    prev=next((g for g in objects if abs(g['x']-obj['x'])<1.5 and abs(g['right']-obj['right'])<1.5 and min(abs(g['bottom']-obj['top']),abs(obj['bottom']-g['top']))<1.5),None)
    if prev:prev['top']=min(prev['top'],obj['top']);prev['bottom']=max(prev['bottom'],obj['bottom'])
    else:objects.append(obj)
   for obj in objects:figures.append({'id':len(figures)+1,'page':page['page'],**obj})
 lookup={f['id']:f for f in figures};seen=set()
 for n,c in data[code]['items'].items():
  for o in c['options']:
   if not o.get('image') or (o['value'],o['image']) in seen:continue
   seen.add((o['value'],o['image']));f=lookup[o['image']];page=next(x for x in doc['pages'] if x['page']==f['page'])
   candidates=[w for w in page['words'] if re.fullmatch(r'[A-F]',w['text']) and ((0<=f['x']-w['x0']<110 and f['top']-12<=w['top']<=f['bottom']+5) or (f['bottom']-5<=w['top']<=f['bottom']+40 and f['x']-5<=w['x0']<=f.get('right',f['x']+160)))]
   candidates.sort(key=lambda w:abs((f['top']+f['bottom'])/2-w['top'])+abs(f['x']-w['x0'])/4)
   manual={('H11008',11):'A',('H11331',13):'C',('H11331',15):'B',('H11333',25):'C',('H11440',12):'B'}
   label=candidates[0]['text'] if candidates else manual.get((code,o['image']))
   report.append({'code':code,'number':int(n),'image':o['image'],'page':f['page'],'stored':o['value'],'source':label,'method':'source-label-position' if candidates else 'visual-source-page-and-extracted-object','match':label==o['value']})
(ROOT/'artifacts/image-label-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print('Unique option images',len(report),'matching',sum(r['match'] for r in report),'review',sum(not r['match'] for r in report))
