from kit import *
def sp(S,p): return S.cam.scr(S.cam.cs(p))
def entrada():
    S=Scene(Cam((-0.95,1.5,0.2),(0.35,1.12,3.4),fov=76,roll=-2.2))
    R=Room(S,X0=-1.9,X1=1.9,Z0=-1,Z1=3.7,YH=2.55,wall='#3d5368',floor='#54402f',rug=(-.8,.9,2.0,3.3,'#5a2f33'),seed=4)
    # porta
    R.door('back',-0.46,0,.92,2.05,'#9a6a3a')
    R.put('back',circ(.015,12) and [(-.0+.0+.02*math.cos(i*PI/6),1.55+.02*math.sin(i*PI/6)) for i in range(12)],'#2a2f35',.4)
    ro=[(.34+.07*math.cos(i*PI/12),1.0+.07*math.sin(i*PI/12)) for i in range(24)]
    R.put('back',ro,'#a98238',.5,.1); R.put('back',[(.34+.05*math.cos(i*PI/12),1.0+.05*math.sin(i*PI/12)) for i in range(24)],'#e0c068',.7,.1)
    R.put('back',[(.335,.96),(.345,.96),(.345,1.02),(.335,1.02)],'#1c1a14',.3)
    R.put('back',[(.28,1.22),(.4,1.22),(.4,1.25),(.28,1.25)],'#d6b257',.6)
    for yy in (.35,1.55): R.put('back',rect(.03,.12,-.5,yy),'#222a30',.4)
    # arandela
    R.put('back',rect(.12,.2,-1.0,1.55),'#2a2f35',.4); R.put('back',[(-.94+.07*math.cos(i*PI/8),1.75+.07*math.sin(i*PI/8)) for i in range(16)],'#f4e7b0',.9)
    # espelho + aparador
    R.frame('back',.75,1.25,.8,.75,'#3a2a1d','#8fa6b8',scene=None)
    R.put('back',[(.82,1.32),(1.05,1.32),(.9,1.9),(.82,1.9)],'#d4e2ec',.8,0,op=.45)
    table(S,1.15,3.42,1.05,.36,.78,'#7a5128')
    S.box((.95,.9,3.42),(.26,.1,.16),'#c9a14a',bias=-.9,yaw=8); S.cyl(1.2,3.42,.05,.805,1.0,'#8a3d4a',bias=-.9); S.cyl(1.3,3.38,.05,.805,.86,'#b0463a',bias=-.9)
    S.box((1.13,.28,3.4),(.62,.03,.3),'#6a4a2a',bias=-.1); 
    for sx in (.95,1.2): S.box((sx,.33,3.42),(.18,.1,.07),'#2a2420',yaw=15,bias=-.2)
    # cabideiro na parede esquerda
    pl=R.wp('right')
    R.put('right',rect(.9,.05,1.9,1.78),'#6a4a2a',.5)
    for hx_ in (2.1,2.45,2.75): R.put('right',[(hx_+.02*math.cos(i*PI/6),1.74+.02*math.sin(i*PI/6)) for i in range(12)],'#2a2f35',.4)
    R.put('right',[(2.0,1.72),(2.28,1.72),(2.32,1.0),(1.95,1.0)],'#7a3f3a',.5,.1)
    R.put('right',[(2.36,1.72),(2.62,1.72),(2.68,.95),(2.32,.95)],'#3d5a7a',.5,.1)
    R.put('right',[(2.68,1.78),(2.95,1.78),(2.9,1.7),(2.72,1.7)],'#8a7a5a',.5)
    # tapete soleira
    S.poly([(-.5,.006,3.45),(.5,.006,3.45),(.5,.006,3.7),(-.5,.006,3.7)],'#3b2a22',.5,.06,depth=1.69e3)
    return S,[(*sp(S,(-.94,1.7,3.65)),520,'#ffd08a',.42)]
