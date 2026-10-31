"""Map only explicit source columns; no invented translations or publication."""
from pathlib import Path
import json,re
from collections import Counter
root=Path(__file__).resolve().parents[1]
staging=json.loads((root/'data/source_staging.json').read_text(encoding='utf8'))
records=[];seen=set();rejected=Counter();counts=Counter()
for row in staging:
    source=row['source'];name=Path(source).name
    if not re.match(r'KOSAKATA (DBB1|DBB2|EM-ERT|KMU|TB|TRB)\.xlsx$',name):continue
    values=row['values']
    if len(values)<8 or not re.fullmatch(r'\d+(?:\.0)?',values[0]):continue
    dept=name.removeprefix('KOSAKATA ').removesuffix('.xlsx')
    hanzi,pinyin,meaning=(v.strip() for v in values[5:8])
    if not all([hanzi,pinyin,meaning]):rejected['missing_required']+=1;continue
    if not re.search('[\u4e00-\u9fff]',hanzi):rejected['not_hanzi']+=1;continue
    key=(dept,hanzi)
    if key in seen:rejected['duplicate_department_hanzi']+=1;continue
    seen.add(key);counts[dept]+=1
    records.append({'track':'work','department':dept,'hanzi':hanzi,'pinyin':pinyin,'meaning':meaning,'package_ordinal':(counts[dept]-1)%10+1,'source_ref':f'{source} / {row["sheet"]} / row {row["row"]}'})
payload={'source':'data/work-vocabulary-candidates.json (mapped company workbooks; original row coordinates included)','curriculum':'unverified-work','demo':False,'vocabulary':records,'questions':[]}
(root/'data/work-vocabulary-candidates.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf8')
report=root/'DATA_GAP_REPORT.md'
report.write_text(report.read_text(encoding='utf8')+'\n## Pemetaan kandidat kosakata kerja\n'+f'{len(records)} kandidat unik dipetakan dari kolom sumber eksplisit (Hanzi, Pinyin, Indonesia). Bukan jumlah yang telah diverifikasi instruktur.\n\n'+ '\n'.join(f'- {d}: {n} kandidat.' for d,n in counts.items())+'\n'+f'Baris ditolak: {dict(rejected)}.\n'+ 'Kandidat disimpan dalam data/work-vocabulary-candidates.json beserta file/sheet/baris asal; import sebagai draft saja. Work umum dari DOCX/XLSX lain masih perlu pemetaan khusus.\n',encoding='utf8')
print(json.dumps({'candidates':len(records),'by_department':dict(counts),'rejected':dict(rejected)}))
