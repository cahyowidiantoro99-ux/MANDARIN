"""Deterministic, provenance-preserving build from the user's source files.
Only explicit source translations/keys are used; no fabricated department material.
"""
from pathlib import Path
from collections import Counter,defaultdict
import json,re,hashlib,random,unicodedata,csv,zipfile,xml.etree.ElementTree as ET,warnings
import openpyxl
from docx import Document
from pypdf import PdfReader
warnings.filterwarnings('ignore',category=UserWarning,module='openpyxl')
ROOT=Path(__file__).resolve().parents[1];OUTPUT=ROOT/'data/source-release.json'
inspection=json.loads((ROOT/'artifacts/material-inspection/report.json').read_text(encoding='utf8'))
read_paths={x['file']:ROOT/x['read_path'] for x in inspection if 'read_path'in x}
vocab=[];grammar=[];practice=[];lessons=[];assets=[];rejected=Counter();counts=defaultdict(Counter)
hanzi=re.compile(r'[\u3400-\u9fff]')
def text(v):return str(v).strip()if v is not None else ''
def norm(s):return re.sub(r'[^\w\u3400-\u9fff]','',unicodedata.normalize('NFKC',s).lower())
def ref(p,sheet='',row=None):return {'file':str(p.relative_to(ROOT)),'sheet':sheet,'row':row}
def valid(s):return bool(s and not s.startswith('=')and not re.match(r'^#(REF|VALUE|DIV|N/A)',s))
seen={}
def add_vocab(zh,py,meaning,track,level,dept,source,pos='',examples=None):
    zh,py,meaning=map(text,[zh,py,meaning]);zh=zh.strip('。；;')
    if not(hanzi.search(zh)and valid(py)and valid(meaning))or len(zh)>80 or len(meaning)>500:rejected['vocab_missing_or_invalid']+=1;return
    key=(track,level,dept,norm(zh))
    if key in seen:
        old=seen[key];old['provenance'].append(source)
        if norm(meaning)!=norm(old['meaning']):old.setdefault('alternate_meanings',[]).append(meaning)
        rejected['vocab_duplicate_merged']+=1;return
    r={'hanzi':zh,'pinyin':py,'meaning':meaning,'track':track,'level':level,'department':dept,'part_of_speech':pos,'examples':examples or [],'source_ref':source,'provenance':[source]};seen[key]=r;vocab.append(r);counts[source['file']]['vocabulary']+=1
def add_lesson(title,body,source,track='work',level=None,dept='GENERAL',kind='reading'):
    if not body:return
    lessons.append({'title':title,'body':body,'source_ref':source,'track':track,'level':level,'department':dept,'kind':kind});counts[source['file']]['lessons']+=1
