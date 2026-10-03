"""Mini motor de cena em perspectiva: formas planas com sombreamento suave, sem contorno (técnica dos retratos)."""
import numpy as np, math, random, subprocess, os
W,H=1600,1200
def hx(c): c=c.lstrip('#'); return np.array([int(c[i:i+2],16) for i in (0,2,4)],float)
def tohex(v): v=np.clip(v,0,255).astype(int); return '#%02x%02x%02x'%tuple(v)
DARK=hx('#0c1620');HIGH=hx('#f6e2b4')
def shade(c,t):
    c=hx(c) if isinstance(c,str) else c
    dark=c*0.34+DARK*0.40
    if t<=.5: return tohex(dark*(1-2*t)+c*(2*t))
    k=(t-.5)*2*0.55
    return tohex(c*(1-k)+(c*0.6+HIGH*0.4)*k)

class Cam:
    def __init__(s,pos,target,fov=74,roll=0):
        s.p=np.array(pos,float);f=np.array(target,float)-s.p;f/=np.linalg.norm(f)
        r=np.cross([0,1,0],f);r/=np.linalg.norm(r);u=np.cross(f,r)
        c,sn=math.cos(math.radians(roll)),math.sin(math.radians(roll))
        s.f=f;s.r=r*c+u*sn;s.u=-r*sn+u*c
        s.foc=(W/2)/math.tan(math.radians(fov/2))
    def cs(s,p): d=np.array(p,float)-s.p;return np.array([d@s.r,d@s.u,d@s.f])
    def scr(s,q): return (W/2+s.foc*q[0]/q[2],H/2-s.foc*q[1]/q[2])

