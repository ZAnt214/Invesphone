from base import *
OUT='out';os.makedirs(OUT,exist_ok=True)
PAPER_GRID="background:#ece8dc;background-image:linear-gradient(rgba(110,140,170,.0) 1px,transparent 1px),linear-gradient(90deg,rgba(110,140,170,.0) 1px,transparent 1px),linear-gradient(rgba(110,140,170,.0) 1px,transparent 1px),linear-gradient(90deg,rgba(110,140,170,.0) 1px,transparent 1px);background-size:100px 100px,100px 100px,20px 20px,20px 20px;"
def cpage(inner,rot=0):
    return page(inner,w=1600,h=1200,bg='#ece8dc',extra_css='.paper{inset:10px}.grid{position:absolute;inset:0;'+PAPER_GRID+'}',rot=rot)
INK='#1c1c20'
def mk(n,x,y): return f'<g><circle cx="{x}" cy="{y}" r="22" fill="#f1c93a" stroke="{INK}" stroke-width="3" filter="url(#rough)"/><text x="{x}" y="{y+9}" text-anchor="middle" font-family="Hand" font-weight="700" font-size="28" fill="{INK}">{n}</text></g>'
def lab(t,x,y,fs=34,col=INK,rot=0,anchor='start',font='Hand'): return f'<text x="{x}" y="{y}" font-family="{font}" font-size="{int(fs*0.86)}" fill="{col}" text-anchor="{anchor}" transform="rotate({rot} {x} {y})" filter="url(#ink)">{t}</text>'
def wall(x1,y1,x2,y2,w=9): return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{INK}" stroke-width="{w}" stroke-linecap="square" filter="url(#rough)"/>'
def dim(x1,y1,x2,y2,t,off=0,vert=False):
    if vert: return f'<g stroke="{INK}" stroke-width="2.5" filter="url(#rough)"><line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/><line x1="{x1-10}" y1="{y1}" x2="{x1+10}" y2="{y1}"/><line x1="{x2-10}" y1="{y2}" x2="{x2+10}" y2="{y2}"/></g>'+lab(t,x1-14,(y1+y2)//2,30,INK,-90,'middle')
    return f'<g stroke="{INK}" stroke-width="2.5" filter="url(#rough)"><line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/><line x1="{x1}" y1="{y1-10}" x2="{x1}" y2="{y1+10}"/><line x1="{x2}" y1="{y2-10}" x2="{x2}" y2="{y2+10}"/></g>'+lab(t,(x1+x2)//2,y1-14,30,INK,0,'middle')
def north(x,y): return f'<g filter="url(#rough)"><circle cx="{x}" cy="{y}" r="38" fill="none" stroke="{INK}" stroke-width="3"/><path d="M{x} {y-34} L{x+14} {y+16} L{x} {y+6} L{x-14} {y+16} Z" fill="{INK}"/></g>'+lab('N',x,y-48,34,INK,0,'middle','Hand')
def door(x,y,w,horiz=True,flip=1):
    if horiz: return f'<g filter="url(#rough)"><line x1="{x}" y1="{y}" x2="{x+w}" y2="{y}" stroke="#efe9d6" stroke-width="12"/><path d="M{x} {y} L{x} {y+flip*w} A{w} {w} 0 0 {1 if flip>0 else 0} {x+w} {y}" fill="none" stroke="{INK}" stroke-width="2.5"/></g>'
    return f'<g filter="url(#rough)"><line x1="{x}" y1="{y}" x2="{x}" y2="{y+w}" stroke="#efe9d6" stroke-width="12"/><path d="M{x} {y} L{x+flip*w} {y} A{w} {w} 0 0 {0 if flip>0 else 1} {x} {y+w}" fill="none" stroke="{INK}" stroke-width="2.5"/></g>'
def win(x,y,w,horiz=True):
    if horiz: return f'<g filter="url(#rough)"><rect x="{x}" y="{y-6}" width="{w}" height="12" fill="#efe9d6" stroke="{INK}" stroke-width="2.5"/><line x1="{x}" y1="{y}" x2="{x+w}" y2="{y}" stroke="{INK}" stroke-width="2"/></g>'
    return f'<g filter="url(#rough)"><rect x="{x-6}" y="{y}" width="12" height="{w}" fill="#efe9d6" stroke="{INK}" stroke-width="2.5"/><line x1="{x}" y1="{y}" x2="{x}" y2="{y+w}" stroke="{INK}" stroke-width="2"/></g>'
def titleblock(title,sub,x=1040,y=790,w=500,h=330):
    return f'<g><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="rgba(255,255,255,.35)" stroke="{INK}" stroke-width="4" filter="url(#rough)"/><line x1="{x}" y1="{y+90}" x2="{x+w}" y2="{y+90}" stroke="{INK}" stroke-width="3"/><text x="{x+24}" y="{y+60}" font-family="Elite" font-size="38" fill="{INK}">DHPP · HOMICÍDIOS</text>'+lab(title,x+24,y+150,40,INK,0,'start','Hand')+lab(sub,x+24,y+205,32)+lab('Perito: Maurício Farias',x+24,y+255,34,'#1b3a8a',0,'start','Hand')+lab('Caso 01 · 17/10/2002 · sem escala',x+24,y+300,28)+f'</g>'
def casa():
    X,Y=120,170
    g=''
    # paredes externas
    g+=f'<g filter="url(#rough)"><rect x="{X}" y="{Y}" width="860" height="600" fill="rgba(255,255,255,.18)" stroke="{INK}" stroke-width="12"/></g>'
    for x1,y1,x2,y2 in [(440,170,440,770-300),(680,170,680,470),(120,470,980,470),(440,470,440,770),(680,470,680,770),(440,620,680,620)]:
        g+=wall(x1,y1,x2,y2,8)
    g+=wall(440,170,440,470,8)
    # portas e janelas
    g+=door(120,330,70,False,1)+door(530,470,70,True,1)+door(300,470,70,True,-1)+door(750,470,70,True,-1)+door(680,330,70,False,-1)+door(440,520,70,False,1)
    g+=win(200,170,120)+win(740,170,140)+win(500,170,100)+win(120,560,110,False)+win(980,560,110,False)
    # nomes
    for t,x,y in [('SALA',150,225),('COZINHA',470,225),('ESCRITÓRIO',710,225),('QUARTO DO CASAL',150,525),('CORREDOR',530,605),('QUARTO DE LÍVIA',710,525)]: g+=lab(t,x,y,36)
    g+=lab('quintal / fundos',470,690,28,'#555')
    # canil externo
    g+=f'<g filter="url(#rough)"><rect x="500" y="800" width="190" height="110" fill="rgba(255,255,255,.2)" stroke="{INK}" stroke-width="7"/><path d="M500 800 L690 800" stroke="{INK}" stroke-width="3"/>'+''.join(f'<line x1="{x}" y1="800" x2="{x}" y2="910" stroke="{INK}" stroke-width="3"/>' for x in range(520,690,30))+'</g>'+lab('CANIL',540,950,36)
    g+=wall(560,770,560,800,6)
    # móveis simples
    g+=f'<g filter="url(#rough)" fill="none" stroke="{INK}" stroke-width="3"><rect x="740" y="270" width="150" height="60"/><rect x="745" y="275" width="45" height="50"/><rect x="170" y="540" width="110" height="140"/><rect x="190" y="360" width="150" height="70"/><rect x="760" y="590" width="120" height="100"/></g>'
    g+=lab('mesa',775,352,24,'#555')+lab('cama',200,620,26,'#555')+lab('sofá',225,405,24,'#555')+lab('cama',790,650,26,'#555')
    # cotas
    g+=dim(120,130,980,130,'aprox. 17 m')+dim(70,170,70,770,'aprox. 12 m',0,True)
    # marcadores (fora do texto)
    g+=mk(1,70,330+35)+mk(2,360,420)+mk(3,930,420)+mk(4,640,540)+mk(5,380,700)+mk(6,215,300)+mk(7,720,855)
    g+=f'<g stroke="{INK}" stroke-width="2" stroke-dasharray="6 5" fill="none" filter="url(#rough)"><path d="M92 365 L125 365"/></g>'
    # legenda
    leg=[(1,'Entrada principal — sem arrombamento'),(2,'Sala — bens de valor preservados'),(3,'Escritório — gavetas laterais abertas'),(4,'Corredor — circulação preservada'),(5,'Quarto do casal'),(6,'Painel do alarme (teclado)'),(7,'Canil — Thor no interior')]
    L=f'<g><rect x="1040" y="170" width="500" height="560" fill="rgba(255,255,255,.35)" stroke="{INK}" stroke-width="4" filter="url(#rough)"/>'+lab('LEGENDA',1070,225,44,INK,0,'start','Hand')
    for i,(n,t) in enumerate(leg): L+=mk(n,1085,285+i*62)+lab(t,1125,296+i*62,31)
    L+='</g>'
    return g+L+north(1450,100)+titleblock('Croqui nº 01 — Residência','Rua das Acácias, Campo Belo')
def rua():
    g=''
    # lotes
    g+=f'<g fill="rgba(255,255,255,.18)" stroke="#777" stroke-width="3" stroke-dasharray="14 8" filter="url(#rough)">'+''.join(f'<rect x="{x}" y="120" width="{w}" height="330"/>' for x,w in [(90,260),(380,240),(660,200),(890,300),(1220,300)])+'</g>'
    g+=lab('lote',140,300,26,'#777')+lab('lote',430,300,26,'#777')
    # casa alvo
    g+=f'<g filter="url(#rough)"><rect x="890" y="120" width="300" height="330" fill="rgba(255,255,255,.3)" stroke="{INK}" stroke-width="8"/><rect x="930" y="170" width="220" height="150" fill="rgba(160,160,170,.35)" stroke="{INK}" stroke-width="5"/><line x1="1000" y1="320" x2="1060" y2="320" stroke="#efe9d6" stroke-width="10"/></g>'+lab('CASA',960,255,48,INK,0,'start','Hand')+lab('(residência do Caso 01)',910,360,28)
    # calçada e pista
    g+=f'<g filter="url(#rough)"><rect x="40" y="470" width="1520" height="60" fill="rgba(180,170,150,.45)" stroke="{INK}" stroke-width="4"/><rect x="40" y="530" width="1520" height="230" fill="rgba(120,120,125,.35)" stroke="{INK}" stroke-width="5"/><rect x="40" y="760" width="1520" height="60" fill="rgba(180,170,150,.45)" stroke="{INK}" stroke-width="4"/><line x1="60" y1="645" x2="1540" y2="645" stroke="#f1c93a" stroke-width="5" stroke-dasharray="46 28"/></g>'
    g+=lab('RUA DAS ACÁCIAS',560,720,44,INK,0,'middle','Hand')+lab('sentido →',1250,610,28,'#444')
    # guarita Jorge
    g+=f'<g filter="url(#rough)"><rect x="150" y="415" width="90" height="75" fill="rgba(255,255,255,.5)" stroke="{INK}" stroke-width="6"/><path d="M140 415 L195 380 L250 415" fill="none" stroke="{INK}" stroke-width="6"/></g>'+lab('GUARITA',130,365,34,INK,0,'start','Hand')+lab('(vigia Jorge)',120,520,28)
    # poste
    g+=f'<g filter="url(#rough)"><circle cx="640" cy="500" r="16" fill="{INK}"/><line x1="640" y1="500" x2="640" y2="470" stroke="{INK}" stroke-width="6"/></g>'+lab('POSTE',665,452,30,INK,0,'start','Hand')
    # árvores
    for x in (330,520,810,1300): g+=f'<circle cx="{x}" cy="495" r="30" fill="rgba(90,130,80,.45)" stroke="#3b5a35" stroke-width="3" filter="url(#rough)"/>'
    # carro (Gol) vista superior
    car=f'<g transform="translate(760 560)" filter="url(#rough)"><rect x="0" y="0" width="190" height="82" rx="20" fill="rgba(245,245,245,.85)" stroke="{INK}" stroke-width="5"/><rect x="118" y="9" width="42" height="64" rx="8" fill="rgba(80,100,130,.55)" stroke="{INK}" stroke-width="3"/><rect x="34" y="9" width="38" height="64" rx="8" fill="rgba(80,100,130,.55)" stroke="{INK}" stroke-width="3"/><rect x="-6" y="8" width="14" height="18" fill="{INK}"/><rect x="-6" y="56" width="14" height="18" fill="{INK}"/><rect x="180" y="8" width="14" height="18" fill="{INK}"/><rect x="180" y="56" width="14" height="18" fill="{INK}"/></g>'
    g+=car+lab('GOL branco',880,548,36,'#1b3a8a',0,'start','Hand')+lab('(ponto onde foi visto estacionado)',700,695,28,'#1b3a8a')
    # linhas de visada
    g+=f'<g stroke="#1b3a8a" stroke-width="3" stroke-dasharray="12 8" fill="none" filter="url(#rough)"><path d="M240 450 L760 585"/><path d="M850 560 L1010 322"/></g>'
    # cotas
    g+=dim(195,860,855,860,'aprox. 38 m')
    g+=lab('da guarita ao Gol',380,905,28,'#555')+lab('aprox. 14 m até a porta',915,508,26,'#1b3a8a')
    # marcadores e legenda
    g+=mk(1,115,440)+mk(2,595,455)+mk(3,735,540)+mk(4,1040,95)
    leg=[(1,'Guarita do vigia (Jorge)'),(2,'Poste de iluminação'),(3,'Ponto do Gol (visto)'),(4,'Residência — Caso 01')]
    L=f'<g><rect x="60" y="985" width="900" height="175" fill="rgba(255,255,255,.35)" stroke="{INK}" stroke-width="4" filter="url(#rough)"/>'+lab('LEGENDA',85,1030,36,INK,0,'start','Hand')
    for i,(n,t) in enumerate(leg): L+=mk(n,100+(i%2)*430,1075+(i//2)*55)+lab(t,140+(i%2)*430,1085+(i//2)*55,28)
    L+='</g>'
    return g+L+north(1470,70)+titleblock('Croqui nº 02 — Rua das Acácias','Posição da guarita, poste e veículo',1040,850,520,310)
def html(svg,rot): return cpage(f'<div class="grid"></div><svg width="1580" height="1180" viewBox="0 0 1600 1200" style="position:absolute;left:0;top:0">{svg}</svg>',rot)
if __name__=='__main__':
    shot(html(casa(),0),OUT+'/croqui_residencia',1600,1200,1)
    shot(html(rua(),0),OUT+'/croqui_rua',1600,1200,1)
