"""Build downloadable, level-specific Atlas material. No employee data is included."""
import json, math, html
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data/material-pdfs';OUT.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
pdfmetrics.registerFont(TTFont('Latin','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('LatinBold','C:/Windows/Fonts/arialbd.ttf'))
ZH=ParagraphStyle('zh',fontName='STSong-Light',fontSize=16,leading=20,textColor=HexColor('#10303B'),wordWrap='CJK')
SM=ParagraphStyle('sm',fontName='Latin',fontSize=8,leading=11,textColor=HexColor('#36535B'))
EX=ParagraphStyle('ex',fontName='STSong-Light',fontSize=11,leading=14,textColor=HexColor('#10303B'),wordWrap='CJK')
v=json.loads((ROOT/'data/vocab-atlas.json').read_text(encoding='utf8'))
h=json.loads((ROOT/'data/hanzi-atlas.json').read_text(encoding='utf8'))
W,H=landscape(A4)
def para(c,text,style,x,y,width):
    p=Paragraph(html.escape(str(text or '')),style);_,height=p.wrap(width,1000);p.drawOn(c,x,y-height);return y-height-3
def header(c,kind,level,page,pages,count):
    c.setFillColor(HexColor('#F8F5ED'));c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(HexColor('#10303B'));c.rect(0,H-70,W,70,fill=1,stroke=0)
    c.setFillColor(HexColor('#FFFFFF'));c.roundRect(21,H-59,42,42,6,fill=1,stroke=0)
    c.drawImage(str(ROOT/'public/logo.png'),24,H-56,36,36,mask='auto',preserveAspectRatio=True)
    c.setFillColor(HexColor('#FFFFFF'));c.setFont('LatinBold',16);c.drawString(73,H-32,'ECB | '+kind+' HSK '+level)
    c.setFont('Latin',9);c.drawString(73,H-49,str(count)+' entri | Hanzi - Pinyin - Arti Indonesia - Contoh penggunaan')
    c.setStrokeColor(HexColor('#DCA53A'));c.setLineWidth(3);c.line(0,H-71,W,H-71)
    c.setFont('Latin',7);c.setFillColor(HexColor('#61767C'))
    c.drawString(24,20,'ECB Mandarin | Materi Atlas GF0025-2021 | HSK 7-9 merupakan satu kelompok')
    c.drawRightString(W-24,20,str(page)+' / '+str(pages))
def build(kind,level,rows):
    filename=OUT/(kind+'-hsk-'+level+'.pdf')
    c=canvas.Canvas(str(filename),pagesize=(W,H),pageCompression=1)
    title='Katalog Kosakata' if kind=='kosakata' else 'Katalog Hanzi'
    c.setTitle('ECB '+title+' HSK '+level);c.setAuthor('ECB Language Performance System')
    # Two columns, three generously spaced cards per page. Flow measured dynamically.
    width=(W-62)/2;top=H-89;bottom=44;gap=12;perpage=4 if kind=='hanzi' else 6;nr=perpage//2;rowheight=(top-bottom-(nr-1)*gap)/nr
    pages=math.ceil(len(rows)/perpage)+1
    for start in range(0,len(rows),perpage):
        header(c,title,level,start//perpage+1,pages,len(rows))
        for i,item in enumerate(rows[start:start+perpage]):
            x=24+(i%2)*(width+14);y=top-(i//2)*(rowheight+gap)
            c.setFillColor(HexColor('#FFFFFF'));c.setStrokeColor(HexColor('#DEDCCD'));c.setLineWidth(.6)
            c.roundRect(x,y-rowheight,width,rowheight,8,fill=1,stroke=1)
            c.setFillColor(HexColor('#117C78'));c.roundRect(x,y-rowheight,4,rowheight,2,fill=1,stroke=0)
            # Layout each record with dynamic type size. No truncation or clipped source text.
            def layout(draw=False,scale=1):
                yy=y-12;xx=x+14;ww=width-28
                lines=[(item['hanzi'],ZH),(item['pinyin'],SM),(item['meaning'],SM)]
                for text,style in lines:
                    st=ParagraphStyle('fit',parent=style,fontSize=style.fontSize*scale,leading=style.leading*scale)
                    p=Paragraph(html.escape(str(text or '')),st);_,hh=p.wrap(ww,2000)
                    if draw:p.drawOn(c,xx,yy-hh)
                    yy-=hh+3
                for zh,py,meaning in item['examples']:
                    for text,style in [(zh,EX),(py,SM),(meaning,SM)]:
                        st=ParagraphStyle('fit',parent=style,fontSize=style.fontSize*scale,leading=style.leading*scale)
                        p=Paragraph(html.escape(str(text or '')),st);_,hh=p.wrap(ww,2000)
                        if draw:p.drawOn(c,xx,yy-hh)
                        yy-=hh+2
                return y-yy+8
            scale=1
            while layout(scale=scale)>rowheight and scale>.52:scale-=.025
            assert layout(scale=scale)<=rowheight,(kind,level,item['hanzi'],'overflow')
            layout(True,scale)
        c.showPage()
    header(c,'Sumber dan cakupan',level,pages,pages,len(rows))
    yy=H-102
    notes=['Materi ini mempertahankan entri dan contoh dari Atlas yang digunakan aplikasi. Arti dapat bergantung pada konteks. Tidak ditambahkan contoh fiktif untuk mengisi kartu kosong.',
      'Kosakata: GF0025-2021 melalui ivankra/hsk30; contoh Zhongdex, Gushi, dan contoh orisinal pada Atlas. Data adaptasi dan terjemahan: CC BY-SA 4.0.',
      'Hanzi: GF0025-2021, Make Me a Hanzi (LGPL-3.0-or-later), Unicode Unihan. Arti Indonesia berasal dari Atlas sumber.',
      'https://github.com/ivankra/hsk30 | https://github.com/skishore/makemeahanzi',
      'https://github.com/saymei/zhongdex | https://gushichinese.com/hsk-3.0/downloads',
      'https://creativecommons.org/licenses/by-sa/4.0/ | https://www.unicode.org/license.txt',
      'Contoh yang tidak tersedia pada sumber ditandai sebagai tidak tercantum. Dokumen ini bukan soal ujian atau sertifikasi resmi HSK.']
    for text in notes:yy=para(c,text,ParagraphStyle('note',parent=SM,fontSize=10,leading=16),35,yy,W-70)-15
    c.save();return {'kind':kind,'level':level,'entries':len(rows),'pages':pages,'file':filename.name,'bytes':filename.stat().st_size}
manifest=[]
for level in ['1','2','3','4','5','6','7-9']:
    words=[]
    for i,row in enumerate(v['words']):
        if str(row[2])!=level:continue
        ex=v['examples'].get(str(i)) if isinstance(v['examples'],dict) else v['examples'][i]
        words.append({'hanzi':row[0].replace('|',' / '),'pinyin':row[1].replace('|',' / '),'meaning':row[4], 'examples':[ex] if ex else [['Contoh tidak tercantum dalam sumber.','','']]})
    manifest.append(build('kosakata',level,words))
    rows=[{'hanzi':r['hanzi'],'pinyin':' / '.join(r['pinyin']),'meaning':r['gloss_id'],'examples':[[e['word'],e.get('pinyin',''),e.get('meaning_id','')] for e in r['examples'][:3]] or [['Contoh tidak tercantum dalam sumber.','','']]} for r in h['rows'] if str(r['level'])==level]
    manifest.append(build('hanzi',level,rows))
    print(level,'done',flush=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print('TOTAL',sum(x['entries'] for x in manifest),sum(x['bytes'] for x in manifest),flush=True)