for p in sorted((ROOT/'MATERI HSK LENGKAP').glob('*.xlsx')):
    source=str(p.relative_to(ROOT));level=int(re.search(r'HSK\s*(\d)',p.name)[1]);wb=openpyxl.load_workbook(read_paths.get(source,p),read_only=True,data_only=True)
    if 'Vocab List'in wb:
        ex=defaultdict(list)
        for ws in wb:
            if 'example' in ws.title.lower():
                for i,r in enumerate(ws.iter_rows(values_only=True),1):
                    a=list(map(text,r))
                    if len(a)>=5 and hanzi.search(a[1])and hanzi.search(a[2])and valid(a[4])and i>1:ex[a[1]].append({'zh':a[2],'pinyin':a[3],'id':a[4],'source_ref':ref(p,ws.title,i)})
        for i,r in enumerate(wb['Vocab List'].iter_rows(values_only=True),1):
            a=list(map(text,r))
            if i>=13 and len(a)>6 and re.match(r'^\d',a[1]):add_vocab(a[2],a[3],a[4],'hsk',level,None,ref(p,'Vocab List',i),a[6],ex.get(a[2],[]))
        # Traps are contextual learning material; never import spreadsheet formulas/progress as content.
        if 'Vocab Traps'in wb:
            rows=[]
            for i,r in enumerate(wb['Vocab Traps'].iter_rows(values_only=True),1):
                clean=[text(x)for x in r if isinstance(x,str)and valid(x)]
                clean=list(dict.fromkeys(clean))
                if any(hanzi.search(s)for s in clean):rows.append({'row':i,'cells':clean})
            for chunk in range(0,len(rows),20):add_lesson('Perbedaan kosakata & jebakan umum',{'rows':rows[chunk:chunk+20]},ref(p,'Vocab Traps'),track='hsk',level=level,dept=None,kind='vocabulary_notes')
    if 'Grammar List'in wb:
        for i,r in enumerate(wb['Grammar List'].iter_rows(values_only=True),1):
            a=list(map(text,r));a+=['']*max(0,8-len(a))
            if i>=6 and re.match(r'^\d',a[1])and valid(a[2])and valid(a[4]):
                g={'title':a[2],'pinyin':a[3],'function':a[4],'pattern':a[5],'examples_zh':a[6],'examples_id':a[7],'level':level,'source_ref':ref(p,'Grammar List',i)};grammar.append(g);add_lesson(a[2],g,g['source_ref'],'hsk',level,None,'grammar')
        # Preserve original authored practice keys and dropdown distractors from the workbook XML.
        wb_formula=openpyxl.load_workbook(read_paths.get(source,p),read_only=True,data_only=False)
        ws=wb['Practice'];wf=wb_formula['Practice'];sheet_index=wb.sheetnames.index('Practice')+1
        with zipfile.ZipFile(read_paths.get(source,p))as z:
            xml=ET.fromstring(z.read(f'xl/worksheets/sheet{sheet_index}.xml'));ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'};options={}
            for dv in xml.findall('.//m:dataValidation',ns):
                f=dv.find('m:formula1',ns)
                if f is not None and f.text and f.text.startswith('"'):
                    choices=next(csv.reader([f.text[1:-1]]));
                    for addr in dv.attrib.get('sqref','').split():options[addr]=[s.strip().lstrip('|').strip()for s in choices]
        for i,r in enumerate(wf.iter_rows(values_only=True),1):
            a=list(map(text,r));a+=['']*max(0,5-len(a))
            if i<11 or not re.match(r'^\d',a[1])or not valid(a[2]):continue
            match=re.search(r'IF\(D\d+=(?:\x27([^\x27]+)\x27!)?([A-Z]+\d+)',a[4])
            correct=text((wb[match[1]]if match and match[1]else ws)[match[2]].value)if match else ''
            choices=options.get(f'D{i}',[])
            if correct and hanzi.search(correct)and correct in choices and len(set(choices))>=3:practice.append({'meaning':a[2],'correct':correct,'options':choices,'track':'hsk','level':level,'source_ref':ref(p,'Practice',i)})
            else:rejected['practice_without_resolvable_key_or_options']+=1
        wb_formula.close()
    wb.close()
# Department vocabulary: explicit columns from the six readable company workbooks.
for p in sorted((ROOT/'KOSAKATA PEKERJAAN').glob('*.xlsx')):
    if not zipfile.is_zipfile(p):continue
    dept=p.stem.removeprefix('KOSAKATA ').replace('EM-ERC','EMERC');w=openpyxl.load_workbook(p,read_only=True,data_only=True)
    for ws in w:
        for i,r in enumerate(ws.iter_rows(values_only=True),1):
            a=list(map(text,r));a+=['']*max(0,11-len(a))
            if re.match(r'^\d+(?:\.0)?$',a[0]):
                ex=[{'zh':a[8],'pinyin':a[9],'id':a[10],'source_ref':ref(p,ws.title,i)}]if hanzi.search(a[8])and valid(a[10])else []
                add_vocab(a[5],a[6],a[7],'work',None,dept,ref(p,ws.title,i),examples=ex)
    w.close()
