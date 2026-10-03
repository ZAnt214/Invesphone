from base import *
OUT='out';os.makedirs(OUT,exist_ok=True)
T="font-family:Cour;color:#17171a;"
def matricula():
    row=lambda k,v:f'<div style="display:flex;gap:14px;padding:6px 0;font-size:17.5px;line-height:1.45"><b style="width:210px;flex:none">{k}</b><span style="flex:1">{v}</span></div>'
    body=f'''<div style="padding:44px 64px 10px;text-align:center;{T}border-bottom:3px double #333"><div style="font-family:Elite;font-size:21px;letter-spacing:.14em">REGISTRO DE IMÓVEIS DA COMARCA DE SÃO PAULO</div><div style="font-size:17px;letter-spacing:.2em;margin-top:4px">14º OFICIAL · CAPITAL</div><div style="font-size:14px;margin-top:6px;color:#444">Livro 2 — Registro Geral</div></div>
<div style="padding:26px 64px;{T}"><div style="display:flex;justify-content:space-between;align-items:flex-end"><div style="font-family:Elite;font-size:32px;letter-spacing:.05em">CERTIDÃO DE MATRÍCULA</div><div style="text-align:right;font-size:17px">Matrícula nº<br><b style="font-size:30px">78.421</b></div></div>
<div style="margin-top:20px;border-top:2px solid #333;border-bottom:2px solid #333;padding:8px 0">{row('IMÓVEL','Prédio residencial e respectivo terreno, situado na Rua das Acácias, Campo Belo, 31º Subdistrito — Santo Amaro, São Paulo/SP.')}{row('CARACTERÍSTICAS','Terreno com frente para a via pública; casa térrea com área construída conforme planta aprovada; fundos com dependência de serviço.')}</div>
<div style="margin-top:14px">{row('PROPRIETÁRIOS','Ricardo Valença e Helena Valença, casados.')}{row('REGISTRO ANTERIOR','Matrícula nº 41.100, deste Oficial.')}{row('AVERBAÇÕES','Sem ônus, hipoteca ou penhora registrados até a presente data.')}</div>
<div style="margin-top:22px;font-size:17px;line-height:1.55;text-align:justify">CERTIFICO que a presente certidão é reprodução fiel da matrícula acima, extraída nos termos do art. 19 da Lei nº 6.015/73, e que nela constam os atos registrados até esta data. O referido é verdade e dou fé.</div>
<div style="margin-top:18px;font-size:16px">São Paulo, 17 de outubro de 2002.</div></div>
<div style="position:absolute;left:64px;bottom:90px;font-size:15px;border-top:2px solid #333;width:340px;padding-top:6px;{T}">O Escrevente Autorizado</div>
{sign('J. Almeida',90,1050,38)}
{stamp('14º REGISTRO DE IMÓVEIS',470,975,-4,'#2a3f9a',320,24,'SÃO PAULO · CAPITAL',False)}
<div style="position:absolute;left:660px;top:1060px;width:130px;height:130px;border:4px double #8a1f1f;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;font-family:Elite;color:#8a1f1f;font-size:15px;filter:url(#ink);opacity:.8;transform:rotate(8deg);mix-blend-mode:multiply">SELO<br>DE<br>AUTENTICIDADE</div>
<div style="position:absolute;right:64px;top:206px;font-family:Cour;font-size:13px;color:#555;text-align:right">Via do requerente · Emol.: pagos</div>
{holes(14,[300,700])}'''
    return page(body,bg='#e8e2d0',rot=.45)
def capa():
    body=f'''<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.0),rgba(0,0,0,.0) 92%,rgba(0,0,0,0))"></div>
<div style="position:absolute;left:0;right:0;top:0;height:92px;background:rgba(0,0,0,.08);border-bottom:2px solid rgba(0,0,0,.18)"></div>
<div style="position:absolute;left:70px;top:150px;right:70px;border:4px solid #3a2a14;padding:26px 34px;background:rgba(255,255,240,.55);{T}"><div style="display:flex;gap:20px;align-items:center">{SHIELD.replace('width="62" height="62"','width="92" height="92"')}<div style="line-height:1.15"><b style="font-family:Elite;font-size:56px;letter-spacing:.06em">DHPP</b><div style="font-size:21px;letter-spacing:.24em">HOMICÍDIOS</div></div></div>
<div style="margin-top:22px;border-top:3px solid #3a2a14;padding-top:16px;font-size:20px;letter-spacing:.14em;text-align:center">INQUÉRITO POLICIAL</div>
<div style="font-family:Elite;font-size:46px;text-align:center;margin-top:8px">Nº 0427/2002</div></div>
<div style="position:absolute;left:70px;right:70px;top:620px;{T}font-size:22px;line-height:2.1">
<div style="display:flex"><b style="width:260px">ASSUNTO:</b><span style="flex:1;border-bottom:2px dotted #333">Morte de duas pessoas — Caso 01</span></div>
<div style="display:flex"><b style="width:260px">LOCAL:</b><span style="flex:1;border-bottom:2px dotted #333">Rua das Acácias, Campo Belo</span></div>
<div style="display:flex"><b style="width:260px">VÍTIMAS:</b><span style="flex:1;border-bottom:2px dotted #333">Ricardo e Helena Valença</span></div>
<div style="display:flex"><b style="width:260px">INSTAURAÇÃO:</b><span style="flex:1;border-bottom:2px dotted #333">17/10/2002</span></div>
<div style="display:flex"><b style="width:260px">AUTORIDADE:</b><span style="flex:1;border-bottom:2px dotted #333">Delegada Sônia Prado</span></div>
<div style="display:flex"><b style="width:260px">ESCRIVÃ:</b><span style="flex:1;border-bottom:2px dotted #333">Denise Rocha</span></div></div>
{stamp('EM ANDAMENTO',470,1030,-9,'#8a1f1f',330,38,'DHPP · 17/10/2002')}
<div style="position:absolute;left:70px;top:1060px;width:210px;height:100px;background:#f3efe0;border:2px solid #555;transform:rotate(-2deg);{T}font-size:15px;padding:10px;box-shadow:0 2px 4px rgba(0,0,0,.3)">PRAZO PARA CONCLUSÃO<br><b style="font-size:22px">30 dias</b></div>'''
    return page(body,bg='#c9b48a',rot=-.3)
if __name__=='__main__':
    shot(matricula(),OUT+'/matricula_imovel');shot(capa(),OUT+'/capa_inquerito')
