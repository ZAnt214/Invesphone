from kit import *
from scenes1 import sp
def casal():
    S=Scene(Cam((-1.45,1.5,0.1),(0.45,0.95,3.4),fov=76,roll=2.2))
    R=Room(S,X0=-2.0,X1=2.1,Z0=-1,Z1=4.5,YH=2.55,wall='#45566c',floor='#5a4636',rug=(-1.0,1.7,1.6,3.8,'#4a3038'),seed=8)
    R.window('right',2.0,1.15,.95,1.1,night=True,curtain='#7d4d57')
    # cama
    bed(S,.35,3.3,1.7,2.1,0)
    for i in range(4): S.box((.35-.63+i*.42,.8,4.29),(.36,.5,.02),shade('#6a4a2a',.62),bias=-.5)
    S.box((.35,.36,2.22),(1.78,.4,.06),'#6a4a2a',bias=-.1)
    nightstand(S,-.75,4.15,0,'#7a5128',.58); nightstand(S,1.45,4.15,0,'#7a5128',.58)
    lamp(S,-.75,4.15,.58,.8)
    # celular antigo de Helena (cinza grafite, antena curta, tela monocromática)
    S.box((1.45,.65,4.1),(.1,.16,.03),'#4a4f55',yaw=-14,bias=-.9)
    S.cyl(1.41,4.1,.008,.73,.82,'#2f3338',bias=-.95,top=False)
    S.box((1.45,.69,4.083),(.065,.05,.004),'#9fc0a0',yaw=-14,bias=-.97)
    S.box((1.45,.62,4.083),(.07,.04,.004),'#2f3338',yaw=-14,bias=-.97)
    # guarda-roupa
    S.floor_shadow(-1.95,3.0,-1.35,4.4,2.0,.4)
    S.box((-1.62,1.05,3.72),(.62,2.1,1.2),'#7a5230',yaw=0)
    for k in range(2): S.box((-1.62+0.0,1.05,3.1),(.02,1.9,.02),'#2a1f14',bias=-.4)
    S.box((-1.3,1.05,3.1),(.03,1.9,.02),'#2a1f14',bias=-.4)
    for yy in (1.0,): S.cyl(-1.52,3.08,.02,yy,yy+.1,'#d6b257',bias=-.6,top=False)
    # chinelos e pufe
    S.box((-1.0,.025,2.0),(.11,.045,.27),'#8a5a40',yaw=25,bias=-.6); S.box((-.84,.025,2.06),(.11,.045,.27),'#8a5a40',yaw=-4,bias=-.6)
    S.floor_shadow(.9,1.8,1.4,2.3,.4,.35); S.cyl(1.15,2.05,.25,0,.4,'#7a62a0',r1=.22,bias=-.05)
    R.frame('back',1.3,1.7,.5,.4,'#4a3220','#4d6378')
    return S,[(*sp(S,(-.75,1.3,4.15)),520,'#ffd08a',.45)]
