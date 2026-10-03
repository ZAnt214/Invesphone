from base import *
OUT='out';os.makedirs(OUT,exist_ok=True)
T="font-family:Cour;color:#17171a;"
GREENBAR='background:#f2f6ec;'
def tractor(): 
    return ''.join(f'<div style="position:absolute;left:20px;top:{y}px;width:26px;height:26px;border-radius:50%;background:#16222c;z-index:40"></div><div style="position:absolute;right:20px;top:{y}px;width:26px;height:26px;border-radius:50%;background:#16222c;z-index:40"></div>' for y in range(30,1240,58))
DOT="font-family:Dot;color:#1d2230;font-size:27px;line-height:29px;white-space:pre;filter:url(#ink)"
def veiculo():
    txt='''DHPP - SISTEMA DE CONSULTAS            17/10/2002
================================================
CONSULTA DE VEICULOS - RENAVAM/PLACA

PLACA ........: DXK-4471
MARCA/MODELO .: VW/GOL 1.0
ANO FAB/MOD ..: 1998/1998
COR ..........: BRANCA
COMBUSTIVEL ..: GASOLINA
MUNICIPIO ....: SAO PAULO - SP

PROPRIETARIO .: CAIO DUARTE
SITUACAO .....: REGULAR
RESTRICOES ...: NADA CONSTA
ALIENACAO ....: NAO

------------------------------------------------
OPERADOR: MAT. 55.201  TERMINAL 03
CONSULTA SOLICITADA POR: R. LEAL
FIM DA CONSULTA
'''
    body=f'<div style="position:absolute;inset:0;{GREENBAR}"></div>{tractor()}<div style="position:absolute;left:84px;top:96px;{DOT}">{txt}</div>{stamp("DHPP · INTELIGÊNCIA",520,980,-5,"#2a3f9a",280,24,"CONFERIDO")}{hand("conferir c/ vigia — Gol visto na rua",120,1060,40,"#1b3a8a",-2)}'
    return page(body,bg='#f4f4ee',rot=.4)
def antecedentes():
    txt='''DHPP - SISTEMA DE CONSULTAS            17/10/2002
================================================
CONSULTA DE ANTECEDENTES CRIMINAIS

NOME .........: CAIO DUARTE
RESULTADO ....: NADA CONSTA
OBSERVACAO ...: SEM REGISTROS ANTERIORES

------------------------------------------------

NOME .........: TEO DUARTE
RESULTADO ....: NADA CONSTA
OBSERVACAO ...: SEM REGISTROS ANTERIORES

------------------------------------------------
OPERADOR: MAT. 55.201  TERMINAL 03
CONSULTA SOLICITADA POR: R. LEAL
FIM DA CONSULTA
'''
    body=f'<div style="position:absolute;inset:0;{GREENBAR}"></div>{tractor()}<div style="position:absolute;left:84px;top:96px;{DOT}">{txt}</div>{stamp("NADA CONSTA",300,880,-6,"#8a1f1f",340,40,"DHPP · INTELIGÊNCIA")}'
    return page(body,bg='#f4f4ee',rot=-.4)
def horarios():
    ruled='background:repeating-linear-gradient(#f4f1e4 0 47px,#f4f1e4 47px 49px),linear-gradient(90deg,transparent 108px,#f4f1e4 108px 110px,transparent 110px);background-blend-mode:normal;'
    body=f'''<div style="position:absolute;inset:0;background:#f4f1e4"></div><div style="position:absolute;inset:0;background:repeating-linear-gradient(transparent 0 47px,#f4f1e4 47px 49px);margin-top:70px"></div><div style="position:absolute;left:108px;top:0;bottom:0;width:2px;background:#f4f1e4;z-index:5"></div>
{''.join(f'<div style="position:absolute;left:26px;top:{y}px;width:46px;height:46px;border-radius:50%;background:#16222c;z-index:40"></div>' for y in range(120,1200,250))}
{hand('Noite de 16 p/ 17/10 — quadro de horários',120,40,44,'#1b3a8a',-.8)}
{hand('R. Leal · Caso 01',560,100,34,'#1b3a8a',-1)}
<div style="position:absolute;left:150px;top:330px;width:620px;height:240px;background:rgba(255,230,60,.55);mix-blend-mode:multiply;transform:rotate(-.6deg);filter:url(#rough);z-index:10"></div>
{hand('__:__  ?',140,215,44,'#6a6a6a',-1,font='Pen')}
{hand('23:52   alarme desativado',140,282,50,'#1b3a8a',-.6)}
{hand('(código mestre — log)',210,334,36,'#1b3a8a',-.5)}
{hand('1h04 sem explicação  ?',250,408,50,'#b22222',-1.4)}
{hand('o que aconteceu aqui dentro?',250,470,38,'#b22222',-.8)}
{hand('00:56   entrada no motel',140,586,50,'#1b3a8a',-.5)}
{hand('(nota — suíte 14)',210,640,36,'#1b3a8a',-.4)}
{hand('__:__  ?',140,740,44,'#6a6a6a',-1,font='Pen')}
{hand('__:__  ?',140,830,44,'#6a6a6a',-.5,font='Pen')}
<svg style="position:absolute;left:110px;top:230px;z-index:12" width="60" height="420"><path d="M30 10 L30 400" stroke="#1b3a8a" stroke-width="3" fill="none" filter="url(#rough)"/><path d="M20 390 L30 405 L40 390" stroke="#1b3a8a" stroke-width="3" fill="none"/></svg>
{hand('conferir versões x horários',140,950,36,'#444',-.6,font='Pen')}'''
    return page(body,bg='#f4f1e4',rot=.6)
if __name__=='__main__':
    shot(veiculo(),OUT+'/ficha_veiculo_gol');shot(antecedentes(),OUT+'/consulta_antecedentes');shot(horarios(),OUT+'/quadro_horarios')
