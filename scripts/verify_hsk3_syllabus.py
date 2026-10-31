"""Reference audit only; homographs/sense-specific entries are not silently reassigned."""
from pathlib import Path
from pypdf import PdfReader
import json,re
from collections import defaultdict,Counter
root=Path(__file__).resolve().parents[1];reader=PdfReader(root/'data/hsk3-official-syllabus-reference.pdf')
mapping=defaultdict(set)
for page in reader.pages[79:214]:
    text=page.extract_text()or''
    for m in re.finditer(r'(?m)^\d+\s+([1-6](?:（[^）]+）)?)\s+([\u3400-\u9fff]+)\d*',text):
        mapping[m[2]].update(int(n)for n in re.findall(r'[1-6]',m[1]))
data=json.loads((root/'data/source-release.json').read_text(encoding='utf8'));stats=Counter();review=[]
for v in data['vocabulary']:
    if v['track']!='hsk':continue
    levels=mapping.get(re.sub(r'\d+$','',v['hanzi']),set());status='level_matched'if v['level']in levels else 'sense_or_alias_review'if levels else'alias_not_matched';stats[status]+=1
    if status!='level_matched':review.append({'hanzi':v['hanzi'],'workbook_level':v['level'],'official_lemma_levels':sorted(levels),'source_ref':v['source_ref']})
out={'reference':'HSK syllabus 2025-11 / effective 2026-07','source_url':'https://www.chinesetest.cn/syllabus','direct_pdf':'https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf','statistics':dict(stats),'review':review,'note':'Lemma matching is not psychometric calibration. Homographs and senses are retained at the workbook level; unresolved aliases remain visible in the report.','vocabulary':{k:sorted(v)for k,v in mapping.items()}}
(root/'data/hsk3-official-level-map.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps({'statistics':dict(stats),'review':review},ensure_ascii=False,indent=2))
