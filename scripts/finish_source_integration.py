from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'scripts/content.mjs';s=p.read_text(encoding='utf8')
old="for(const o of options)await t.run('INSERT INTO question_options(id,question_id,label) VALUES(?,?,?)',[o.id,qid,o.label]);}for(const v"
new="for(const o of options)await t.run('INSERT INTO question_options(id,question_id,label) VALUES(?,?,?)',[o.id,qid,o.label]);await t.run('INSERT INTO question_metadata(question_id,concept_key,source_ref,curriculum,difficulty,transformation) VALUES(?,?,?,?,?,?)',[qid,q.concept_key||'curated:'+hash(q.prompt),JSON.stringify(q.source_ref||{file:content.source,sheet:'curated import'}),q.track==='hsk'?'HSK3.0':'ECB-WORK-v2',q.difficulty||q.level||1,'curated_import']);}for(const v"
if old in s:s=s.replace(old,new)
p.write_text(s,encoding='utf8')
p=root/'public/app.js';s=p.read_text(encoding='utf8')
old='<a class="btn secondary mb" href="#learning">Buka paket belajar →</a>'
new=old+"${a.media_type==='docx'?'<a class=\"btn secondary mb\" href=\"/api/library/'+a.id+'/file\">Unduh dokumen asli & gambar ↓</a>':''}"
if 'Unduh dokumen asli & gambar'not in s:s=s.replace(old,new)
p.write_text(s,encoding='utf8')
print('Curated import metadata and original DOCX access integrated.')