# All common documents, including technical glossary, equipment and HR phrase workbook.
common=ROOT/'KOSAKATA PEKERJAAN/KOSAKATA UMUM'
for p in sorted(common.glob('*')):
    if p.suffix=='.docx':
        doc=Document(p);paras=[x.text.strip()for x in doc.paragraphs if x.text.strip()]
        for chunk in range(0,len(paras),35):add_lesson(p.stem,{'paragraphs':paras[chunk:chunk+35]},ref(p,'paragraphs',chunk+1))
        for ti,t in enumerate(doc.tables):
            rows=[]
            for ri,r in enumerate(t.rows,1):
                cells=list(dict.fromkeys(c.text.strip()for c in r.cells));rows.append({'row':ri,'cells':cells})
                source=ref(p,f'table {ti+1}',ri)
                if len(cells)>=3 and hanzi.search(cells[0])and not hanzi.search(cells[1])and valid(cells[2])and not any(x in cells[0]for x in ['汉语','名称','词汇']):add_vocab(cells[0],cells[1],cells[2],'work',None,'GENERAL',source)
                for cell in cells:
                    parts=[s.strip()for s in cell.splitlines()if s.strip()]
                    if len(parts)>=3 and not hanzi.search(parts[0])and hanzi.search(parts[1])and not hanzi.search(parts[2]):add_vocab(parts[1],parts[2],parts[0],'work',None,'GENERAL',source)
            for chunk in range(0,len(rows),35):add_lesson(p.stem,{'rows':rows[chunk:chunk+35]},ref(p,f'table {ti+1}',chunk+1))
        if 'Departemen' in p.name:
            for i,line in enumerate(paras,1):
                m=re.match(r'(.+?)\s+([\u3400-\u9fff]+)\s*[（(]([^()（）]+)[)）]',line)
                if m:add_vocab(m[2],m[3],m[1],'work',None,'GENERAL',ref(p,'paragraphs',i))
    elif p.suffix=='.xlsx':
        w=openpyxl.load_workbook(p,read_only=True,data_only=True)
        for ws in w:
            rows=[[text(v)for v in row]for row in ws.iter_rows(values_only=True,max_col=12)]
            if '人事部'in p.name:
                for i,a in enumerate(rows,1):
                    if len(a)>=5 and re.match(r'^\d',a[0]):add_vocab(a[2],a[3],a[4],'work',None,'GENERAL',ref(p,ws.title,i))
            else:
                for i,a in enumerate(rows[:-2]):
                    for col,zh in enumerate(a):
                        py=rows[i+1][col]if col<len(rows[i+1])else '';meaning=rows[i+2][col]if col<len(rows[i+2])else ''
                        if hanzi.search(zh)and not hanzi.search(py)and not hanzi.search(meaning):add_vocab(zh,py,meaning,'work',None,'GENERAL',{**ref(p,ws.title,i+1),'column':col+1})
            meaningful=[{'row':i+1,'cells':list(dict.fromkeys(s for s in a if s))}for i,a in enumerate(rows)if any(a)]
            for chunk in range(0,len(meaningful),30):add_lesson(p.stem,{'rows':meaningful[chunk:chunk+30]},ref(p,ws.title,chunk+1))
        w.close()