def livia():
    S=Scene(Cam((-1.3,1.5,0.1),(0.35,1.0,3.3),fov=76,roll=-2.0))
    R=Room(S,X0=-1.9,X1=1.9,Z0=-1,Z1=4.2,YH=2.55,wall='#56627c',floor='#5a4636',rug=None,seed=9)
    R.window('right',1.8,1.1,1.0,1.1,night=True,curtain='#7a6a8a')
    bed(S,-1.2,3.1,1.0,2.0,0,frame='#6a4a2a',sheet='#7a85c0',rumple=False,pill=('#eeeef6',))
    R.frame('back',-1.5,1.55,.5,.7,'#2a2a30','#b25a6a',scene='warm'); R.frame('back',-.85,1.6,.7,.5,'#2a2a30','#4f7a9a'); R.frame('back',-.0,1.5,.45,.65,'#2a2a30','#d6b257',scene='warm')
    # escrivaninha com computador de tubo
    table(S,1.0,3.75,1.3,.6,.74,'#8e5f30')
    S.box((1.0,.4,3.76),(.5,.5,.5),'#5a3a1d') if False else None
    S.box((.82,1.0,3.8),(.42,.36,.38),'#d2cdb8',bias=-.9); S.box((.82,.8+.12,3.58),(.34,.28,.02),'#4f6a7a',bias=-.95)
    scr=S.plane((.82,1.02,3.605),(1,0,0),(0,1,0)); S.shape(scr,rect(.3,.24,-.15,-.12),'#5d86a3',.6,.1,depth=3.6-1)
    S.box((.82,.79,3.6),(.38,.012,.14),'#bdb9a6',bias=-1.0); S.box((1.18,.9,3.78),(.1,.28,.3),'#cfcab5',bias=-.9)
    S.box((1.0,.25,3.8),(.2,.5,.4),'#cfcab5')
    R.frame('back',0.4,1.45,.9,.6,'#2a2a30','#8a9d6f',scene='warm') if False else None
    # estante com livros acima
    S.box((.95,1.55,4.05),(1.1,.03,.25),'#6a4a2a'); books(S,.45,1.45,1.565,4.07,.2,.3,.2,seed=3,bias=-.4)
    chair(S,.85,2.75,160,'#6a5a86','#7a6a96')
    # objetos
    S.floor_shadow(.12,1.7,.5,2.1,.3,.3)
    S.box((.3,.2,1.9),(.3,.4,.18),'#4a7a6a',yaw=20,bias=-.6); S.box((.3,.12,1.78),(.2,.16,.06),'#3a6a5a',yaw=20,bias=-.65)
    S.box((.22,.28,1.99),(.03,.3,.02),'#2f5a4c',yaw=20,bias=-.7); S.box((.38,.28,1.99),(.03,.3,.02),'#2f5a4c',yaw=20,bias=-.7)
    S.floor_shadow(-.9,.7,.0,1.5,.2,.3); S.cyl(-.4,1.1,.4,0,.18,'#a05a8a',r1=.37,bias=-.05)
    S.cyl(1.55,3.7,.12,0,.35,'#4a7a6a',r1=.14,bias=-.1)
    return S,[(*sp(S,(1.0,1.3,3.6)),460,'#bcd8ff',.28),(*sp(S,(0,1.8,2.0)),700,'#ffd9a0',.18)]
