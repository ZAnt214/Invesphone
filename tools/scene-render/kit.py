from engine import *
import random,math
PI=math.pi
def circ(r,n=28,a0=0): return [(r*math.cos(a0+2*PI*i/n),r*math.sin(a0+2*PI*i/n)) for i in range(n)]
def rect(w,h,ox=0,oy=0): return [(ox,oy),(ox+w,oy),(ox+w,oy+h),(ox,oy+h)]
def rot(dx,dz,yaw):
    a=math.radians(yaw);return dx*math.cos(a)+dz*math.sin(a),-dx*math.sin(a)+dz*math.cos(a)

class Room:
    """Casca de cômodo + camada de decoração nas paredes."""
    def __init__(s,S,X0=-2.1,X1=2.1,Z0=-1.0,Z1=4.4,YH=2.6,wall='#3b5266',floor='#5a4636',ceil='#2a3b49',
                 walls=('back','right','left'),seed=3,stripes=True,planks=True,stripe_op=.045,wall_t=(.55,.42,.46),floor_t=.62,rug=None):
        s.S=S;s.X0,s.X1,s.Z0,s.Z1,s.YH=X0,X1,Z0,Z1,YH;s.layer=0;random.seed(seed)
        S.poly([(X0,0,Z0),(X1,0,Z0),(X1,0,Z1),(X0,0,Z1)],floor,floor_t,.12,depth=1.9e3)
        if 'back' in walls: S.poly([(X0,0,Z1),(X1,0,Z1),(X1,YH,Z1),(X0,YH,Z1)],wall,wall_t[0],.13,depth=2e3)
        if 'right' in walls: S.poly([(X1,0,Z0),(X1,0,Z1),(X1,YH,Z1),(X1,YH,Z0)],wall,wall_t[1],.12,depth=2e3)
        if 'left' in walls: S.poly([(X0,0,Z0),(X0,0,Z1),(X0,YH,Z1),(X0,YH,Z0)],wall,wall_t[2],.12,depth=2e3)
        S.poly([(X0,YH,Z0),(X1,YH,Z0),(X1,YH,Z1),(X0,YH,Z1)],ceil,.25,0,depth=2e3)
        if stripes:
            if 'back' in walls:
                x=X0
                while x<X1:
                    S.poly([(x,0,Z1-.001),(x+.09,0,Z1-.001),(x+.09,YH,Z1-.001),(x,YH,Z1-.001)],'#ffffff',.5,0,depth=2e3-2,op=stripe_op);x+=.18
            for side,xx in (('right',X1-.001),('left',X0+.001)):
                if side in walls:
                    z=Z0
                    while z<Z1:
                        S.poly([(xx,0,z),(xx,0,z+.09),(xx,YH,z+.09),(xx,YH,z)],'#ffffff',.5,0,depth=2e3-2,op=stripe_op);z+=.18
        if planks:
            for i in range(int((X1-X0)/.16)+1):
                x=X0+i*.16
                S.poly([(x,0.001,Z0),(x+.006,0.001,Z0),(x+.006,0.001,Z1),(x,0.001,Z1)],'#000000',.5,0,depth=1.85e3,op=.22)
                for k in range(5):
                    zz=Z0+random.uniform(0,Z1-Z0)
                    S.poly([(x,0.001,zz),(x+.16,0.001,zz),(x+.16,0.001,zz+.006),(x,0.001,zz+.006)],'#000000',.5,0,depth=1.85e3,op=.15)
        bc='#2c3e4e'
        if 'back' in walls: S.box(((X0+X1)/2,.06,Z1-.02),(X1-X0,.12,.04),bc,depth=2e3-3)
        if 'right' in walls: S.box((X1-.02,.06,(Z0+Z1)/2),(.04,.12,Z1-Z0),bc,depth=2e3-3)
        if 'left' in walls: S.box((X0+.02,.06,(Z0+Z1)/2),(.04,.12,Z1-Z0),bc,depth=2e3-3)
        if rug:
            (rx0,rx1,rz0,rz1,rc)=rug
            S.poly([(rx0,.004,rz0),(rx1,.004,rz0),(rx1,.004,rz1),(rx0,.004,rz1)],rc,.5,.06,depth=1.7e3)
            S.poly([(rx0+.08,.005,rz0+.08),(rx1-.08,.005,rz0+.08),(rx1-.08,.005,rz1-.08),(rx0+.08,.005,rz1-.08)],shade(rc,.6),.5,.05,depth=1.69e3)
    def wp(s,wall):
        if wall=='back': return s.S.plane((0,0,s.Z1-.004),(1,0,0),(0,1,0))
        if wall=='right': return s.S.plane((s.X1-.004,0,0),(0,0,1),(0,1,0))
        return s.S.plane((s.X0+.004,0,0),(0,0,1),(0,1,0))
    def put(s,wall,pts,color,t=.5,g=0,op=1):
        s.layer+=.01;s.S.shape(s.wp(wall),pts,color,t,g,depth=2e3-5-s.layer,op=op)
    def frame(s,wall,a,b,w,h,c1='#4a3220',inner='#4d6378',scene='land',fw=.035):
        s.put(wall,rect(w,h,a,b),c1,.45,.06)
        s.put(wall,rect(w-2*fw,h-2*fw,a+fw,b+fw),inner,.5,.1)
        if scene=='land':
            iw,ih,ox,oy=w-2*fw,h-2*fw,a+fw,b+fw
            s.put(wall,[(ox,oy),(ox+iw,oy),(ox+iw,oy+ih*.5),(ox+iw*.78,oy+ih*.46),(ox+iw*.58,oy+ih*.56),(ox+iw*.38,oy+ih*.45),(ox+iw*.16,oy+ih*.54),(ox,oy+ih*.47)],'#2f4658',.5,.1)
            s.put(wall,[(ox,oy),(ox+iw,oy),(ox+iw,oy+ih*.24),(ox+iw*.7,oy+ih*.2),(ox+iw*.3,oy+ih*.27),(ox,oy+ih*.2)],'#26382d',.5,.1)
            s.put(wall,[(ox+iw*.74+iw*.07*math.cos(i*PI/10),oy+ih*.74+iw*.07*math.sin(i*PI/10)) for i in range(20)],'#ebe6cc',.8,0)
        elif scene=='warm':
            iw,ih,ox,oy=w-2*fw,h-2*fw,a+fw,b+fw
            s.put(wall,[(ox,oy),(ox+iw,oy),(ox+iw,oy+ih*.4),(ox,oy+ih*.55)],'#8a5a40',.5,.1)
    def window(s,wall,a,b,w,h,night=True,curtain=None):
        s.put(wall,rect(w,h,a,b),'#1f2a34',.4)
        iw,ih,ox,oy=w-.07,h-.07,a+.035,b+.035
        s.put(wall,rect(iw,ih,ox,oy),'#27415a' if night else '#9fc3dd',.5,.1)
        if night:
            s.put(wall,[(ox+iw*.22+.05*math.cos(i*PI/10),oy+ih*.72+.05*math.sin(i*PI/10)) for i in range(20)],'#e9e3c8',.8,0)
            s.put(wall,[(ox,oy),(ox+iw,oy),(ox+iw,oy+ih*.2),(ox+iw*.7,oy+ih*.17),(ox+iw*.4,oy+ih*.24),(ox,oy+ih*.18)],'#1c2f3c',.5,.1)
        else:
            s.put(wall,[(ox,oy),(ox+iw,oy),(ox+iw,oy+ih*.3),(ox+iw*.6,oy+ih*.26),(ox+iw*.3,oy+ih*.34),(ox,oy+ih*.28)],'#6f9a74',.5,.1)
            s.put(wall,[(ox+iw*.68,oy+ih*.2),(ox+iw*.72,oy+ih*.2),(ox+iw*.72,oy+ih*.5),(ox+iw*.68,oy+ih*.5)],'#5a4630',.4)
            s.put(wall,[(ox+iw*.7+iw*.14*math.cos(i*PI/10),oy+ih*.56+iw*.14*math.sin(i*PI/10)) for i in range(20)],'#4a8a5a',.5,.1)
        s.put(wall,rect(.03,ih,ox+iw/2-.015,oy),'#1f2a34',.4)
        s.put(wall,rect(iw,.03,ox,oy+ih/2-.015),'#1f2a34',.4)
        if curtain:
            s.put(wall,[(a-.2,b-.08),(a+.14,b-.08),(a+.1,b+h*.5),(a+.16,b+h+.1),(a-.2,b+h+.1)],curtain,.45,.1)
            s.put(wall,[(a+w+.2,b-.08),(a+w-.14,b-.08),(a+w-.1,b+h*.5),(a+w-.16,b+h+.1),(a+w+.2,b+h+.1)],curtain,.45,.1)
        # peitoril
        return
    def door(s,wall,a,b0=0,w=.92,h=2.05,color='#8a5a32',knob='right',closed=True,panels=True):
        s.put(wall,rect(w+.12,h+.06,a-.06,b0),'#1e2a35',.35)
        s.put(wall,rect(w,h,a,b0),color,.5,.08)
        if panels:
            for (px,py,pw,ph) in [(.1,.12,.32,.8),(w-.42,.12,.32,.8),(.1,1.08,.32,.82),(w-.42,1.08,.32,.82)]:
                s.put(wall,rect(pw,ph,a+px,b0+py),shade(color,.62),.5,.04)
        kx=a+(w-.1 if knob=='right' else .1)
        s.put(wall,[(kx+.035*math.cos(i*PI/8),b0+1.0+.035*math.sin(i*PI/8)) for i in range(16)],'#d6b257',.7,.1)