# Assign non-repeating packages with balanced counts. Work packages include general plus each department.
scopes=defaultdict(list)
for v in vocab:scopes[(v['track'],v['level'],v['department'])].append(v)
for records in scopes.values():
    for i,v in enumerate(records):v['package_ordinal']=min(10,i*10//len(records)+1)
for scope in set((x['track'],x['level'],x['department'])for x in lessons):
    records=[x for x in lessons if(x['track'],x['level'],x['department'])==scope]
    for i,l in enumerate(records):l['package_ordinal']=i%10+1
# Generate keyed MCQs from explicit source pairs; same-level, same-POS distractors, excluding synonym overlaps.
questions=[];question_seen=set()
def question(prompt,options,correct,track,level,dept,kind,direction,concept,source,explanation,transformation):
    if len(set(options))!=4 or correct not in options:return
    key=(track,level,dept,norm(prompt))
    if key in question_seen:return
    complexity=len(hanzi.findall(correct if direction=='id-zh'else prompt));difficulty=level if track=='hsk'else next((i+1 for i,limit in enumerate([6,12,20,30,45,99999])if complexity<=limit),6)
    question_seen.add(key);questions.append({'prompt':prompt,'options':options,'correct_index':options.index(correct),'track':track,'level':level,'department':dept,'kind':kind,'direction':direction,'concept_key':concept,'source_ref':source,'difficulty':difficulty,'explanation':explanation,'transformation':transformation,'curriculum':'HSK3.0'if track=='hsk'else'ECB-WORK-v2','benchmark':None})
def alternatives(records,correct,value,seed):
    rng=random.Random(seed);pool=[v for v in records if v is not correct];rng.shuffle(pool)
    # Same grammatical class makes distractors less trivial; normalize translations to avoid synonyms.
    pool.sort(key=lambda v:0 if v['part_of_speech']==correct['part_of_speech']else 1)
    result=[];meaning_tokens=set(re.split(r'[,/;|()]',correct['meaning'].lower()));meaning_tokens={norm(s)for s in meaning_tokens if norm(s)}
    for v in pool:
        candidate=v[value];tokens={norm(s)for s in re.split(r'[,/;|()]',v['meaning'].lower())if norm(s)}
        if candidate not in result and norm(candidate)!=norm(correct[value])and not(tokens&meaning_tokens):result.append(candidate)
        if len(result)==3:return [correct[value],*result]
    return []
for scope,records in scopes.items():
    for v in records:
        track,level,dept=scope;concept=f'hsk:{level}:{norm(v["hanzi"])}'if track=='hsk'else f'work:{norm(v["hanzi"])}';source=v['source_ref'];explanation=f'{v["hanzi"]} ({v["pinyin"]}) = {v["meaning"]}. Sumber: {source["file"]}, {source["sheet"]}, baris {source["row"]}.'
        for direction,value,prompt,kind in [('zh-id','meaning',f'Apa makna “{v["hanzi"]}” sesuai sumber?','translation'),('id-zh','hanzi',f'Pilih Mandarin untuk “{v["meaning"]}”.','translation'),('zh-pinyin','pinyin',f'Pilih Pinyin yang tepat untuk “{v["hanzi"]}”.','pinyin')]:
            opts=alternatives(records,v,value,concept+direction)
            if opts:question(prompt,opts,v[value],track,level,dept,kind,direction,concept,source,explanation,'source_pair_mcq')
        # Contextual meaning: explicit bilingual example from the source, no invented sentence or key.
        if v['examples']:
            ex=v['examples'][0];opts=alternatives(records,v,'meaning',concept+'context')
            if opts:question(f'Dalam kalimat “{ex["zh"]}”, apa makna “{v["hanzi"]}”?',opts,v['meaning'],track,level,dept,'context','zh-id',concept,ex['source_ref'],f'{ex["zh"]}\n{ex.get("pinyin","")}\n{ex["id"]}\n'+explanation,'source_bilingual_example')
        # Work grammar uses the source's complete contextual sentence as the object of structural understanding.
        if track=='work' and (v['examples']or len(hanzi.findall(v['hanzi']))>=4):
            ex=v['examples'][0]if v['examples']else {'zh':v['hanzi'],'id':v['meaning'],'source_ref':source};other_examples=[x['examples'][0]if x['examples']else {'zh':x['hanzi'],'id':x['meaning']}for x in records if x is not v and (x['examples']or len(hanzi.findall(x['hanzi']))>=4)and norm(x['examples'][0]['id']if x['examples']else x['meaning'])!=norm(ex['id'])]
            random.Random(concept).shuffle(other_examples);choices=list(dict.fromkeys([ex['zh'],*[x['zh']for x in other_examples]]))[:4]
            question(f'Pilih susunan kalimat kerja yang sesuai makna: “{ex["id"]}”.',choices,ex['zh'],track,None,dept,'grammar','id-zh',concept,ex['source_ref'],f'{ex["zh"]}\n{ex["id"]}\n'+explanation,'source_work_sentence')
for g in grammar:
    pool=[x for x in grammar if x['level']==g['level']and norm(x['function'])!=norm(g['function'])];random.Random(g['title']+str(g['level'])).shuffle(pool);choices=list(dict.fromkeys([g['function'],*[x['function']for x in pool]]))[:4]
    example=next((line.strip()for line in g['examples_zh'].splitlines()if hanzi.search(line)),g['pattern']);concept=f'hsk:{g["level"]}:grammar:{norm(g["title"])}'
    question(f'Pada contoh “{example}”, fungsi pola “{g["title"]}” adalah …',choices,g['function'],'hsk',g['level'],None,'grammar',None,concept,g['source_ref'],f'Pola: {g["pattern"]}. {g["function"]}.\n{g["examples_zh"]}\n{g["examples_id"]}','source_grammar_rule')
for p in practice:
    choices=list(dict.fromkeys(p['options']));other=[q['correct']for q in practice if q['level']==p['level']and norm(q['meaning'])!=norm(p['meaning'])and q['correct']not in choices];random.Random(p['meaning']).shuffle(other)
    if len(choices)==3 and other:choices.append(other[0])
    question(f'Pilih kalimat Mandarin yang sesuai: “{p["meaning"]}”.',choices[:4],p['correct'],'hsk',p['level'],None,'grammar','id-zh',f'hsk:{p["level"]}:practice:{norm(p["meaning"])}',p['source_ref'],f'Jawaban workbook: {p["correct"]}\nMakna: {p["meaning"]}. Tiga opsi dan kunci berasal dari Practice; opsi keempat dari kalimat sumber lain.','source_practice_key_plus_fourth_distractor')
# Register EVERY supplied source file. Legacy PDF/audio remain clearly labelled archives, never relabelled HSK3.
for folder in ['MATERI HSK LENGKAP','KOSAKATA PEKERJAAN','SOAL HSK LENGKAP']:
    for p in sorted((ROOT/folder).rglob('*')):
        if not p.is_file():continue
        source=str(p.relative_to(ROOT));suffix=p.suffix.lower();legacy=folder=='SOAL HSK LENGKAP';match=re.search(r'HSK\s*(\d)',source);level=int(match[1])if match else None;status='available';detail={'counts':dict(counts[source]),'legacy':legacy,'original_unchanged':True}
        if suffix=='.xlsx':
            if source in read_paths:detail['recovered']=read_paths[source]!=p
            elif not zipfile.is_zipfile(p):status='unreadable';detail['reason']='File bukan ZIP/OOXML yang dapat dipulihkan; diperlukan salinan workbook yang valid.'
        if suffix=='.pdf':
            try:
                reader=PdfReader(p);detail['pages']=len(reader.pages);detail['sample_text_characters']=len(reader.pages[0].extract_text()or'')if reader.pages else 0;detail['usage']='Arsip latihan HSK versi lama, bukan bank penentu level HSK3.0.'
            except Exception as e:detail['reason']=str(e);status='unreadable'
        if suffix=='.zip':detail['usage']='Arsip duplikat; file PDF/MP3 terpisah diindeks untuk latihan.'
        if suffix=='.docx'and legacy:
            try:
                d=Document(p);paras=[x.text for x in d.paragraphs if x.text.strip()]
                for chunk in range(0,len(paras),30):add_lesson('Arsip '+p.stem,{'paragraphs':paras[chunk:chunk+30]},ref(p,'paragraphs',chunk+1),'hsk',level,None,'legacy_reading')
            except Exception as e:detail['reason']=str(e);status='unreadable'
        assets.append({'title':p.name,'path':source,'media_type':suffix.lstrip('.'),'track':'hsk'if folder!='KOSAKATA PEKERJAAN'else'work','level':level,'legacy':legacy,'status':status,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'detail':detail})
report={'curriculum':'HSK3.0','vocabulary':len(vocab),'grammar_rules':len(grammar),'authored_practice':len(practice),'questions':len(questions),'lessons':len(lessons),'assets':len(assets),'question_pools':dict(Counter(f'{q["track"]}:{q["level"]or q["department"]}:{q["kind"]}'for q in questions)),'vocabulary_by_scope':{f'{s[0]}:{s[1]or s[2]}':len(v)for s,v in scopes.items()},'rejected':dict(rejected),'unreadable':[a['path']for a in assets if a['status']=='unreadable'],'recovered':[a['path']for a in assets if a['detail'].get('recovered')]}
payload={'release':'ecb-hsk3-source-v2','curriculum':'HSK3.0','vocabulary':vocab,'questions':questions,'lessons':lessons,'assets':assets,'report':report}
OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf8');(ROOT/'data/source-release-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False,indent=2))