def canil():
    S=Scene(Cam((-1.5,1.4,0.1),(0.05,0.65,3.7),fov=76,roll=2.6))
    S.sky('#10202c','#2a4552')
    rnd=random.Random(4)
    for i in range(36): S.dot(rnd.uniform(0,1600),rnd.uniform(0,260),rnd.choice([1.5,2,2.5]),'#dfe8f5',rnd.uniform(.4,.9))
    S.dot(215,170,52,'#ebe6cc',.95)
    S.poly([(-9,0,-1),(9,0,-1),(9,0,14),(-9,0,14)],'#2c4a3a',.5,.12,depth=1.9e3)
    # grama: tufos curtos e finos, só longe da câmera (sem espinhos gigantes)
    for i in range(260):
        x=rnd.uniform(-3.5,4);z=rnd.uniform(1.4,7.6);hgt=.06+rnd.random()*.07
        for k in range(3):
            xx=x+k*.025
            S.poly([(xx,0.002,z),(xx+.014,0.002,z),(xx+.004+(k-1)*.012,hgt+k*.01,z+.004)],rnd.choice(['#3a6a48','#2f5a3c','#4a7a50']),.5,.05,depth=1.8e3-z)
    # cerca ao fundo (tábuas e travessas)
    for i in range(0,40):
        x=-4.5+i*.27;S.box((x,.85,8.3),(.22,1.7,.03),'#6a5240' if i%2 else '#74594a',bias=60)
    S.box((0,1.5,8.27),(11,.07,.03),'#5a4333',bias=59); S.box((0,.4,8.27),(11,.07,.03),'#5a4333',bias=59)
    # casa (caixa com duas faces visíveis, telhado e porta)
    hx0,hz0=1.3,4.6
    S.box((hx0+1.6,1.35,hz0+1.9),(3.2,2.7,3.8),'#8a7a62')
    S.box((hx0+1.6,2.76,hz0+1.9),(3.5,.14,4.1),'#4a3a2c',bias=-.2)
    hw=S.plane((hx0-.004,0,0),(0,0,1),(0,1,0))
    dh=float(S.cam.cs((hx0,1.35,hz0+1.9))[2]);k=[0]
    def D():
        k[0]+=.01;return dh-k[0]
    S.shape(hw,rect(1.0,1.0,hz0+.5,.95),'#241f1a',.3,0,depth=D())
    S.shape(hw,rect(.9,.9,hz0+.55,1.0),'#f2e3a0',.9,.05,depth=D())
    S.shape(hw,rect(.04,.9,hz0+1.0,1.0),'#4a3a2a',.4,0,depth=D()); S.shape(hw,rect(.9,.04,hz0+.55,1.43),'#4a3a2a',.4,0,depth=D())
    S.shape(hw,rect(1.0,2.05,hz0+2.3,0),'#2a2018',.3,0,depth=D()); S.shape(hw,rect(.88,1.97,hz0+2.36,0),'#5a4630',.45,.06,depth=D())
    S.shape(hw,[(hz0+3.1+.025*math.cos(i*PI/6),1.0+.025*math.sin(i*PI/6)) for i in range(12)],'#d6b257',.7,0,depth=D())
    S.box((hx0-.2,.06,hz0+2.8),(.4,.12,1.1),'#6a6258',bias=-.5)
    S.poly([(hx0,.01,hz0+.5),(hx0,.01,hz0+1.5),(hx0-1.7,.01,hz0+1.9),(hx0-1.7,.01,hz0-.1)],'#f2e3a0',.6,0,depth=1.7e3,op=.10,extra='filter="url(#bl2)"')
    # ---- canil
    kx,kz=-0.35,3.6;L,Rr,F,B=kx-.7,kx+.7,kz-.5,kz+.5
    S.floor_shadow(L-.1,F-.1,Rr+.1,B+.1,1.1,.5)
    d0=float(S.cam.cs((kx,.5,kz))[2]);j=[0]
    def E():
        j[0]+=.01;return d0-j[0]
    S.poly([(L,0,F),(L,0,B),(L,1.15,B),(L,.95,F)],'#a05a36',S.faceT(np.array([-1,0,0])),.06,depth=d0+.5)
    S.poly([(L,0,F),(Rr,0,F),(Rr,.95,F),(L,.95,F)],'#a8603a',S.faceT(np.array([0,0,-1])),.06,depth=d0+.4)
    fr=S.plane((L+.1,0,F-.004),(1,0,0),(0,1,0))
    S.shape(fr,rect(1.2,.7,0,.08),'#14100b',.3,0,depth=E())
    # cão sentado, de frente, dentro do canil
    cx=.6
    dp=S.plane((L+.1,0,F+.18),(1,0,0),(0,1,0));dd=E()
    def P(pts,col,t=.5,g=.1,o=1): S.shape(dp,pts,col,t,g,depth=E(),op=o)
    P([(cx-.27,.08),(cx+.27,.08),(cx+.30,.22),(cx+.22,.40),(cx+.12,.46),(cx-.12,.46),(cx-.22,.40),(cx-.30,.22)],'#6b4a2f')
    P([(cx-.10,.10),(cx+.10,.10),(cx+.12,.40),(cx-.12,.40)],'#a98456',.55,.08)
    P([(cx-.17,.08),(cx-.07,.08),(cx-.08,.34),(cx-.16,.34)],'#7a5636',.5,.1); P([(cx+.07,.08),(cx+.17,.08),(cx+.16,.34),(cx+.08,.34)],'#7a5636',.5,.1)
    P([(cx-.14,.44),(cx-.16,.58),(cx-.09,.69),(cx,.72),(cx+.09,.69),(cx+.16,.58),(cx+.14,.44),(cx+.07,.40),(cx-.07,.40)],'#7a5636',.55,.1)
    P([(cx-.17,.64),(cx-.22,.80),(cx-.07,.71)],'#4e331f',.4,.05); P([(cx+.17,.64),(cx+.22,.80),(cx+.07,.71)],'#4e331f',.4,.05)
    P([(cx-.075,.46),(cx+.075,.46),(cx+.08,.55),(cx+.04,.60),(cx-.04,.60),(cx-.08,.55)],'#c9a57a',.6,.08)
    P([(cx-.026,.555),(cx+.026,.555),(cx+.02,.59),(cx-.02,.59)],'#1b130d',.3,0)
    for ex in (-.07,.07):
        P([(cx+ex+.022*math.cos(i*PI/6),.635+.014*math.sin(i*PI/6)) for i in range(12)],'#f3e1a0',.9,0)
        P([(cx+ex+.008*math.cos(i*PI/6),.635+.008*math.sin(i*PI/6)) for i in range(12)],'#15100a',.3,0)
    P([(cx-.14,.43),(cx+.14,.43),(cx+.14,.405),(cx-.14,.405)],'#b03a3a',.5,.05); P([(cx+.012+.018*math.cos(i*PI/6),.385+.018*math.sin(i*PI/6)) for i in range(12)],'#e0c068',.8,0)
    # grade e postes
    gm=S.plane((L+.1,0,F-.01),(1,0,0),(0,1,0))
    for i in range(0,21): S.shape(gm,rect(.007,.74,i*.06,.06),'#b7bfc4',.6,0,depth=E()-.5,op=.8)
    for jj in range(0,13): S.shape(gm,rect(1.2,.007,0,.06+jj*.06),'#b7bfc4',.6,0,depth=E()-.5,op=.8)
    for ux,wd in ((-.06,.07),(1.2,.07)): S.shape(gm,rect(wd,.84,ux,0),'#9aa4aa',.55,.1,depth=E()-.6)
    S.shape(gm,rect(1.34,.07,-.06,.77),'#9aa4aa',.55,.1,depth=E()-.6)
    # telhado inclinado com espessura (baixo na frente, alto atrás)
    S.poly([(L-.08,.92,F-.12),(Rr+.08,.92,F-.12),(Rr+.08,1.2,B+.1),(L-.08,1.2,B+.1)],'#7a4a2a',.5,.1,depth=E()-.7)
    S.poly([(L-.08,.88,F-.12),(Rr+.08,.88,F-.12),(Rr+.08,.92,F-.12),(L-.08,.92,F-.12)],'#4a2d18',.35,0,depth=E()-.71)
    S.poly([(L-.08,.88,F-.12),(L-.08,.92,F-.12),(L-.08,1.2,B+.1),(L-.08,1.16,B+.1)],'#5a3820',.4,0,depth=E()-.71)
    # ferrolho por fora (lado direito, fechado) + cadeado
    lx=Rr-.02
    S.box((lx,.42,F-.03),(.14,.05,.014),'#aeb6bb',bias=-1.2); S.box((lx-.04,.42,F-.05),(.2,.022,.022),'#5c666c',bias=-1.25)
    S.box((lx+.05,.355,F-.06),(.05,.075,.02),'#d6b257',bias=-1.3)
    S.cyl(-1.35,2.5,.12,0,.05,'#2d6b8a',bias=0); S.cyl(.95,2.8,.06,0,.12,'#a24b3d',bias=0)
    return S,[(*sp(S,(hx0-.1,1.4,hz0+1.0)),620,'#ffe3a0',.30),(*sp(S,(kx,.5,F-.6)),380,'#ffd9a0',.12)]
