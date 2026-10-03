from engine import *
import random,math
random.seed(11)
def build(cam=None):
    cam=cam or Cam((-1.55,1.48,0.12),(0.45,0.95,3.3),fov=76,roll=2.5)
    S=Scene(cam)
    X0,X1,Z0,Z1,YH=-2.1,2.1,-1.0,4.4,2.6
    WALL='#3b5266';FLOOR='#5a4636'
    # piso e paredes
    S.poly([(X0,0,Z0),(X1,0,Z0),(X1,0,Z1),(X0,0,Z1)],FLOOR,.62,.12,depth=1.9e3)
    S.poly([(X0,0,Z1),(X1,0,Z1),(X1,YH,Z1),(X0,YH,Z1)],WALL,.55,.13,depth=2e3)
    S.poly([(X1,0,Z0),(X1,0,Z1),(X1,YH,Z1),(X1,YH,Z0)],WALL,.40,.12,depth=2e3)
    S.poly([(X0,0,Z0),(X0,0,Z1),(X0,YH,Z1),(X0,YH,Z0)],WALL,.45,.12,depth=2e3)
    S.poly([(X0,YH,Z0),(X1,YH,Z0),(X1,YH,Z1),(X0,YH,Z1)],'#2a3b49',.25,0,depth=2e3)
    # listras do papel de parede
    x=X0
    while x<X1:
        S.poly([(x,0,Z1-.001),(x+.09,0,Z1-.001),(x+.09,YH,Z1-.001),(x,YH,Z1-.001)],'#ffffff',.5,0,depth=1.8e3,op=.045)
        x+=.18
    z=Z0
    while z<Z1:
        S.poly([(X1-.001,0,z),(X1-.001,0,z+.09),(X1-.001,YH,z+.09),(X1-.001,YH,z)],'#ffffff',.5,0,depth=1.8e3,op=.04)
        z+=.18
    # tábuas do piso
    for i in range(0,27):
        x=X0+i*.16
        S.poly([(x,0.001,Z0),(x+.006,0.001,Z0),(x+.006,0.001,Z1),(x,0.001,Z1)],'#000000',.5,0,depth=1.85e3,op=.22)
        for k in range(6):
            zz=Z0+random.uniform(0,Z1-Z0)
            S.poly([(x,0.001,zz),(x+.16,0.001,zz),(x+.16,0.001,zz+.006),(x,0.001,zz+.006)],'#000000',.5,0,depth=1.85e3,op=.16)
    # rodapés
    S.box((0,.06,Z1-.02),(4.2,.12,.04),'#2c3e4e',bias=100); S.box((X1-.02,.06,1.7),(.04,.12,6.1),'#2c3e4e',bias=100)
    # tapete
    S.poly([(-.9,.004,2.35),(1.55,.004,2.35),(1.55,.004,3.55),(-.9,.004,3.55)],'#4a3038',.5,.06,depth=1.7e3)
    S.poly([(-.82,.005,2.43),(1.47,.005,2.43),(1.47,.005,3.47),(-.82,.005,3.47)],'#573a42',.5,.05,depth=1.69e3)
    # ---- estante
    sx0,sx1,sz0,sz1=-2.03,-0.98,4.06,4.4
    S.poly([(sx0,.0,sz1-.02),(sx1,0,sz1-.02),(sx1,2.0,sz1-.02),(sx0,2.0,sz1-.02)],'#251a12',.4,.1,depth=1.9e3-1)
    S.box(((sx0+sx1)/2,1.0,(sz0+sz1)/2),(.04,2.0,.34),'#7a5230',bias=-.02,skip=()) if False else None
    S.box((sx0+.02,1.0,(sz0+sz1)/2),(.04,2.0,sz1-sz0),'#7a5230')
    S.box((sx1-.02,1.0,(sz0+sz1)/2),(.04,2.0,sz1-sz0),'#7a5230')
    S.box(((sx0+sx1)/2,2.02,(sz0+sz1)/2),(sx1-sx0+.04,.04,sz1-sz0),'#8a5e38')
    ys=[.04,.52,.99,1.46,1.92]
    for y in ys:
        S.box(((sx0+sx1)/2,y,(sz0+sz1)/2+.01),(sx1-sx0,.035,sz1-sz0-.02),'#8a5e38',bias=-.01)
    cols=['#7a2f33','#2f5a78','#c9a14a','#3f7a58','#5a4a8a','#a8552e','#355a6a','#8a3d4a','#b5733a','#3d5a7a','#6b8a3d']
    for li in range(4):
        y0=ys[li]+.0175;x=sx0+.06
        while x<sx1-.1:
            bw=random.choice([.03,.035,.04,.05,.06]);bh=random.uniform(.24,.38);c=random.choice(cols)
            lean=random.choice([0]*9+[10])
            S.box((x+bw/2,y0+bh/2,sz1-.2),(bw,bh,.2),c,yaw=0,bias=-.05)
            x+=bw+.004
        # um livro deitado
    S.floor_shadow(sx0,sz0,sx1,sz1,2.0,.4)
    # ---- escrivaninha
    DZ=3.93
    S.floor_shadow(-.52,3.6,1.12,4.26,.78,.45)
    S.box((.3,.74,DZ),(1.72,.045,.74),'#a8703a',g=.05,bias=-.2)
    S.box((-.28,.36,DZ),(.46,.70,.66),'#8a5a30')
    S.box((.88,.36,DZ),(.46,.70,.66),'#8a5a30')
    S.box((.3,.38,4.2),(1.1,.64,.04),'#5a3a1d')
    # gaveta central fechada
    S.box((.3,.665,3.62),(.78,.11,.035),'#9a6535',bias=-.3)
    S.box((.3,.665,3.595),(.14,.02,.02),'#d6b257',bias=-.35)
    S.cyl(.3,3.585,.008,.60,.63,'#1a130c',top=False,bias=-.36)
    # pedestais: gavetas fechadas (2 em cada) e 1 aberta
    for px in (-.28,.88):
        for j,yy in enumerate((.43,.21)):
            S.box((px,yy,3.595),(.40,.185,.03),'#9a6535',bias=-.3)
            S.box((px,yy+.0,3.575),(.13,.02,.02),'#d6b257',bias=-.35)
        S.poly([(px-.2,.62,3.598),(px+.2,.62,3.598),(px+.2,.69,3.598),(px-.2,.69,3.598)],'#150f0a',.3,0,bias=-.29)
    # gavetas laterais abertas com papéis
    for px,off in ((-.28,.0),(.88,.04)):
        S.box((px,.585,3.33),(.40,.14,.50),'#8a5a30',bias=-.5)
        S.box((px,.665,3.12),(.40,.16,.03),'#a8703a',bias=-.6)
        S.box((px,.665,3.10),(.13,.02,.02),'#d6b257',bias=-.65)
        for i in range(4):
            lx=px-.12+i*.07;S.poly([(lx,.66,3.2),(lx+.2,.66,3.2),(lx+.24,.76,3.47),(lx+.04,.76,3.47)],'#ece7d6',.75,.04,depth=3.3-.55-i*.01)
        S.poly([(px-.1,.665,3.34),(px+.12,.665,3.34),(px+.14,.67,3.5),(px-.08,.67,3.5)],'#e4dfcd',.8,0,depth=3.3-.62)
    # objetos sobre a mesa
    TY=.7665
    S.floor_shadow(-.45,3.8,-.25,4.05,.5,.25) if False else None
    S.cyl(-.38,4.0,.085,TY,TY+.03,'#6a5326',bias=-.9)
    S.cyl(-.38,4.0,.012,TY+.03,TY+.43,'#7a6430',bias=-.92,top=False)
    S.cyl(-.38,4.0,.17,TY+.40,TY+.62,'#e9d9a4',r1=.095,t=.88,bias=-.95)
    S.box((-.12,TY+.045,3.93),(.2,.09,.14),'#2e2a2d',yaw=8,bias=-.9); S.box((-.12,TY+.075,3.86),(.04,.02,.01),'#d6b257',yaw=8,bias=-.95)
    S.box((.28,TY+.02,3.9),(.44,.04,.32),'#707b85',yaw=7,bias=-.9); S.box((.28,TY+.045,3.9),(.38,.006,.27),'#8a959f',yaw=7,bias=-.95)
    S.box((.74,TY+.025,4.02),(.12,.05,.06),'#b69a4c',bias=-.9)
    cl=S.plane((0.74,TY+.115,3.985),(1,0,0),(0,1,0))
    S.shape(cl,[(.07*math.cos(a),.07*math.sin(a)) for a in [i*math.pi/12 for i in range(24)]],'#d8d2bf',.8,0,depth=3.9-1,bias=0)
    S.shape(cl,[(.058*math.cos(a),.058*math.sin(a)) for a in [i*math.pi/12 for i in range(24)]],'#f1ecd8',.85,0,depth=3.9-1.05)
    S.shape(cl,[(-.004,0),(.004,0),(.004,.045),(-.004,.045)],'#25201a',.4,0,depth=3.9-1.1)
    S.shape(cl,[(0,-.004),(.035,-.012),(.035,.004),(0,.004)],'#25201a',.4,0,depth=3.9-1.1)
    S.cyl(.98,4.0,.034,TY,TY+.19,'#8d98a0',t=.55,bias=-.9); S.cyl(.98,4.0,.02,TY+.19,TY+.23,'#b0463a',bias=-.95)
    # ---- cadeira
    def rot(dx,dz,yaw):
        a=math.radians(yaw);return dx*math.cos(a)+dz*math.sin(a),-dx*math.sin(a)+dz*math.cos(a)
    cx,cz,yw=-1.32,2.35,-38
    S.floor_shadow(cx-.28,cz-.28,cx+.28,cz+.28,.5,.4)
    S.cyl(cx,cz,.03,.13,.43,'#1e262e',top=False,bias=-.2)
    for k in range(5):
        a=math.radians(72*k+yw);ex,ez=cx+.27*math.cos(a),cz+.27*math.sin(a)
        S.poly([(cx-.02*math.sin(a),.07,cz+.02*math.cos(a)),(cx+.02*math.sin(a),.07,cz-.02*math.cos(a)),(ex+.015*math.sin(a),.07,ez-.015*math.cos(a)),(ex-.015*math.sin(a),.07,ez+.015*math.cos(a))],'#1b2229',.4,0,bias=-.1)
        S.cyl(ex,ez,.03,0,.07,'#0f1317',bias=-.1,t=.4)
    S.box((cx,.46,cz),(.46,.08,.44),'#2d4a69',yaw=yw,bias=-.3)
    dx,dz=rot(0,-.2,yw)
    S.box((cx+dx,.78,cz+dz),(.42,.42,.07),'#35567a',yaw=yw,bias=-.35)
    S.box((cx+dx*.55,.77,cz+dz*.55),(.34,.34,.02),'#3f658c',yaw=yw,bias=-.36)
    S.box((cx+dx*.9,.52,cz+dz*.9),(.09,.14,.06),'#26394f',yaw=yw,bias=-.33)
    # ---- cofre na parede direita
    sx=X1
    S.box((sx-.06,1.38,2.95),(.12,.62,.58),'#58636c',g=.05)
    pl=S.plane((sx-.121,1.38,2.95),(0,0,1),(0,1,0))
    S.shape(pl,[(-.25,-.26),(.25,-.26),(.25,.26),(-.25,.26)],'#8a959f',.5,.06,depth=2.95-.12)
    S.shape(pl,[(-.22,-.23),(.22,-.23),(.22,.23),(-.22,.23)],'#7c8791',.5,.05,depth=2.95-.13)
    ring=[(.1*math.cos(i*math.pi/16),.1*math.sin(i*math.pi/16)) for i in range(32)]
    S.shape(pl,ring,'#323c44',.4,.05,depth=2.95-.14)
    S.shape(pl,[(.08*math.cos(i*math.pi/16),.08*math.sin(i*math.pi/16)) for i in range(32)],'#c2cad0',.6,.08,depth=2.95-.15)
    S.shape(pl,[(.06*math.cos(i*math.pi/16),.06*math.sin(i*math.pi/16)) for i in range(32)],'#222a30',.4,0,depth=2.95-.16)
    S.shape(pl,[(-.01,0),(.01,0),(.01,.075),(-.01,.075)],'#d6dadd',.7,0,depth=2.95-.17)
    S.shape(pl,[(.15,-.12),(.18,-.12),(.18,.0),(.15,.0)],'#b9c0c5',.6,.06,depth=2.95-.14)
    for yy in (-.16,.16): S.shape(pl,[(-.235,yy),(-.215,yy),(-.215,yy+.07),(-.235,yy+.07)],'#9aa4aa',.5,0,depth=2.95-.13)
    # ---- quadro e janela na parede do fundo
    zf=Z1-.012
    fp=S.plane((-.78,1.28,zf),(1,0,0),(0,1,0))
    S.shape(fp,[(0,0),(1.1,0),(1.1,.64),(0,.64)],'#4a3220',.45,.06,depth=2e3-5)
    ip=S.plane((-.74,1.32,zf-.002),(1,0,0),(0,1,0))
    S.shape(ip,[(0,0),(1.02,0),(1.02,.56),(0,.56)],'#4d6378',.5,.1,depth=2e3-6)
    S.shape(ip,[(0,0),(1.02,0),(1.02,.30),(.8,.27),(.6,.33),(.4,.26),(.18,.32),(0,.27)],'#2f4658',.5,.1,depth=2e3-7)
    S.shape(ip,[(0,0),(1.02,0),(1.02,.14),(.7,.12),(.3,.16),(0,.12)],'#26382d',.5,.1,depth=2e3-8)
    S.shape(ip,[(.74+.06*math.cos(i*math.pi/10),.42+.06*math.sin(i*math.pi/10)) for i in range(20)],'#ebe6cc',.8,0,depth=2e3-9)
    wp=S.plane((.52,1.42,zf),(1,0,0),(0,1,0))
    S.shape(wp,[(0,0),(.62,0),(.62,.78),(0,.78)],'#1f2a34',.4,0,depth=2e3-5)
    wi=S.plane((.55,1.45,zf-.002),(1,0,0),(0,1,0))
    S.shape(wi,[(0,0),(.56,0),(.56,.72),(0,.72)],'#27415a',.5,.1,depth=2e3-6)
    S.shape(wi,[(0,0),(.56,0),(.56,.2),(.4,.18),(.2,.24),(0,.2)],'#1c2f3c',.5,.1,depth=2e3-7)
    S.shape(wi,[(.14+.05*math.cos(i*math.pi/10),.5+.05*math.sin(i*math.pi/10)) for i in range(20)],'#e9e3c8',.8,0,depth=2e3-8)
    S.shape(wi,[(.27,0),(.29,0),(.29,.72),(.27,.72)],'#1f2a34',.4,0,depth=2e3-9)
    S.shape(wi,[(0,.35),(.56,.35),(.56,.37),(0,.37)],'#1f2a34',.4,0,depth=2e3-9)
    S.box((.82,1.4,zf-.04),(.7,.03,.1),'#3a2a1d',bias=-.1)
    S.cyl(.9,zf-.05,.045,1.415,1.50,'#a3573a',bias=-.12)
    gp=S.plane((.9,1.5,zf-.05),(1,0,0),(0,1,0))
    for dxp,hh,cc in ((-.08,.17,'#3f7a4a'),(0,.2,'#4f9058'),(.08,.15,'#356a40'),(-.03,.12,'#4f9058'),(.05,.1,'#3f7a4a')):
        S.shape(gp,[(dxp-.025,0),(dxp+.025,0),(dxp+dxp*.6,hh)],cc,.55,.05,depth=zf-1,bias=-.13)
    # ---- lixeira
    S.floor_shadow(1.38,3.55,1.62,3.79,.34,.4)
    S.cyl(1.5,3.67,.115,0,.33,'#7c828a',r1=.13,t=.5)
    S.shape(S.plane((1.5,.335,3.67),(1,0,0),(0,0,1)),[(-.03,-.04),(.05,-.05),(.07,.03),(-.02,.05)],'#ece7d6',.8,0,depth=3.67-.5)
    # ---- papéis e pasta no chão
    for (px,pz,r) in [(-.25,2.1,.5),(.35,1.85,-.7),(.85,2.55,.2),(-.55,2.9,-.4),(.15,3.05,.9),(1.0,3.2,-.3)]:
        a=r;co,si=math.cos(a),math.sin(a)
        pts=[(-.15,-.105),(.15,-.105),(.15,.105),(-.15,.105)]
        W3=[(px+x*co-y*si,.006,pz+x*si+y*co) for x,y in pts]
        S.poly(W3,'#efe9d6',.82,.04,depth=1.2e3-pz)
        for j in range(3):
            ln=[(-.11,-.06+j*.045),(.09-(j%2)*.04,-.06+j*.045),(.09-(j%2)*.04,-.052+j*.045),(-.11,-.052+j*.045)]
            S.poly([(px+x*co-y*si,.007,pz+x*si+y*co) for x,y in ln],'#7d8d9a',.5,0,depth=1.2e3-pz-.5)
    fx,fz=-.05,1.65
    S.poly([(fx-.2,.007,fz-.15),(fx+.02,.007,fz-.15),(fx+.02,.007,fz+.15),(fx-.2,.007,fz+.15)],'#c79a35',.7,.05,depth=1.2e3-fz)
    S.poly([(fx+.02,.007,fz-.14),(fx+.24,.007,fz-.1),(fx+.24,.007,fz+.18),(fx+.02,.007,fz+.15)],'#a87d2a',.65,.05,depth=1.2e3-fz-1)
    lamp_pos=S.cam.scr(S.cam.cs((-.38,1.35,4.0)))
    return S,lamp_pos
if __name__=='__main__':
    S,lp=build()
    S.render('escritorio3d',glow=[(lp[0],lp[1],520,'#ffd08a',.42),(lp[0]+260,lp[1]+380,700,'#ffcf8a',.14)])
