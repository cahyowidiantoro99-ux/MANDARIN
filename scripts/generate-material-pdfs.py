import json,html
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4,landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
R=Path(__file__).resolve().parents[1];O=R/'data/material-pdfs';O.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
for n,f in [('Latin','arial.ttf'),('Bold','arialbd.ttf')]:pdfmetrics.registerFont(TTFont(n,'C:/Windows/Fonts/'+f))
W,H=landscape(A4)
def color(c,h):c.setFillColor(HexColor(h))
def text(c,s,x,y,font='Latin',size=8,fill='#10303B'):
 color(c,fill);c.setFont(font,size);c.drawString(x,y,s)
def paragraph(c,s,x,y,w,font,size,leading):
 st=ParagraphStyle('s',fontName=font,fontSize=size,leading=leading,textColor=HexColor('#10303B'),wordWrap='CJK' if font=='STSong-Light' else None)
 p=Paragraph(html.escape(str(s or '')),st);_,h=p.wrap(w,1000);p.drawOn(c,x,y-h);return y-h-2
v=json.loads((R/'data/vocab-atlas.json').read_text(encoding='utf8'));h=json.loads((R/'data/hanzi-atlas.json').read_text(encoding='utf8'))
def header(c,title,sub):
 color(c,'#F8F5ED');c.rect(0,0,W,H,fill=1,stroke=0)
 color(c,'#10303B');c.rect(0,H-61,W,61,fill=1,stroke=0)
 color(c,'#FFFFFF');c.roundRect(17,H-51,40,40,6,fill=1,stroke=0)
 c.drawImage(str(R/'public/logo.png'),19,H-49,36,36,mask='auto',preserveAspectRatio=True)
 text(c,title,67,H-28,'Bold',18,'#FFFFFF');text(c,sub,68,H-44,'Latin',8,'#FFFFFF')
 color(c,'#DCA53A');c.rect(0,H-63,W,2,fill=1,stroke=0)
 text(c,'ECB LANGUAGE PERFORMANCE SYSTEM | Atlas GF0025-2021 | CC BY-SA 4.0 / LGPL-3.0 / Unicode',19,16,'Latin',6.5,'#61767C')
 text(c,'GF0025-2021: ivankra/hsk30 | Contoh: Zhongdex, Gushi, Atlas | Hanzi: Make Me a Hanzi, Unihan',19,7,'Latin',5.5,'#61767C')

def fields(kind,item):
 if kind=='kosakata':
  idx,r=item;ex=v['examples'].get(str(idx)) if isinstance(v['examples'],dict) else v['examples'][idx]
  return [(r[0].replace('|',' / '),'STSong-Light',17,18),(r[1].replace('|',' / '),'Latin',7.2,8.3),(r[4],'Bold',7.1,8.2)]+([(ex[0],'STSong-Light',10,11),(ex[1],'Latin',6.7,7.7),(ex[2],'Latin',6.8,7.8)] if ex else [])
 return [(item['hanzi'],'STSong-Light',18,20),(' / '.join(item['pinyin']),'Latin',6.8,7.4),(item['gloss_id'],'Latin',6.4,7)]
def measure(lines,width):
 total=0
 for index,(val,font,size,leading) in enumerate(lines):
  st=ParagraphStyle('m',fontName=font,fontSize=size,leading=leading,wordWrap='CJK' if font=='STSong-Light' else None)
  p=Paragraph(html.escape(str(val or '')),st);_,hh=p.wrap(width-22 if index==0 else width,1000);total+=hh+2
 return total

def build(kind,level,rows):
 cols=4 if kind=='kosakata' else 6;gap=7 if kind=='kosakata' else 0;cw=(W-38-(cols-1)*gap)/cols
 pages=[];page=[];used=0;minimum=80 if kind=='kosakata' else (H-107)/8
 for start in range(0,len(rows),cols):
  chunk=rows[start:start+cols];height=max(minimum,max(measure(fields(kind,r),cw-16)+(10 if kind=='kosakata' else 4) for r in chunk))
  assert height<H-115,'Record too tall'
  if used+height>H-102 and page:pages.append(page);page=[];used=0
  page.append((start,chunk,height));used+=height+gap
 if page:pages.append(page)
 fn=O/(kind+'-hsk-'+level+'.pdf');c=canvas.Canvas(str(fn),pagesize=(W,H),pageCompression=1)
 title='Katalog Kosakata' if kind=='kosakata' else 'Katalog Hanzi';c.setTitle('ECB '+title+' HSK '+level);c.setAuthor('ECB Language Performance System')
 for pi,pg in enumerate(pages):
  header(c,title+' HSK '+level,str(len(rows))+' entri | '+('4 kolom | Hanzi, pinyin, arti dan contoh penggunaan' if kind=='kosakata' else 'Tabel ringkas | Hanzi, pinyin dan arti Indonesia'))
  text(c,str(pi+1)+' / '+str(len(pages)),W-58,16,'Bold',8);top=H-77
  for start,chunk,height in pg:
   for col,item in enumerate(chunk):
    x=19+col*(cw+gap);color(c,'#FFFFFF' if kind=='kosakata' or (start//cols)%2 else '#EEF6F3');c.setStrokeColor(HexColor('#CDDDD8'));c.setLineWidth(.4)
    if kind=='kosakata':c.roundRect(x,top-height,cw,height,4,fill=1,stroke=1)
    else:c.rect(x,top-height,cw,height,fill=1,stroke=1)
    text(c,f'{start+col+1:03d}',x+cw-27 if kind=='kosakata' else x+4,top-12 if kind=='kosakata' else top-9,'Bold',7 if kind=='kosakata' else 5.8,'#117C78')
    y=top-6
    for j,(val,font,size,leading) in enumerate(fields(kind,item)):
     width=cw-38 if kind=='kosakata' and j==0 else cw-16
     if kind=='hanzi' and j==0:text(c,val,x+cw/2-9,top-18,'STSong-Light',18);y=top-21
     else:y=paragraph(c,val,x+8,y,width,font,size,leading)
    assert y>=top-height+2,(kind,level,start+col,'overflow')
   top-=height+gap
  c.showPage()
 c.save();return dict(kind=kind,level=level,entries=len(rows),pages=len(pages),file=fn.name,bytes=fn.stat().st_size)
manifest=[]
for level in ['1','2','3','4','5','6','7-9']:
 for kind in ['kosakata','hanzi']:
  rows=[(i,r) for i,r in enumerate(v['words']) if str(r[2])==level] if kind=='kosakata' else [r for r in h['rows'] if str(r['level'])==level]
  result=build(kind,level,rows);manifest.append(result);print(result,flush=True)
(O/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
assert sum(x['entries'] for x in manifest if x['kind']=='kosakata')==11092
assert sum(x['entries'] for x in manifest if x['kind']=='hanzi')==3000
print('PASS: all 14092 entries, numbered per level; no text clipping.')
