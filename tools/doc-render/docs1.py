import asyncio,sys
from base import *
OUT='out';os.makedirs(OUT,exist_ok=True)
T="font-family:Cour;color:#17171a;"
# 7 LAUDO
def laudo():
    sec=lambda t,x:f'<div style="margin-top:18px"><b style="letter-spacing:.12em;font-size:19px">{t}</b><div style="margin-top:6px;font-size:18px;line-height:1.45;text-align:justify">{x}</div></div>'
    body=letterhead('HOMICÍDIOS · PERÍCIA','LAUDO Nº 0427/02-L1<br>fl. 1/1<br>17 de outubro de 2002')+f'''
<div style="padding:30px 64px;{T}"><div style="font-family:Elite;font-size:34px;letter-spacing:.06em;text-align:center;margin:6px 0 18px">LAUDO PERICIAL PRELIMINAR DE LOCAL</div>
<div style="font-size:17px;line-height:1.5;border:2px solid #17171a;padding:10px 14px"><b>Ocorrência:</b> Caso 01 · Residência da Rua das Acácias, Campo Belo<br><b>Requisição:</b> Delegada Sônia Prado · <b>Perito:</b> Maurício Farias<br><b>Natureza:</b> exame preliminar de local de morte</div>
{sec('I — HISTÓRICO','Aos dezessete dias do mês de outubro de dois mil e dois, o signatário compareceu à residência acima referida, a fim de proceder ao exame preliminar do local, com registro fotográfico e croqui anexos.')}
{sec('II — ABERTURAS','A porta principal não apresenta sinais de arrombamento. Fechadura e batente íntegros, sem marcas de alavanca, lascas ou deformações visíveis. Demais aberturas, no exame preliminar, sem vestígios de violação.')}
{sec('III — AMBIENTES','Sala com bens de valor aparentes preservados (relógio, joias e equipamentos eletrônicos). Escritório com gavetas laterais abertas e papéis revirados, enquanto a gaveta principal e o cofre de parede permanecem fechados. Circulação interna sem alteração relevante.')}
{sec('IV — ÁREA EXTERNA','O canil, nos fundos, encontra-se fechado pelo lado de fora. O cão da residência (Thor) foi localizado em seu interior, sem sinais de contenção improvisada.')}
{sec('V — CONCLUSÃO PRELIMINAR','O presente laudo descreve o estado observado do local e não atribui autoria ou participação a qualquer pessoa. Outros exames dependem de análise laboratorial.')}
</div>
<div style="position:absolute;left:64px;bottom:84px;{T}font-size:16px;border-top:2px solid #17171a;width:340px;padding-top:6px">Maurício Farias · Perito Criminal</div>
{sign('M. Farias',96,1086,40)}
{stamp('DHPP · PERÍCIA',560,1090,-7,'#2a3f9a',290,26,'RECEBIDO · 17/10/2002')}
<div style="position:absolute;left:64px;bottom:40px;font-family:Cour;font-size:13px;color:#555">DHPP · Rua do Homicídio, s/n · Tel. (11) 3000-0000</div>
{staple(60,44,-12)}'''
    return page(body,rot=-.4)
shot(laudo(),OUT+'/laudo_preliminar_local')
