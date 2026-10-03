import sys,os,shutil
sys.path.insert(0,'.')
from PIL import Image,ImageDraw,ImageFont
from phonecam import phonecam
import scenes1,scenes2,escritorio3d
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def tag(im,n,x,y,s=1.0):
    d=ImageDraw.Draw(im);f=ImageFont.truetype(FONT,int(44*s))
    d.polygon([(x+4*s,y+4*s),(x-46*s+4*s,y+84*s),(x+46*s+4*s,y+84*s)],fill=(10,12,14))
    d.polygon([(x,y),(x-46*s,y+80*s),(x+46*s,y+80*s)],fill=(224,168,42));d.rectangle([x-46*s,y+80*s,x+46*s,y+96*s],fill=(194,143,30))
    d.text((x,y+60*s),str(n),font=f,fill=(42,33,16),anchor='ms')
def ruler(im,x,y,w):
    d=ImageDraw.Draw(im);f=ImageFont.truetype(FONT,20)
    d.rectangle([x,y,x+w,y+56],fill=(224,168,42))
    for i in range(21):
        h=32 if i%5==0 else 18;d.line([x+i*w/20,y,x+i*w/20,y+h],fill=(42,33,16),width=3)
    d.text((x+w-10,y+50),'cm',font=f,fill=(42,33,16),anchor='rs')
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','public','evidence','case01','new')
jobs=[
 ('comodos/comodo_01_entrada',scenes1.entrada,1,False),('comodos/comodo_02_sala',scenes1.sala,2,False),('comodos/comodo_03_cozinha',scenes1.cozinha,3,False),
 ('comodos/comodo_04_escritorio',None,4,False),('comodos/comodo_05_corredor',scenes1.corredor,5,False),('comodos/comodo_06_quarto_casal',scenes2.casal,6,False),
 ('comodos/comodo_07_quarto_livia',scenes2.livia,7,False),('comodos/comodo_08_canil',scenes2.canil,8,False),('comodos/comodo_09_painel_alarme',scenes2.painel,9,False),
 ('fechadura_porta',scenes2.fechadura,1,True),('trava_canil',scenes2.trava,2,True),('escritorio_comparativo',scenes2.comparativo,3,False),('foto_fachada_lan',scenes2.fachada,4,False)]
os.makedirs('final',exist_ok=True)
only=sys.argv[1:]
for i,(name,fn,n,rul) in enumerate(jobs):
    base=os.path.basename(name)
    if only and base not in only: continue
    if fn is None:
        S,lp=escritorio3d.build();gl=[(lp[0],lp[1],520,'#ffd08a',.42),(lp[0]+260,lp[1]+380,700,'#ffcf8a',.14)]
    else: S,gl=fn()
    S.render('final/'+base+'_clean',glow=gl)
    Image.open('final/'+base+'_clean.png').convert('RGB').save('final/'+base+'_clean.jpg',quality=95)
    phonecam('final/'+base+'_clean.jpg','final/'+base+'.jpg',level='celular',seed=10+i)
    im=Image.open('final/'+base+'.jpg').convert('RGB')
    if rul: ruler(im,1060,1000,420)
    tag(im,n,1440,870 if not rul else 890)
    im.save('final/'+base+'.jpg',quality=88)
    dst=os.path.join(OUT,name+'.jpg');os.makedirs(os.path.dirname(dst),exist_ok=True);shutil.copy('final/'+base+'.jpg',dst);print('ok',base,os.path.getsize(dst)//1024,'KB')