def sala():
    S=Scene(Cam((-1.65,1.5,0.15),(0.45,1.0,3.3),fov=76,roll=2.0))
    R=Room(S,X0=-2.1,X1=2.1,Z0=-1,Z1=4.4,YH=2.6,wall='#42586c',floor='#5a4636',rug=(-1.0,1.5,1.5,3.4,'#6a2f33'),seed=5)
    R.window('back',-1.5,1.2,.9,1.1,night=True,curtain='#8a5a64')
    R.frame('back',-.2,1.45,.8,.55,'#4a3220','#4d6378'); R.frame('back',.8,1.5,.45,.6,'#4a3220','#8a9d6f',scene='warm')
    R.put('back',rect(1.0,.03,1.3,1.1),'#6a4a2a',.5)  # prateleira
    S.box((1.8,1.2,Z:=4.35),(.04,.04,.04),'#000000') if False else None
    # estante-prateleira com itens de valor
    books(S,1.35,1.95,1.115,4.3,.18,.28,.2,seed=9,bias=-.4)
    S.box((1.55,1.14,4.2),(.14,.07,.1),'#c9a14a',bias=-.6)
    # sofá
    sofa(S,0.25,3.78,2.0,0)
    table(S,0.3,2.7,1.0,.55,.4,'#8a6038')
    S.box((.12,.45,2.7),(.2,.04,.07),'#2a2a30',yaw=12,bias=-.9); S.box((.4,.46,2.62),(.07,.06,.12),'#b0463a',bias=-.9); S.cyl(.5,2.78,.04,.42,.5,'#8a3d4a',bias=-.9)
    # TV na parede direita (vira para -x)
    S.floor_shadow(1.5,2.25,2.05,3.25,.7,.45)
    S.box((1.8,.3,2.75),(.5,.6,.9),'#5a3a1d',yaw=90)
    S.box((1.78,.84,2.75),(.46,.52,.52),'#2b333b',yaw=90,bias=-.3)
    tvp=S.plane((1.545,.84,2.75),(0,0,1),(0,1,0))
    S.shape(tvp,[(-.2,-.17),(.2,-.17),(.2,.17),(-.2,.17)],'#4f6a7a',.6,.1,depth=2.75-.4)
    S.shape(tvp,[(-.2,.17),(-.02,.17),(-.2,-.0)],'#9fb4c0',.8,0,depth=2.75-.45,op=.35)
    S.poly([(1.78,1.1,2.75),(1.55,1.55,2.55),(1.57,1.56,2.55),(1.8,1.1,2.77)],'#9aa4aa',.6,0,bias=-.5); S.poly([(1.78,1.1,2.75),(1.55,1.5,3.0),(1.57,1.51,3.0),(1.8,1.1,2.77)],'#9aa4aa',.6,0,bias=-.5)
    S.box((1.78,.38,2.75),(.4,.1,.6),'#3a3a40',yaw=90,bias=-.3); S.box((1.78,.16,2.75),(.4,.1,.6),'#33333a',yaw=90,bias=-.3)
    # criado-mudo com abajur e relógio
    nightstand(S,-1.45,3.95,0,'#7a5128',.6)
    lamp(S,-1.45,3.95,.6,.9)
    S.box((-1.33,.655,3.95),(.14,.08,.12),'#c9a14a',bias=-.9,yaw=-8)  # joias
    plant(S,-1.85,2.7,0,s=1.5)
    return S,[(*sp(S,(-1.45,1.3,3.95)),460,'#ffd08a',.38)]
