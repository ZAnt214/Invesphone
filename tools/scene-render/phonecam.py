import numpy as np,cv2,io
from PIL import Image,ImageDraw,ImageFont
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
def phonecam(src,dst,seed=1,level='media',date=True,out=(1600,1200)):
    """Simula foto de celular antigo: baixa resolução, lente barata, ruído, flash estourado e compressão."""
    L={'celular':dict(res=720,q=42,noise=7,vig=.45,blur=.65,flash=.18),'leve':dict(res=960,q=55,noise=5,vig=.35,blur=.5,flash=.12),
       'media':dict(res=640,q=38,noise=8,vig=.5,blur=.7,flash=.2),
       'forte':dict(res=480,q=25,noise=12,vig=.6,blur=1.0,flash=.28)}[level]
    rng=np.random.default_rng(seed)
    im=cv2.imread(src);h0,w0=im.shape[:2]
    # 1) enquadramento levemente torto/cortado de quem tirou na mão
    ang=rng.uniform(-1.4,1.4);sc=1.05
    M=cv2.getRotationMatrix2D((w0/2,h0/2),ang,sc);im=cv2.warpAffine(im,M,(w0,h0),borderMode=cv2.BORDER_REFLECT)
    # 2) baixa resolução do sensor
    w=L['res'];h=int(w*3/4);im=cv2.resize(im,(w,h),interpolation=cv2.INTER_AREA)
    f=im.astype(np.float32)/255
    # 3) distorção de barril + aberração cromática da lente barata
    yy,xx=np.mgrid[0:h,0:w].astype(np.float32);cx,cy=w/2,h/2
    nx,ny=(xx-cx)/cx,(yy-cy)/cy;r2=nx**2+ny**2
    def warp(k,ch):
        s=1+k*r2;mx=(nx*s)*cx+cx;my=(ny*s)*cy+cy
        return cv2.remap(f[:,:,ch],mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
    f=np.dstack([warp(.05,0),warp(.045,1),warp(.04,2)])  # B,G,R
    # 4) desfoque leve (foco fraco) e nitidez excessiva do processador da câmera
    f=cv2.GaussianBlur(f,(0,0),L['blur']);bl=cv2.GaussianBlur(f,(0,0),2.2);f=np.clip(f+0.6*(f-bl),0,1)
    # 5) cor: dessaturada, tom esverdeado/amarelado, preto levantado, realces estourados
    g=f.mean(axis=2,keepdims=True);f=g+(f-g)*0.78
    f[:,:,0]*=0.94;f[:,:,2]*=1.04;f[:,:,1]*=1.02
    f=np.clip((f-0.05)*1.18+0.05,0,1);f=f**0.92
    # 6) estouro do flash no centro
    Y,X=np.mgrid[0:h,0:w];d=np.sqrt(((X-w*0.5)/(w*0.6))**2+((Y-h*0.48)/(h*0.6))**2)
    f=np.clip(f+L['flash']*np.exp(-d**2*2.2)[...,None],0,1)
    # 7) vinheta e escurecimento dos cantos
    v=1-L['vig']*np.clip((d-0.55),0,1)**1.5;f*=v[...,None]
    # 8) ruído de luminância + croma
    n=rng.normal(0,L['noise']/255,(h,w,1)).astype(np.float32)+rng.normal(0,L['noise']/255*0.5,(h,w,3)).astype(np.float32)
    f=np.clip(f+n*(1.2-f.mean(axis=2,keepdims=True)),0,1)
    im8=(f*255).astype(np.uint8)
    # 9) compressão JPEG forte (blocos) e reamostragem
    ok,buf=cv2.imencode('.jpg',im8,[cv2.IMWRITE_JPEG_QUALITY,L['q']]);im8=cv2.imdecode(buf,1)
    im8=cv2.resize(im8,out,interpolation=cv2.INTER_CUBIC)
    pil=Image.fromarray(cv2.cvtColor(im8,cv2.COLOR_BGR2RGB))
    if date:
        d_=ImageDraw.Draw(pil);fo=ImageFont.truetype(FONT,int(out[1]*0.04))
        t="'02 10 17";x=out[0]-int(out[0]*0.26);y=out[1]-int(out[1]*0.085)
        d_.text((x+2,y+2),t,font=fo,fill=(60,20,0));d_.text((x,y),t,font=fo,fill=(255,150,40))
    buf=io.BytesIO();pil.save(buf,'JPEG',quality=70);Image.open(buf).save(dst,quality=88)
if __name__=='__main__':
    src='ill_rooms3/comodo_04_escritorio.jpg'
    for lv in ('leve','media','forte'): phonecam(src,f'cmp_phone_{lv}.jpg',level=lv)