def books(S,x0,x1,yb,zc,h0=.24,h1=.38,depth=.2,seed=1,cols=None,bias=-.05,axis='x'):
    rnd=random.Random(seed);cols=cols or ['#7a2f33','#2f5a78','#c9a14a','#3f7a58','#5a4a8a','#a8552e','#355a6a','#8a3d4a','#b5733a','#3d5a7a','#6b8a3d']
    x=x0
    while x<x1-.04:
        bw=rnd.choice([.03,.035,.04,.05,.06]);bh=rnd.uniform(h0,h1);c=rnd.choice(cols)
        S.box((x+bw/2,yb+bh/2,zc),(bw,bh,depth),c,bias=bias);x+=bw+.004

def paper(S,px,pz,r,depth=1.2e3,size=(.30,.21),lines=3,color='#efe9d6'):
    co,si=math.cos(r),math.sin(r);w,h=size
    pts=[(-w/2,-h/2),(w/2,-h/2),(w/2,h/2),(-w/2,h/2)]
    S.poly([(px+x*co-y*si,.006,pz+x*si+y*co) for x,y in pts],color,.82,.04,depth=depth-pz)
    for j in range(lines):
        ln=[(-w*.37,-h*.28+j*h*.2),(w*.3-(j%2)*w*.12,-h*.28+j*h*.2),(w*.3-(j%2)*w*.12,-h*.28+j*h*.2+.008),(-w*.37,-h*.28+j*h*.2+.008)]
        S.poly([(px+x*co-y*si,.007,pz+x*si+y*co) for x,y in ln],'#7d8d9a',.5,0,depth=depth-pz-.5)

