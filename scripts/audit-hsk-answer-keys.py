from pathlib import Path
import json,re,hashlib,pdfplumber
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];papers=json.loads((ROOT/'artifacts/active-papers.json').read_text(encoding='utf8'));overrides=json.loads((ROOT/'data/official-hsk/verified-source-overrides.json').read_text(encoding='utf8'));report=[]
for paper in papers:
 code=paper['id'];source=ROOT/paper['source'];doc=PdfReader(source);texts=[p.extract_text() or '' for p in doc.pages]
 start=next((i for i,t in enumerate(texts) if '卷答案' in re.sub(r'\s','',t)),None);kind='native';keysource=source
 if code in overrides:
  raw=overrides[code]['key_text'];kind='verified-scan';start=overrides[code]['key_page_index'];assert hashlib.sha256(source.read_bytes()).hexdigest()==overrides[code]['sha256']
 elif start is not None:raw='\n'.join(texts[start:])
 else:
  keysource=next((p for p in source.parent.glob('*.pdf') if ('答案' in p.name or 'dapan' in p.name.lower()) and p!=source),None)
  if keysource:raw='\n'.join(p.extract_text() or '' for p in PdfReader(keysource).pages)
  else:raw=''
 # Independent pair extraction: permit source column separators but never infer an answer.
 raw=re.sub(r'(?<=\d)\s+(?=\d)','',raw)
 pairs=re.findall(r'(?<!\d)(\d{1,3})\s*[．.、]\s*([A-F]{1,3}|[√×])(?=\s|[\u3400-\u9fff]|$)',raw)
 if 'Salinan teks' in raw:pairs+=re.findall(r'(?<!\d)(\d{1,3})[ \t]+([A-F]{1,3}|[√×])(?=\s|$)',raw)
 keys={}
 for n,k in pairs:keys.setdefault(int(n),set()).add(k)
 entries=[]
 for item in paper['items']:
  if 'key' not in item:continue
  values=keys.get(item['number'],set());entries.append({'number':item['number'],'source':sorted(values),'stored':item['key'],'match':values=={item['key']}})
 row={'code':code,'source':str(keysource),'kind':kind,'key_page':start+1 if start is not None else None,'items':entries,'issues':[e for e in entries if not e['match']]};report.append(row);print(code,len(entries),'issues',len(row['issues']),flush=True)
(ROOT/'artifacts/answer-key-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print('TOTAL',sum(len(r['items']) for r in report),'ISSUES',sum(len(r['issues']) for r in report),flush=True)
