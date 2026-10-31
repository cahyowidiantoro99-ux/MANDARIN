"""Read-only audit of supplied workbooks/documents. Never publishes content."""
from pathlib import Path
import json, re, hashlib, warnings
from collections import Counter
import openpyxl
from docx import Document

ROOT = Path(__file__).resolve().parents[1]
inventory, staged, seen = [], [], set()
warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')
for folder in ['KOSAKATA PEKERJAAN', 'MATERI HSK LENGKAP', 'SOAL HSK LENGKAP']:
    for p in sorted((ROOT/folder).rglob('*')):
        if not p.is_file(): continue
        item = {'path':str(p.relative_to(ROOT)), 'bytes':p.stat().st_size, 'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
        try:
            if p.suffix == '.xlsx':
                wb = openpyxl.load_workbook(p, read_only=True, data_only=True)
                sheets=[]
                for ws in wb:
                    rows=[]
                    for i, row in enumerate(ws.iter_rows(values_only=True),1):
                        values=[str(x).strip() if x is not None else '' for x in row]
                        if any(values): rows.append({'row':i,'values':values})
                    sheets.append({'name':ws.title,'nonempty_rows':len(rows),'sample':rows[:6]})
                    # Preserve raw source rows, no inferred level/translation/answer.
                    for r in rows:
                        key=json.dumps(r['values'],ensure_ascii=False)
                        duplicate=key in seen
                        seen.add(key)
                        staged.append({'source':item['path'],'sheet':ws.title,**r,'status':'under_review','duplicate':duplicate,'curriculum':'HSK3_candidate' if '3.0' in p.name else 'unverified'})
                item['sheets']=sheets
                wb.close()
            elif p.suffix == '.docx':
                doc=Document(p)
                item['paragraphs']=len([x for x in doc.paragraphs if x.text.strip()])
                item['table_rows']=sum(len(t.rows) for t in doc.tables)
                item['sample']=[x.text[:180] for x in doc.paragraphs if x.text.strip()][:3]
                for t in doc.tables:
                    for i,r in enumerate(t.rows,1):
                        staged.append({'source':item['path'],'sheet':'docx_table','row':i,'values':[c.text for c in r.cells],'status':'under_review'})
        except Exception as e: item['error']=str(e)
        inventory.append(item)
(ROOT/'data/source_inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2),encoding='utf8')
(ROOT/'data/source_staging.json').write_text(json.dumps(staged,ensure_ascii=False),encoding='utf8')
lines=['# Laporan kesenjangan data','',f'Inventaris: {len(inventory)} file sumber. {len(staged)} baris staging (termasuk header, duplikat, dan baris nonkosakata; bukan jumlah entri tervalidasi).',f'Duplikat baris XLSX terdeteksi: {sum(bool(r.get("duplicate")) for r in staged)}.','', '| Sumber XLSX | Sheet/baris tidak kosong | Status |','|---|---|---|']
for x in inventory:
    if x['path'].endswith('.xlsx'):
        lines.append('| '+x['path']+' | '+('; '.join(s['name']+': '+str(s['nonempty_rows']) for s in x.get('sheets',[])))+' | '+('ERROR: '+x['error'] if 'error' in x else 'Under Review')+' |')
lines+=['','## Keputusan konten','- Tidak ada sumber perusahaan yang otomatis dipublikasikan. Seluruh baris staging perlu pemetaan kolom, deduplikasi semantik, verifikasi terjemahan Indonesia, pinyin, departemen dan review instruktur.','- Workbook bernama New HSK 3.0 tidak boleh diperlakukan sebagai HSK 2.0. Pemetaan HSK 2.0 level 1–6 belum tersedia/ditinjau.','- PDF/MP3 ujian asli belum menjadi bank MCQ empat opsi dengan pembahasan; memerlukan kurasi dan verifikasi hak penggunaan. File soal dan kunci tidak dilayani web server.','- EM-ERC diperiksa sesuai hasil inventaris; file yang gagal dibaca perlu workbook valid, bukan materi karangan.','- Pool published produksi: 0. Seed sintetis DEMO terpisah untuk menguji mekanisme, bukan konten belajar resmi.','- 70 kerangka paket tersedia; isi produksi menunggu persetujuan konten. Benchmark improvement terkalibrasi belum disediakan.','- Detail audit, contoh baris dan hash: data/source_inventory.json; staging: data/source_staging.json.']
(ROOT/'DATA_GAP_REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
print(json.dumps({'files':len(inventory),'staged_rows':len(staged),'errors':[{ 'path':x['path'],'error':x['error']} for x in inventory if 'error'in x]},ensure_ascii=False))