def lamp(S,x,z,y0,scale=1.0,bias=-.9):
    S.cyl(x,z,.085*scale,y0,y0+.03*scale,'#6a5326',bias=bias)
    S.cyl(x,z,.012*scale,y0+.03*scale,y0+.43*scale,'#7a6430',bias=bias-.02,top=False)
    S.cyl(x,z,.17*scale,y0+.40*scale,y0+.62*scale,'#e9d9a4',r1=.095*scale,t=.88,bias=bias-.05)

def chair(S,cx,cz,yw,seat='#2d4a69',back='#35567a'):
    S.floor_shadow(cx-.28,cz-.28,cx+.28,cz+.28,.5,.4)
    S.cyl(cx,cz,.03,.13,.43,'#1e262e',top=False,bias=-.2)
    for k in range(5):
        a=math.radians(72*k+yw);ex,ez=cx+.27*math.cos(a),cz+.27*math.sin(a)
        S.poly([(cx-.02*math.sin(a),.07,cz+.02*math.cos(a)),(cx+.02*math.sin(a),.07,cz-.02*math.cos(a)),(ex+.015*math.sin(a),.07,ez-.015*math.cos(a)),(ex-.015*math.sin(a),.07,ez+.015*math.cos(a))],'#1b2229',.4,0,bias=-.1)
        S.cyl(ex,ez,.03,0,.07,'#0f1317',bias=-.1,t=.4)
    S.box((cx,.46,cz),(.46,.08,.44),seat,yaw=yw,bias=-.3)
    dx,dz=rot(0,-.2,yw)
    S.box((cx+dx,.78,cz+dz),(.42,.42,.07),back,yaw=yw,bias=-.35)
    S.box((cx+dx*.9,.52,cz+dz*.9),(.09,.14,.06),'#26394f',yaw=yw,bias=-.33)

def plant(S,x,z,y0=0,pot='#a3573a',s=1.0,bias=0):
    S.cyl(x,z,.11*s,y0,y0+.22*s,pot,r1=.13*s,bias=bias)
    for k in range(7):
        a=k*PI*2/7+.3;h=.35*s+.1*s*(k%3)
        pts=[(x+.02*math.cos(a+1.57),y0+.22*s,z+.02*math.sin(a+1.57)),(x-.02*math.cos(a+1.57),y0+.22*s,z-.02*math.sin(a+1.57)),(x+.22*s*math.cos(a),y0+.22*s+h,z+.22*s*math.sin(a))]
        S.poly(pts,['#3f7a4a','#4f9058','#356a40'][k%3],.55,.05,depth=float(S.cam.cs((x,y0+.4,z))[2])+bias-.1)

