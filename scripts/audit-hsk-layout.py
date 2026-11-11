from pathlib import Path
import json,pdfplumber,re
ROOT=Path.cwd(); SOURCE=Path('E:/APP MANDARIN'); CACHE=ROOT/'artifacts/hsk-layout';CACHE.mkdir(exist_ok=True)
bank=json.loads((ROOT/'artifacts/active-papers.json').read_text(encoding='utf8'))
for p in bank:
 target=CACHE/(p['id']+'.json')
 if target.exists():continue
 source=SOURCE/p['source']
 if not source.exists():
  matches=list((SOURCE/'SOAL HSK LENGKAP').rglob(p['id']+'*.pdf'));source=matches[0] if matches else source
 try:
  pages=[]
  with pdfplumber.open(source) as doc:
   for pn in sorted({pn for phase in p['phases'] for pn in phase['pages']}):
    page=doc.pages[pn-1]
    words=page.extract_words(x_tolerance=2,y_tolerance=3,keep_blank_chars=False)
    pages.append({'page':pn,'width':page.width,'height':page.height,'text':page.extract_text() or '', 'words':[{k:v for k,v in w.items() if k in ['text','x0','x1','top','bottom']} for w in words], 'images':[{k:str(v) for k,v in im.items() if k!='stream'} for im in page.images]})
  target.write_text(json.dumps({'source':str(source),'pages':pages},ensure_ascii=False),encoding='utf8')
  print(p['id'],sum(len(x['text']) for x in pages),flush=True)
 except Exception as e:print('FAIL',p['id'],str(e),flush=True)