def cozinha():
    S=Scene(Cam((-1.25,1.5,0.1),(0.5,1.0,3.3),fov=76,roll=-2.4))
    R=Room(S,X0=-1.9,X1=2.0,Z0=-1,Z1=4.2,YH=2.55,wall='#8a8f86',floor='#6d6753',rug=None,planks=False,stripes=False,wall_t=(.58,.44,.48),seed=6)
    # azulejo
    for i in range(0,40):
        x=-1.9+i*.1
        S.poly([(x,.9,4.195),(x+.004,.9,4.195),(x+.004,1.55,4.195),(x,1.55,4.195)],'#000000',.5,0,depth=1.8e3,op=.10)
    for j in range(7): S.poly([(-1.9,.9+j*.1,4.195),(2.0,.9+j*.1,4.195),(2.0,.904+j*.1,4.195),(-1.9,.904+j*.1,4.195)],'#000000',.5,0,depth=1.8e3,op=.10)
    R.window('back',-.1,1.35,.9,.9,night=True,curtain='#a84a42')
    # bancada e armários
    S.floor_shadow(-1.9,3.7,.7,4.2,.9,.4)
    S.box((-.6,.45,3.9),(2.6,.9,.6),'#4f6e7e'); S.box((-.6,.92,3.88),(2.66,.04,.66),'#9aa0a0',bias=-.2)
    for i in range(5): S.box((-1.7+i*.5+.0,.45,3.595),(.46,.74,.02),'#456170',bias=-.3); S.box((-1.7+i*.5+.15,.55,3.58),(.04,.1,.02),'#d6d0b8',bias=-.35)
    S.box((-1.2,1.95,4.05),(1.4,.6,.35),'#a97a48'); S.box((-1.5,1.95,3.87),(.6,.56,.02),'#8a6038',bias=-.2); S.box((-.9,1.95,3.87),(.6,.56,.02),'#8a6038',bias=-.2)
    # fogão
    for bx in (-.25,.1): 
        S.cyl(bx,3.9,.1,.94,.955,'#222a30',bias=-.9)
    S.cyl(-.07,3.9,.12,.94,1.18,'#b0b8bd',t=.5,bias=-.95)  # chaleira
    S.box((.45,.97,3.88),(.3,.06,.24),'#c24a3a',bias=-.9)  # fruteira
    S.cyl(.45,3.88,.06,1.0,1.06,'#c24a3a',bias=-.95); S.cyl(.52,3.84,.05,1.0,1.05,'#d6a02a',bias=-.95)
    # geladeira
    S.floor_shadow(1.2,3.5,1.95,4.15,1.8,.4)
    S.box((1.55,.95,3.82),(.75,1.9,.7),'#d8dde0',g=.05); S.box((1.55,1.3,3.46),(.7,.015,.02),'#9aa3a9',bias=-.4)
    S.box((1.22,1.55,3.455),(.025,.45,.03),'#7a858c',bias=-.45); S.box((1.22,.85,3.455),(.025,.5,.03),'#7a858c',bias=-.45)
    S.box((1.5,1.45,3.46),(.12,.12,.01),'#f1c93a',bias=-.5); S.box((1.72,1.55,3.46),(.1,.07,.01),'#a24b3d',bias=-.5)
    # mesa e banquetas
    table(S,.15,2.2,1.1,.8,.74,'#9a6a3a',cloth='#b0463a')
    S.box((.1,.80,2.15),(.22,.04,.16),'#ece7d6',bias=-.9); S.cyl(.4,2.3,.06,.76,.83,'#c24a3a',bias=-.9); S.cyl(.5,2.1,.07,.76,.8,'#d6a02a',bias=-.9)
    for bx,bz in ((-.7,2.25),(.95,2.2)):
        S.floor_shadow(bx-.2,bz-.2,bx+.2,bz+.2,.5,.35)
        S.cyl(bx,bz,.17,.43,.47,'#c9a14a',bias=-.1)
        for sx,sz in ((-1,-1),(1,1),(-1,1),(1,-1)): S.cyl(bx+sx*.11,bz+sz*.11,.018,0,.43,'#8a6038',top=False,bias=-.05)
    # panelas penduradas e relógio
    for i,x in enumerate((-1.45,-1.2,-.95)):
        S.cyl(x,4.1,.09,1.55,1.62,'#8d98a0',bias=-.5)
    cl=S.plane((1.0,2.0,4.18),(1,0,0),(0,1,0))
    S.shape(cl,circ(.14,24),'#d8d2bf',.8,0,depth=4.1-1);S.shape(cl,circ(.12,24),'#f1ecd8',.85,0,depth=4.1-1.1)
    S.shape(cl,[(-.004,0),(.004,0),(.004,.09),(-.004,.09)],'#25201a',.4,0,depth=4.1-1.2);S.shape(cl,[(0,-.004),(.07,-.01),(.07,.004),(0,.004)],'#25201a',.4,0,depth=4.1-1.2)
    # tapete azul
    S.poly([(-.5,.004,1.4),(.9,.004,1.4),(.9,.004,1.8),(-.5,.004,1.8)],'#2d5f7a',.5,.06,depth=1.7e3)
    return S,[(*sp(S,(0.2,2.2,3.5)),620,'#ffe3b0',.28)]