def sofa(S,cx,cz,w=2.0,yaw=0,color='#9a7a56',pillows=('#a24b3d','#d6b257','#3d6a8a')):
    d=.9;S.floor_shadow(cx-w/2,cz-d/2,cx+w/2,cz+d/2,.8,.45)
    bx,bz=rot(0,d/2-.1,yaw)
    S.box((cx+bx,.52,cz+bz),(w,.84,.2),shade(color,.5),yaw=yaw)
    S.box((cx,.24,cz),(w,.38,d),color,yaw=yaw)
    for sgn in (-1,1):
        ax,az=rot(sgn*(w/2-.1),0,yaw);S.box((cx+ax,.42,cz+az),(.2,.6,d),shade(color,.5),yaw=yaw,bias=-.1)
    n=3;cw=(w-.4)/n
    for i in range(n):
        ox,oz=rot(-(w-.4)/2+cw*(i+.5),-.05,yaw);S.box((cx+ox,.47,cz+oz),(cw-.02,.13,d-.25),shade(color,.58),yaw=yaw,bias=-.2)
    for i,pc in enumerate(pillows):
        ox,oz=rot(-(w-.4)/2+cw*(i+.5)+(0.05 if i==1 else 0),.2,yaw)
        S.box((cx+ox,.66,cz+oz),(.36,.36,.12),pc,yaw=yaw+(10 if i==1 else -8),bias=-.4)

def table(S,cx,cz,w,d,h,color='#a97a48',yaw=0,top=.045,legs=.06,cloth=None):
    S.floor_shadow(cx-w/2,cz-d/2,cx+w/2,cz+d/2,h,.4)
    for sx in (-1,1):
        for sz in (-1,1):
            ox,oz=rot(sx*(w/2-.06),sz*(d/2-.06),yaw);S.box((cx+ox,h/2,cz+oz),(legs,h,legs),shade(color,.4),yaw=yaw)
    S.box((cx,h,cz),(w,top,d),color,yaw=yaw,bias=-.2)
    if cloth: S.box((cx,h+top/2+.004,cz),(w+.02,.01,d+.02),cloth,yaw=yaw,bias=-.22)

def bed(S,cx,cz,w=1.6,l=2.0,yaw=0,frame='#6a4a2a',sheet='#b9c4d0',rumple=True,pill=('#f2f5f8','#e8edf2')):
    S.floor_shadow(cx-w/2-.05,cz-l/2-.05,cx+w/2+.05,cz+l/2+.05,.6,.45)
    S.box((cx,.2,cz),(w+.08,.28,l+.08),frame,yaw=yaw)
    S.box((cx,.42,cz),(w,.22,l),sheet,yaw=yaw,bias=-.1)
    hx_,hz_=rot(0,l/2+.04,yaw)
    S.box((cx+hx_,.75,cz+hz_),(w+.1,.95,.08),shade(frame,.5),yaw=yaw)
    n=len(pill)
    for i,pc in enumerate(pill):
        ox,oz=rot(-w/2+(i+.5)*w/n,l/2-.28,yaw);S.box((cx+ox,.56,cz+oz),(w/n-.1,.1,.4),pc,yaw=yaw,bias=-.3)
    if rumple:
        ox,oz=rot(-.1,-.15,yaw);S.box((cx+ox,.55,cz+oz),(w*.8,.07,l*.55),shade(sheet,.46),yaw=yaw+4,bias=-.25)
        ox,oz=rot(.2,-.55,yaw);S.box((cx+ox,.57,cz+oz),(w*.5,.07,.4),shade(sheet,.6),yaw=yaw-12,bias=-.3)

def nightstand(S,cx,cz,yaw=0,color='#7a5128',h=.55):
    S.floor_shadow(cx-.2,cz-.18,cx+.2,cz+.18,h,.4)
    S.box((cx,h/2,cz),(.4,h,.36),color,yaw=yaw)
    S.box((cx,h,cz),(.44,.03,.4),shade(color,.7),yaw=yaw,bias=-.2)
    ox,oz=rot(0,-.185,yaw)
    S.box((cx+ox,h*.62,cz+oz),(.34,.18,.02),shade(color,.65),yaw=yaw,bias=-.3)
    S.box((cx+ox,h*.62,cz+oz*1.05),(.1,.02,.02),'#d6b257',yaw=yaw,bias=-.35)
    S.box((cx+ox,h*.28,cz+oz),(.34,.18,.02),shade(color,.65),yaw=yaw,bias=-.3)
    S.box((cx+ox,h*.28,cz+oz*1.05),(.1,.02,.02),'#d6b257',yaw=yaw,bias=-.35)