def painel():
    S=Scene(Cam((-0.2,1.36,1.42),(0.035,1.4,2.0),fov=50,roll=3.5))
    R=Room(S,X0=-1.5,X1=1.5,Z0=-1,Z1=2.0,YH=2.5,wall='#5a6a76',floor='#4a4036',stripes=False,planks=False,wall_t=(.58,.45,.48),seed=2)
    kx,ky,kz=0.02,1.4,1.965
    S.floor_shadow(0,0,0,0,0,0) if False else None
    S.box((kx,ky,kz),(.17,.27,.03),'#c9ced2',g=.05)
    pl=S.plane((kx,ky,kz-.016),(1,0,0),(0,1,0))
    d0=float(S.cam.cs((kx,ky,kz-.016))[2]);L=[0]
    def D(): L[0]+=.001;return d0-L[0]
    S.shape(pl,rect(.16,.26,-.08,-.13),'#d9dde0',.7,.08,depth=D())
    S.shape(pl,rect(.12,.05,-.06,.055),'#1b2a24',.3,0,depth=D())
    S.shape(pl,rect(.11,.04,-.055,.06),'#8fcf9f',.7,.12,depth=D())
    S.text(pl,0,.07,'DESARMADO',.0165,'#143a28',depth=D(),font='DejaVu Sans Mono, monospace')
    for i,c in enumerate(('#3fbf6a','#a9b3b8','#a9b3b8')): S.shape(pl,[(-.05+i*.035+.007*math.cos(j*PI/6),.04+.007*math.sin(j*PI/6)) for j in range(12)],c,.8,0,depth=D())
    keys=['1','2','3','4','5','6','7','8','9','*','0','#']
    for i,k in enumerate(keys):
        a=-.052+(i%3)*.05;b=.017-(i//3)*.042
        S.shape(pl,rect(.04,.032,a-.02,b-.016),'#8a96a0',.4,.05,depth=D()); S.shape(pl,rect(.04,.027,a-.02,b-.011),'#b3bdc5',.6,.12,depth=D())
        S.text(pl,a,b-.008,k,.02,'#2a3138',depth=D())
    return S,[(*sp(S,(0,1.4,1.9)),420,'#e8f4ff',.18)]
def fechadura():
    S=Scene(Cam((-0.3,1.0,0.95),(0.0,1.02,1.5),fov=54,roll=-3.0))
    R=Room(S,X0=-1.2,X1=1.2,Z0=-1,Z1=1.5,YH=2.4,wall='#4a6275',floor='#4a4036',stripes=False,planks=False,wall_t=(.55,.45,.48),seed=2)
    pl=S.plane((0,1.0,1.485),(1,0,0),(0,1,0))
    for sx in (-1,1):
        S.shape(pl,rect(.36,1.0,sx*.5-.18+0,-.45),'#3a4f60',.45,.08,depth=1.485-.1)
        S.shape(pl,rect(.28,.92,sx*.5-.14,-.41),'#445b6d',.5,.06,depth=1.485-.15)
    def disk(r,col,t,d,g=.1): S.shape(pl,circ(r,40),col,t,g,depth=1.485-d)
    S.shape(pl,[(.0+.02*math.cos(i*PI/16)+.012,.0+.02*math.sin(i*PI/16)-.012) for i in range(32)],'#000000',.3,0,depth=1.485-.18,op=.0)
    disk(.105,'#a98238',.45,.2);disk(.098,'#c9a14a',.55,.21);disk(.07,'#8f6f30',.4,.22,.08);disk(.062,'#e0c068',.72,.23,.14)
    disk(.04,'#b79a58',.5,.24,.1);disk(.034,'#c9ad66',.55,.25,.06)
    S.shape(pl,[(-.006,-.03),(.006,-.03),(.006,.012),(-.006,.012)],'#1c1a14',.3,0,depth=1.485-.26); S.shape(pl,[(.009*math.cos(i*PI/8),.016+.009*math.sin(i*PI/8)) for i in range(16)],'#1c1a14',.3,0,depth=1.485-.26)
    S.shape(pl,[(-.07,.05),(-.03,.075),(.0,.082),(-.02,.07)],'#fff2c0',.9,0,depth=1.485-.27,op=.5)
    S.shape(pl,rect(.12,.04,-.06,-.19),'#cfd4d6',.55,.1,depth=1.485-.2) if False else None
    return S,[(*sp(S,(0,1.02,1.4)),300,'#ffe9b0',.28)]
def trava():
    S=Scene(Cam((-0.55,0.95,0.2),(0.12,0.82,1.6),fov=60,roll=3.0))
    S.sky('#1b2c38','#33505a')
    S.poly([(-3,0,-1),(3,0,-1),(3,0,7),(-3,0,7)],'#2c4a3a',.5,.12,depth=1.9e3)
    S.box((0.3,1.5,5.2),(30,3.4,.2),'#4f544f')
    for i in range(18):
        S.poly([(-3.4+i*.4,0,5.09),(-3.4+i*.4+.025,0,5.09),(-3.4+i*.4+.025,2.4,5.09),(-3.4+i*.4,2.4,5.09)],'#000000',.5,0,depth=5.0,op=.1)
    gm=S.plane((-1.0,0,1.6),(1,0,0),(0,1,0))
    for i in range(0,45): S.shape(gm,rect(.005,1.5,i*.05,0),'#b7bfc4',.6,0,depth=1.5,op=.75)
    for j in range(0,31): S.shape(gm,rect(2.2,.005,0,j*.05),'#b7bfc4',.6,0,depth=1.5,op=.75)
    for px in (.0,.22): S.cyl(px,1.58,.024,0,1.5,'#9aa4aa',t=.6,top=False,bias=-1)
    S.box((.235,.85,1.555),(.1,.16,.012),'#aeb6bb',bias=-2)
    for dy in (-.055,.055):
        for dx in (-.035,.035): S.cyl(.235+dx,1.549,.006,.85+dy-.003,.85+dy+.003,'#3d464b',bias=-2.2,top=False)
    S.box((.11,.85,1.55),(.25,.022,.022),'#6c767c',bias=-2.1)
    S.box((-.005,.85,1.55),(.07,.06,.022),'#aeb6bb',bias=-2.1); S.box((-.005,.82,1.545),(.026,.045,.016),'#5c666c',bias=-2.2)
    S.box((.235,.76,1.55),(.03,.1,.02),'#5c666c',bias=-2.15)
    S.cyl(-.5,2.6,.14,0,.32,'#2f6aa0',r1=.17,bias=0); S.cyl(1.2,2.0,.1,0,.04,'#9c3b34',bias=0)
    return S,[(*sp(S,(0.12,0.9,1.5)),380,'#ffe9b8',.25)]
def comparativo():
    import escritorio3d as E
    S,lp=E.build(Cam((-0.35,1.32,1.55),(0.45,0.82,3.9),fov=70,roll=-2.5))
    return S,[(*sp(S,(-.38,1.35,4.0)),520,'#ffd08a',.42)]
def fachada():
    S=Scene(Cam((-1.8,1.55,0.2),(1.0,1.5,7.0),fov=72,roll=-2.4))
    S.sky('#0d1626','#1b2a3e')
    rnd=random.Random(2)
    for i in range(40): S.dot(rnd.uniform(0,1600),rnd.uniform(0,300),rnd.choice([1.3,1.8,2.4]),'#dfe8f5',rnd.uniform(.4,.9))
    S.poly([(-9,0,-3),(9,0,-3),(9,0,5.2),(-9,0,5.2)],'#1e2530',.5,.08,depth=1.9e3)
    for i in range(14): S.poly([(-8+i*1.2,0.003,1.6),(-7.4+i*1.2,0.003,1.6),(-7.4+i*1.2,0.003,1.72),(-8+i*1.2,0.003,1.72)],'#c7a93a',.5,0,depth=1.8e3,op=.8)
    S.poly([(-9,.001,5.2),(9,.001,5.2),(9,.001,6.9),(-9,.001,6.9)],'#4a5260',.5,.08,depth=1.88e3)
    S.box((0,.07,5.2),(18,.14,.15),'#3b4350',bias=40)
    # fachada
    bw=S.plane((-3.2,0,6.9),(1,0,0),(0,1,0))
    S.box((.3,1.7,7.1),(7.2,3.4,.4),'#2d3a4d')
    S.shape(bw,rect(7.2,.4,0,3.0),'#222d3d',.4,.08,depth=6.5-.1)
    S.shape(bw,rect(5.2,.8,.7,2.15),'#1b2433',.35,.05,depth=6.5-.2); S.shape(bw,rect(5.0,.62,.8,2.24),'#3b4558',.5,.1,depth=6.5-.3)
    S.text(bw,3.3,2.33,'LAN HOUSE',.46,'#f2c94c',depth=6.5-.4,spacing=.03,font='Impact, Arial Black, sans-serif')
    S.shape(bw,rect(3.9,1.45,.45,.45),'#1a2230',.35,.05,depth=6.5-.2); S.shape(bw,rect(3.7,1.25,.55,.55),'#5aa0cf',.55,.1,depth=6.5-.3)
    S.shape(bw,rect(3.7,1.25,.55,.55),'#fff0b8',.5,0,depth=6.5-.31,op=.18)
    for k in range(4):
        x=.75+k*.88
        S.shape(bw,rect(.62,.5,x,.88),'#c7c1ac',.55,.1,depth=6.5-.4);S.shape(bw,rect(.5,.38,x+.06,.94),'#7ec0e8',.7,.12,depth=6.5-.45);S.shape(bw,rect(.3,.1,x+.16,.78),'#a39e8a',.5,0,depth=6.5-.4)
    S.shape(bw,rect(3.7,.28,.55,.55),'#6b4a2a',.45,.08,depth=6.5-.42)
    S.shape(bw,rect(.62,.5,.65,1.5),'#f1ead2',.82,.04,depth=6.5-.5)
    for j in range(3): S.shape(bw,rect(.46-(j%2)*.1,.03,.73,1.73-j*.1),'#6a6a6a',.5,0,depth=6.5-.55)
    S.shape(bw,rect(1.1,2.15,4.55,0),'#1a2230',.35,.05,depth=6.5-.2); S.shape(bw,rect(.95,2.0,4.62,0),'#566174',.5,.1,depth=6.5-.3)
    S.shape(bw,[(5.35+.04*math.cos(i*PI/8),1.0+.04*math.sin(i*PI/8)) for i in range(16)],'#d6c28a',.7,0,depth=6.5-.4)
    # poste
    S.cyl(2.7,5.9,.06,0,4.3,'#2a3340',t=.45,top=False,bias=-1)
    S.box((2.1,4.3,5.9),(1.3,.12,.12),'#2a3340',bias=-1.1); S.cyl(1.55,5.9,.2,4.18,4.3,'#f4c97a',t=.9,bias=-1.2)
    S.poly([(1.55,4.18,5.9),(.7,0.01,5.6),(2.5,0.01,5.6)],'#f4c97a',.6,0,depth=float(S.cam.cs((1.55,2,5.9))[2])+.3,op=.12)
    S.poly([(.2,.012,5.3),(3.0,.012,5.3),(3.0,.012,6.85),(.2,.012,6.85)],'#f4c97a',.6,0,depth=1.7e3,op=.07,extra='filter="url(#bl2)"')
    return S,[(*sp(S,(1.55,4.2,5.9)),520,'#ffd08a',.42),(*sp(S,(0.2,1.5,6.7)),700,'#bfe3ff',.18)]
if __name__=='__main__':
    for n,f in (('06_quarto_casal',casal),('07_quarto_livia',livia),('08_canil',canil),('09_painel',painel),('f1_fechadura',fechadura),('f2_trava',trava),('f3_comparativo',comparativo),('f4_fachada',fachada)):
        try:
            S,gl=f();S.render('c'+n,glow=gl);print('ok',n)
        except Exception as e:
            import traceback;print('FAIL',n);traceback.print_exc()