class Scene:
    def __init__(s,cam,light=(-0.45,0.8,-0.4)):
        s.cam=cam;l=np.array(light,float);s.L=l/np.linalg.norm(l);s.items=[];s.defs=[];s.gid=0;s.over=[]
    def clip(s,pts):
        near=0.12;out=[]
        n=len(pts)
        for i in range(n):
            a,b=pts[i],pts[(i+1)%n];ina,inb=a[2]>=near,b[2]>=near
            if ina: out.append(a)
            if ina!=inb:
                t=(near-a[2])/(b[2]-a[2]);out.append(a+(b-a)*t)
        return out
    def project(s,pts3):
        q=[s.cam.cs(p) for p in pts3];q=s.clip(q)
        if len(q)<3: return None,None
        sc=[s.cam.scr(x) for x in q]
        return sc,float(np.mean([x[2] for x in q]))
    def d(s,sc): return 'M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in sc)+' Z'
    def grad(s,c1,c2,horiz=False):
        s.gid+=1;i=f'g{s.gid}'
        x2,y2=('1','0') if horiz else ('0','1')
        s.defs.append(f'<linearGradient id="{i}" x1="0" y1="0" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>')
        return f'url(#{i})'
    def poly(s,pts3,color,t=.5,g=.07,horiz=False,depth=None,extra='',op=1,bias=0):
        sc,dp=s.project(pts3)
        if sc is None: return
        fill=s.grad(shade(color,min(1,t+g)),shade(color,max(0,t-g)),horiz) if g else shade(color,t)
        dd=(dp if depth is None else depth)+bias
        s.items.append((dd,f'<path d="{s.d(sc)}" fill="{fill}" opacity="{op}" {extra}/>'))
    def raw(s,depth,svg): s.items.append((depth,svg))
    def faceT(s,n): return .30+.62*max(0.0,float(np.dot(n,s.L)))
    def box(s,c,size,color,yaw=0,tops=True,g=.06,bias=0,t_add=0,skip=(),depth=None):
        cx,cy,cz=c;w,h,d=size;a=math.radians(yaw);ca,sa=math.cos(a),math.sin(a)
        def P(x,y,z): return (cx+x*ca+z*sa,cy+y,cz-x*sa+z*ca)
        hw,hh,hd=w/2,h/2,d/2
        faces={'front':([(-hw,-hh,-hd),(hw,-hh,-hd),(hw,hh,-hd),(-hw,hh,-hd)],(sa*0+(-sa),0,-ca)),
               'back':([(hw,-hh,hd),(-hw,-hh,hd),(-hw,hh,hd),(hw,hh,hd)],(sa,0,ca)),
               'left':([(-hw,-hh,hd),(-hw,-hh,-hd),(-hw,hh,-hd),(-hw,hh,hd)],(-ca,0,sa)),
               'right':([(hw,-hh,-hd),(hw,-hh,hd),(hw,hh,hd),(hw,hh,-hd)],(ca,0,-sa)),
               'top':([(-hw,hh,-hd),(hw,hh,-hd),(hw,hh,hd),(-hw,hh,hd)],(0,1,0))}
        ctr=np.array([cx,cy,cz]);dep=depth
        for k,(pts,n) in faces.items():
            if k in skip: continue
            n=np.array(n,float);pts3=[P(*q) for q in pts]
            fc=np.mean(pts3,axis=0)
            if np.dot(n,s.cam.p-fc)<=0: continue
            tt=s.faceT(n)+t_add
            s.poly(pts3,color,tt,g if k!='top' else g*.4,depth=(dep if dep is not None else float(s.cam.cs(ctr)[2])),bias=bias)
    def hull(s,pts):
        pts=sorted(set((round(x,1),round(y,1)) for x,y in pts))
        if len(pts)<3: return pts
        def cr(o,a,b): return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
        lo=[]
        for p in pts:
            while len(lo)>=2 and cr(lo[-2],lo[-1],p)<=0: lo.pop()
            lo.append(p)
        up=[]
        for p in reversed(pts):
            while len(up)>=2 and cr(up[-2],up[-1],p)<=0: up.pop()
            up.append(p)
        return lo[:-1]+up[:-1]
    def ring(s,cx,y,cz,r,n=28):
        return [(cx+r*math.cos(2*math.pi*i/n),y,cz+r*math.sin(2*math.pi*i/n)) for i in range(n)]
    def cyl(s,cx,cz,r,y0,y1,color,r1=None,t=.55,top=True,bias=0):
        r1=r if r1 is None else r1
        a=s.ring(cx,y0,cz,r);b=s.ring(cx,y1,cz,r1)
        sa=[s.project([p])[0] for p in []]
        P=[]
        for p in a+b:
            q=s.cam.cs(p)
            if q[2]<.12: return
            P.append(s.cam.scr(q))
        h=s.hull(P);dp=float(s.cam.cs((cx,(y0+y1)/2,cz))[2])
        xs=[x for x,_ in h]
        fill=s.grad(shade(color,t+.22),shade(color,t-.2),True)
        s.items.append((dp+bias,f'<path d="{s.d(h)}" fill="{fill}"/>'))
        if top:
            tp=[s.cam.scr(s.cam.cs(p)) for p in b]
            s.items.append((dp+bias-.001,f'<path d="{s.d(tp)}" fill="{shade(color,min(1,t+.28))}"/>'))
    def plane(s,o,u,v): 
        o,u,v=map(lambda x:np.array(x,float),(o,u,v));return lambda a,b:o+u*a+v*b
    def shape(s,pl,uv,color,t=.5,g=0,depth=None,op=1,bias=0):
        s.poly([pl(a,b) for a,b in uv],color,t,g,depth=depth,op=op,bias=bias)
    def text(s,pl,a,b,txt,size,color,depth=0,weight='700',anchor='middle',font='DejaVu Sans, Arial, sans-serif',bias=0,spacing=0):
        p0=s.cam.scr(s.cam.cs(pl(a,b)));pu=s.cam.scr(s.cam.cs(pl(a+1,b)));pv=s.cam.scr(s.cam.cs(pl(a,b+1)))
        ux,uy=pu[0]-p0[0],pu[1]-p0[1];vx,vy=pv[0]-p0[0],pv[1]-p0[1]
        s.items.append((depth+bias,f'<text transform="matrix({ux:.3f},{uy:.3f},{-vx:.3f},{-vy:.3f},{p0[0]:.1f},{p0[1]:.1f})" font-family="{font}" font-weight="{weight}" font-size="{size}" fill="{color}" text-anchor="{anchor}" letter-spacing="{spacing}">{txt}</text>'))
    def sky(s,top,bottom,hy=None):
        i=s.grad(top,bottom);s.items.append((9e3,f'<rect width="{W}" height="{H}" fill="{i}"/>'))
    def dot(s,x,y,r,color,op=1,depth=8.5e3): s.items.append((depth,f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{color}" opacity="{op}"/>'))
    def floor_shadow(s,x0,z0,x1,z1,h,o=.42,depth=1e3):
        dx,dz=h*.42,h*.30
        pts=[(x0,z0),(x1,z0),(x1,z1),(x0,z1),(x0+dx,z0+dz),(x1+dx,z0+dz),(x1+dx,z1+dz),(x0+dx,z1+dz)]
        hl=s.hull([(a,b) for a,b in pts])
        sc,_=s.project([(a,0.002,b) for a,b in hl])
        if sc: s.items.append((depth,f'<path d="{s.d(sc)}" fill="#04080c" opacity="{o}" filter="url(#bl)"/>'))
        pts2=[(x0-.04,z0-.04),(x1+.04,z0-.04),(x1+.04,z1+.04),(x0-.04,z1+.04)]
        sc,_=s.project([(a,0.003,b) for a,b in pts2])
        if sc: s.items.append((depth,f'<path d="{s.d(sc)}" fill="#04080c" opacity="{o*.9}" filter="url(#bl2)"/>'))
    def render(s,name,glow=None,tag=None):
        s.items.sort(key=lambda x:-x[0])
        defs=''.join(s.defs)+'<filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter><filter id="bl2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter><radialGradient id="vg" cx="50%" cy="50%" r="75%"><stop offset="52%" stop-color="#05090d" stop-opacity="0"/><stop offset="100%" stop-color="#05090d" stop-opacity=".62"/></radialGradient><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .06 0"/></filter>'
        gl=''
        if glow:
            for (gx,gy,gr,gc,go) in glow:
                gl+=f'<radialGradient id="gl{gx}" cx="{gx}" cy="{gy}" r="{gr}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{gc}" stop-opacity="{go}"/><stop offset="1" stop-color="{gc}" stop-opacity="0"/></radialGradient>'
                s.over.append(f'<rect width="{W}" height="{H}" fill="url(#gl{gx})"/>')
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs>{defs}{gl}</defs><rect width="{W}" height="{H}" fill="#0b141c"/>'+''.join(x[1] for x in s.items)+''.join(s.over)+f'<rect width="{W}" height="{H}" fill="url(#vg)"/><rect width="{W}" height="{H}" filter="url(#gr)"/></svg>'
        open(name+'.svg','w').write(svg)
        js=f"let pw;try{{pw=require('playwright')}}catch(e){{pw=require('/opt/node22/lib/node_modules/playwright')}}const {{chromium}}=pw;(async()=>{{const b=await chromium.launch();const pg=await b.newPage({{viewport:{{width:{W},height:{H}}}}});await pg.goto('file://'+process.cwd()+'/{name}.svg');await pg.screenshot({{path:'{name}.png'}});await b.close()}})()"
        subprocess.run(['node','-e',js],check=True)
