from pathlib import Path
from pypdf import PdfReader
import re,json
ROOT=Path(__file__).resolve().parents[1];papers=json.loads((ROOT/'artifacts/active-papers.json').read_text(encoding='utf8'));keys=json.loads((ROOT/'artifacts/answer-key-audit.json').read_text(encoding='utf8'));overrides=json.loads((ROOT/'data/official-hsk/verified-source-overrides.json').read_text(encoding='utf8'));report=[]
for p in papers:
 refs=[i for i in p['items'] if i.get('reference')]
 if not refs:continue
 k=next(x for x in keys if x['code']==p['id'])
 if p['id'] in overrides:raw=overrides[p['id']]['key_text']
 else:
  doc=PdfReader(k['source']);start=(k['key_page']-1) if k['key_page'] else 0;raw='\n'.join(pg.extract_text() or '' for pg in doc.pages[start:])
 raw=re.sub(r'(?<=\d)\s+(?=\d)','',raw)
 for item in refs:
  n=item['number'];m=re.search(r'(?<!\d)'+str(n)+r'\s*[．.、]\s*',raw)
  if not m:report.append({'code':p['id'],'number':n,'issue':'source anchor absent'});continue
  end=re.search(r'(?<!\d)'+str(n+1)+r'\s*[．.、]',raw[m.end():]);text=raw[m.end():m.end()+end.start()] if end else raw[m.end():].split('\n\n')[0]
  text=re.split(r'\n\s*(?:第[一二三四]+部分|四、|评分|注：|HSK|H\d{5}|汉语水平考试|试卷|tieng|THE HSK|[-－]\s*\d)',text)[0].strip()
  norm=lambda s:re.sub(r'[^\u3400-\u9fff0-9]','',s)
  report.append({'code':p['id'],'number':n,'stored':item['reference'],'source':text,'match':norm(item['reference'])==norm(text)})
(ROOT/'artifacts/writing-reference-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(len(report),'references',sum(not r.get('match') for r in report),'differences')