def corredor():
    S=Scene(Cam((0.12,1.5,0.2),(-0.05,1.32,6.0),fov=78,roll=2.6))
    R=Room(S,X0=-.7,X1=.7,Z0=-1,Z1=6.6,YH=2.5,wall='#44596c',floor='#5a4636',stripes=True,planks=False,wall_t=(.55,.44,.5),seed=7)
    # tábuas longitudinais
    for i in range(0,9):
        x=-.7+i*.16;S.poly([(x,.001,-1),(x+.006,.001,-1),(x+.006,.001,6.6),(x,.001,6.6)],'#000000',.5,0,depth=1.85e3,op=.2)
    # passadeira
    S.poly([(-.38,.004,-1),(.38,.004,-1),(.38,.004,6.4),(-.38,.004,6.4)],'#6a2f33',.5,.06,depth=1.7e3)
    S.poly([(-.32,.005,-1),(.32,.005,-1),(.32,.005,6.4),(-.32,.005,6.4)],'#7a3b3f',.5,.05,depth=1.69e3)
    # portas nas paredes
    for z in (1.6,4.3): R.door('left',z,0,.82,2.05,'#8a5a32')
    for z in (0.9,3.1,5.2): R.door('right',z,0,.82,2.05,'#8a5a32') if z!=3.1 else None
    R.door('right',2.9,0,.82,2.05,'#8a5a32')
    # quadros
    R.frame('left',3.1,1.35,.5,.65,'#4a3220','#4d6378'); R.frame('right',1.85,1.35,.5,.65,'#4a3220','#8a9d6f',scene='warm'); R.frame('right',4.4,1.35,.5,.65,'#4a3220','#b25a6a',scene='warm')
    # fundo: janela e aparador
    R.window('back',-.28,1.2,.56,.9,night=True,curtain=None)
    table(S,0,6.35,.7,.3,.8,'#7a5128')
    S.cyl(.1,6.35,.05,.825,.95,'#8a3d4a',bias=-.9)
    # luminária de teto
    S.cyl(0,3.0,.14,2.38,2.5,'#e9d9a4',r1=.05,t=.9,bias=-.5); S.cyl(0,3.0,.14,2.2,2.38,'#e9d9a4',r1=.14,t=.9,bias=-.5) if False else None
    S.cyl(0,3.0,.2,2.2,2.36,'#f1e4b0',r1=.12,t=.92,bias=-.5)
    # aparador baixo à esquerda
    table(S,-.5,2.45,.3,.7,.7,'#7a5128',yaw=0)
    S.cyl(-.5,2.3,.05,.725,.85,'#8a3d4a',bias=-.9); S.cyl(-.5,2.6,.03,.725,.87,'#3d6a8a',bias=-.9)
    return S,[(*sp(S,(0,2.2,3.0)),420,'#ffe3a8',.5)]
if __name__=='__main__':
    for n,f in (('01_entrada',entrada),('02_sala',sala),('03_cozinha',cozinha),('05_corredor',corredor)):
        S,gl=f();S.render('c'+n,glow=gl);print(n)
