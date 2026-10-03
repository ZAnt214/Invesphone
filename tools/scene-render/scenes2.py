from kit import *
from scenes1 import sp
def casal():
    S=Scene(Cam((-1.45,1.5,0.1),(0.45,0.95,3.4),fov=76,roll=2.2))
    R=Room(S,X0=-2.0,X1=2.1,Z0=-1,Z1=4.5,YH=2.55,wall='#45566c',floor='#5a4636',rug=(-1.0,1.7,1.6,3.8,'#4a3038'),seed=8)
    R.window('right',2.0,1.15,.95,1.1,night=True,curtain='#7d4d57')
    # cama
    bed(S,.35,3.3,1.7,2.1,0)
    for i in range(4): S.box((.35-.62+i*.41,1.18,4.425),(.36,.42,.03),shade('#6a4a2a',.62),bias=-.5)
    nightstand(S,-.75,4.15,0,'#7a5128',.58); nightstand(S,1.45,4.15,0,'#7a5128',.58)
    lamp(S,-.75,4.15,.58,.8)
    # celular antigo de Helena (cinza grafite, antena curta, tela monocromática)
    S.box((1.45,.64,4.1),(.07,.12,.025),'#4a4f55',yaw=-10,bias=-.9)
    S.cyl(1.44,4.1,.006,.70,.75,'#2f3338',bias=-.95,top=False)
    S.box((1.45,.67,4.085),(.045,.04,.004),'#9fc0a0',yaw=-10,bias=-.97)
    # guarda-roupa
    S.floor_shadow(-1.95,3.0,-1.35,4.4,2.0,.4)
    S.box((-1.62,1.05,3.72),(.62,2.1,1.2),'#7a5230',yaw=0)
    for k in range(2): S.box((-1.62+0.0,1.05,3.1),(.02,1.9,.02),'#2a1f14',bias=-.4)
    S.box((-1.3,1.05,3.1),(.03,1.9,.02),'#2a1f14',bias=-.4)
    for yy in (1.0,): S.cyl(-1.52,3.08,.02,yy,yy+.1,'#d6b257',bias=-.6,top=False)
    # chinelos e pufe
    S.box((-.15,.04,2.55),(.12,.04,.28),'#8a5a40',yaw=20,bias=-.6); S.box((.02,.04,2.6),(.12,.04,.28),'#8a5a40',yaw=-8,bias=-.6)
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
    S.box((-.35,.07,2.1),(.3,.14,.24),'#4a7a6a',yaw=20,bias=-.6)  # mochila
    S.box((-.05,.04,2.0),(.1,.07,.26),'#e8e8f0',yaw=40,bias=-.6); S.box((.12,.04,2.05),(.1,.07,.26),'#c24a3a',yaw=15,bias=-.6)
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
    # grama
    for i in range(160):
        x=rnd.uniform(-3,3.5);z=rnd.uniform(.3,8)
        S.poly([(x,0.002,z),(x+.03,0.002,z),(x+.012,.13+rnd.random()*.1,z+.01)],rnd.choice(['#3a6a48','#2f5a3c','#4a7a50']),.5,.05,depth=1.8e3-z)
    # cerca
    for i in range(0,34):
        x=-4+i*.27;S.box((x,.85,8.0),(.22,1.7,.03),'#6a5240' if i%2 else '#74594a',bias=60)
    S.box((0,1.55,7.97),(9.6,.07,.03),'#5a4333',bias=59); S.box((0,.4,7.97),(9.6,.07,.03),'#5a4333',bias=59)
    # casa
    S.box((3.2,1.3,6.2),(.2,2.6,4.8),'#8a7a62'); 
    hw=S.plane((2.09,0,0),(0,0,1),(0,1,0))
    S.shape(hw,rect(.9,1.0,5.0,1.0),'#2a2a2a',.3,0,depth=6.2-.2)
    S.shape(hw,rect(.8,.9,5.05,1.05),'#f2e3a0',.9,.05,depth=6.2-.3)
    S.shape(hw,rect(.04,.9,5.45,1.05),'#4a3a2a',.4,0,depth=6.2-.4)
    S.shape(hw,rect(.9,2.0,6.6,0),'#5a4630',.4,.06,depth=6.2-.3); S.shape(hw,[(7.0+.02*math.cos(i),1.0+.02*math.sin(i)) for i in range(0,7)],'#d6b257',.7,0,depth=6.2-.5)
    S.poly([(2.09,0,4.3),(2.09,0,5.9),(0.7,0,5.5),(0.3,0,4.2)],'#e8d9a0',.5,0,depth=1.8e3-30,op=.12)
    # canil
    kx,kz=-0.45,3.9
    S.floor_shadow(kx-.8,kz-.6,kx+.8,kz+.6,1.1,.5)
    S.box((kx,.45,kz+.1),(1.5,.9,1.1),'#a05a36')
    fr=S.plane((kx-.65,0,kz-.46),(1,0,0),(0,1,0))
    S.shape(fr,rect(1.3,.7,0,.05),'#16100b',.3,0,depth=kz-.5)
    # cão dentro (plano ao fundo)
    dp=S.plane((kx-.65,0,kz-.30),(1,0,0),(0,1,0))
    cx=.65
    S.shape(dp,[(cx-.28,.05),(cx+.3,.05),(cx+.28,.35),(cx+.12,.52),(cx-.12,.52),(cx-.26,.35)],'#6b4a2f',.5,.1,depth=kz-.6)
    S.shape(dp,[(cx-.14,.48),(cx+.14,.48),(cx+.17,.64),(cx+.08,.76),(cx-.08,.76),(cx-.17,.64)],'#7a5636',.5,.1,depth=kz-.65)
    S.shape(dp,[(cx-.17,.7),(cx-.2,.82),(cx-.08,.76)],'#4e331f',.4,0,depth=kz-.66); S.shape(dp,[(cx+.17,.7),(cx+.2,.82),(cx+.08,.76)],'#4e331f',.4,0,depth=kz-.66)
    S.shape(dp,[(cx-.08,.55),(cx+.08,.55),(cx+.07,.64),(cx-.07,.64)],'#c9a57a',.6,0,depth=kz-.67)
    S.shape(dp,[(cx-.025,.62),(cx+.025,.62),(cx+.02,.65),(cx-.02,.65)],'#1b130d',.3,0,depth=kz-.68)
    for ex in (-.075,.075): S.shape(dp,[(cx+ex+.014*math.cos(i*PI/5),.69+.014*math.sin(i*PI/5)) for i in range(10)],'#f3e1a0',.9,0,depth=kz-.68)
    S.shape(dp,[(cx-.15,.48),(cx+.15,.48),(cx+.15,.45),(cx-.15,.45)],'#b03a3a',.5,0,depth=kz-.66); S.shape(dp,[(cx+.02+.018*math.cos(i*PI/5),.43+.018*math.sin(i*PI/5)) for i in range(10)],'#e0c068',.8,0,depth=kz-.67)
    # grade (malha) e postes
    gm=S.plane((kx-.65,0,kz-.47),(1,0,0),(0,1,0))
    for i in range(0,27): S.shape(gm,rect(.008,.7,i*.05,.05),'#b7bfc4',.6,0,depth=kz-.8,op=.85)
    for j in range(0,15): S.shape(gm,rect(1.3,.008,0,.05+j*.05),'#b7bfc4',.6,0,depth=kz-.8,op=.85)
    S.shape(gm,rect(.07,.78,-.04,.0),'#9aa4aa',.55,.1,depth=kz-.9); S.shape(gm,rect(.07,.78,1.27,.0),'#9aa4aa',.55,.1,depth=kz-.9); S.shape(gm,rect(1.4,.07,-.04,.74),'#9aa4aa',.55,.1,depth=kz-.9)
    # telhado
    S.poly([(kx-.85,.9,kz-.5),(kx+.85,.9,kz-.5),(kx+.85,1.28,kz+.1),(kx-.85,1.28,kz+.1)],'#7a4a2a',.45,.1,bias=-.5)
    S.poly([(kx-.85,1.28,kz+.1),(kx+.85,1.28,kz+.1),(kx+.85,.9,kz+.7),(kx-.85,.9,kz+.7)],'#5a3820',.3,.1,bias=-.5)
    # ferrolho por fora (lateral direita, fechado) + cadeado
    lx=kx+.74
    S.box((lx,.42,kz-.48),(.16,.05,.015),'#aeb6bb',bias=-1.2); S.box((lx-.03,.42,kz-.50),(.2,.02,.02),'#5c666c',bias=-1.25)
    S.box((lx+.05,.36,kz-.51),(.05,.07,.02),'#d6b257',bias=-1.3)
    # objetos
    S.cyl(-1.35,2.5,.12,0,.05,'#2d6b8a',bias=-.1); S.cyl(.9,2.8,.06,0,.12,'#a24b3d',bias=-.1)
    return S,[(*sp(S,(2.0,1.4,5.2)),600,'#ffe3a0',.32),(*sp(S,(kx,.5,kz-.6)),380,'#ffd9a0',.12)]
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
    S.box((0.3,1.2,5.2),(8,2.4,.2),'#5f6258')
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
    S.shape(bw,rect(3.9,1.7,.45,.5),'#1a2230',.35,.05,depth=6.5-.2); S.shape(bw,rect(3.7,1.5,.55,.6),'#5aa0cf',.55,.1,depth=6.5-.3)
    S.shape(bw,rect(3.7,1.5,.55,.6),'#fff0b8',.5,0,depth=6.5-.31,op=.18)
    for k in range(4):
        x=.75+k*.88
        S.shape(bw,rect(.62,.5,x,.95),'#c7c1ac',.55,.1,depth=6.5-.4);S.shape(bw,rect(.5,.38,x+.06,1.01),'#7ec0e8',.7,.12,depth=6.5-.45);S.shape(bw,rect(.3,.1,x+.16,.85),'#a39e8a',.5,0,depth=6.5-.4)
    S.shape(bw,rect(3.7,.28,.55,.6),'#6b4a2a',.45,.08,depth=6.5-.42)
    S.shape(bw,rect(.62,.5,.65,1.75),'#f1ead2',.82,.04,depth=6.5-.5)
    for j in range(3): S.shape(bw,rect(.46-(j%2)*.1,.03,.73,1.98-j*.1),'#6a6a6a',.5,0,depth=6.5-.55)
    S.shape(bw,rect(1.1,2.15,4.55,0),'#1a2230',.35,.05,depth=6.5-.2); S.shape(bw,rect(.95,2.0,4.62,0),'#566174',.5,.1,depth=6.5-.3)
    S.shape(bw,[(5.35+.04*math.cos(i*PI/8),1.0+.04*math.sin(i*PI/8)) for i in range(16)],'#d6c28a',.7,0,depth=6.5-.4)
    # poste
    S.cyl(2.7,5.9,.06,0,4.3,'#2a3340',t=.45,top=False,bias=-1)
    S.box((2.1,4.3,5.9),(1.3,.12,.12),'#2a3340',bias=-1.1); S.cyl(1.55,5.9,.2,4.18,4.3,'#f4c97a',t=.9,bias=-1.2)
    S.poly([(1.55,4.2,5.9),(.2,0.01,5.2),(2.9,0.01,5.2)],'#f4c97a',.6,0,depth=1.7e3,op=.14)
    S.poly([(1.55,4.2,5.9),(.2,.02,6.9),(3.0,.02,6.9)],'#f4c97a',.6,0,depth=1.72e3,op=.1)
    return S,[(*sp(S,(1.55,4.2,5.9)),520,'#ffd08a',.42),(*sp(S,(0.2,1.5,6.7)),700,'#bfe3ff',.18)]
if __name__=='__main__':
    for n,f in (('06_quarto_casal',casal),('07_quarto_livia',livia),('08_canil',canil),('09_painel',painel),('f1_fechadura',fechadura),('f2_trava',trava),('f3_comparativo',comparativo),('f4_fachada',fachada)):
        try:
            S,gl=f();S.render('c'+n,glow=gl);print('ok',n)
        except Exception as e:
            import traceback;print('FAIL',n);traceback.print_exc()
