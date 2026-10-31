from pathlib import Path
import json,zipfile,struct,zlib,re
import openpyxl
from docx import Document
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/material-inspection';OUT.mkdir(parents=True,exist_ok=True)
def recover_zip(path):
    raw=path.read_bytes();items={};issues=[];offset=0
    while True:
        pos=raw.find(b'PK\x03\x04',offset)
        if pos<0:break
        try:
            _,version,flags,method,tm,dt,crc,csize,usize,nlen,xlen=struct.unpack_from('<IHHHHHIIIHH',raw,pos)
            name=raw[pos+30:pos+30+nlen].decode('utf8');start=pos+30+nlen+xlen
            if method==8:
                stream=zlib.decompressobj(-15);data=stream.decompress(raw[start:]);data+=stream.flush()
                if not stream.eof:raise ValueError('truncated deflate')
                end=len(raw)-len(stream.unused_data)
            elif method==0 and csize:data=raw[start:start+csize];end=start+csize
            else:raise ValueError('unsupported/incomplete stored entry')
            if crc and zlib.crc32(data)&0xffffffff!=crc:raise ValueError('CRC mismatch')
            items[name]=data;offset=end
        except Exception as e:issues.append(str(e));offset=pos+4
    target=OUT/(path.stem+'.recovered.xlsx')
    if 'xl/workbook.xml' in items:
        if '[Content_Types].xml' not in items:
            types=['<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>','<Default Extension="xml" ContentType="application/xml"/>','<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>']
            for name in items:
                kind='worksheet' if re.match(r'xl/worksheets/sheet\d+\.xml$',name) else 'styles' if name=='xl/styles.xml' else 'sharedStrings' if name=='xl/sharedStrings.xml' else None
                if kind:types.append(f'<Override PartName="/{name}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.{kind}+xml"/>')
            items['[Content_Types].xml']=('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+''.join(types)+'</Types>').encode()
            issues.append('Reconstructed missing content-type manifest; recovered XML/CRC unchanged')
        with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED)as z:
            for name,data in items.items():z.writestr(name,data)
        return target,{'recovered_entries':len(items),'issues':issues}
    return None,{'recovered_entries':len(items),'issues':issues}
report=[]
for p in (ROOT/'MATERI HSK LENGKAP').glob('*.xlsx'):
    r={'file':str(p.relative_to(ROOT))}
    target=p
    if not zipfile.is_zipfile(p):
        target,info=recover_zip(p);r.update(info)
    if target:
        try:
            wb=openpyxl.load_workbook(target,read_only=True,data_only=False)
            r['read_path']=str(target.relative_to(ROOT));r['sheets']=wb.sheetnames;r['samples']={}
            for name in ['Vocab List','Grammar List','Practice','KUNCI(JANGAN SENTUH)']:
                if name in wb:
                    rows=[]
                    for i,row in enumerate(wb[name].iter_rows(values_only=True),1):
                        values=[str(v)if v is not None else '' for v in row]
                        if any(values)and i>9:rows.append({'row':i,'values':values})
                    r['samples'][name]=rows[:5];r[name+'_rows']=len(rows)
            wb.close()
        except Exception as e:r['error']=str(e)
    else:r['error']='No recoverable OOXML package'
    report.append(r)
for p in (ROOT/'KOSAKATA PEKERJAAN'/'KOSAKATA UMUM').glob('*'):
    r={'file':str(p.relative_to(ROOT))}
    if p.suffix=='.docx':
        d=Document(p);r['paragraphs']=[x.text for x in d.paragraphs if x.text.strip()][:20];r['tables']=[[[c.text for c in row.cells]for row in t.rows[:5]] for t in d.tables[:3]]
    elif p.suffix=='.xlsx':
        w=openpyxl.load_workbook(p,read_only=True,data_only=True);r['sheets']={s.title:[[v for v in row]for row in list(s.iter_rows(values_only=True))[:8]]for s in w};w.close()
    report.append(r)
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2,default=str),encoding='utf8')
for r in report:
    print(json.dumps({k:v for k,v in r.items()if k not in ['samples','tables','paragraphs','sheets']},ensure_ascii=False))
