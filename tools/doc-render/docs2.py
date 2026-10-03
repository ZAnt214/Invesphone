from base import *
OUT='out';os.makedirs(OUT,exist_ok=True)
T="font-family:Cour;color:#17171a;"
# 12 TERMO DECLARAÇÃO (Cida)
def termo_cida():
    H=lambda t,fs=34:f'<span style="font-family:Hand;font-size:{fs}px;color:#1b3a8a;filter:url(#ink);line-height:1;transform:rotate(-.6deg);display:inline-block;padding-left:8px">{t}</span>'
    line=lambda lbl,val:f'<div style="display:flex;align-items:flex-end;gap:10px;margin:10px 0;font-size:18px;height:44px"><span>{lbl}</span><span style="flex:1;border-bottom:1.5px solid #17171a;height:36px;display:flex;align-items:flex-end">{H(val)}</span></div>'
    ans=lambda t:f'<div style="border-bottom:1.5px solid #17171a;height:48px;display:flex;align-items:flex-end;padding-bottom:1px">{H(t,33) if t else ""}</div>'
    body=letterhead('HOMICÍDIOS · CARTÓRIO','TERMO Nº 0431/02<br>Inquérito do Caso 01<br>fl. 14')+f'''
<div style="padding:26px 64px;{T}"><div style="font-family:Elite;font-size:32px;text-align:center;letter-spacing:.06em">TERMO DE DECLARAÇÃO</div>
<div style="margin-top:20px;font-size:18px;line-height:1.55;text-align:justify">Aos dezessete dias do mês de outubro de dois mil e dois, nesta unidade do DHPP, perante a escrivã de plantão, compareceu a pessoa abaixo qualificada, que, advertida das penas da lei, declarou:</div>
{line('Nome:','Rosa Maria dos Santos')}{line('Parentesco com Cida:','irmã (Aparecida)')}{line('Endereço:','Rua dos Ipês, 212 — Jabaquara')}
<div style="margin-top:22px;margin-bottom:6px;font-size:18px">Às perguntas, <b>respondeu</b>:</div>
{ans('Que a sra. Cida esteve em sua casa na noite de 16/10/2002,')}{ans('onde jantou com a família e dormiu, só saindo na manhã seguinte.')}{ans('Que estavam presentes o marido e dois filhos da declarante.')}{ans('Que não viu a sra. Cida sair em momento algum da noite.')}{ans('')}
<div style="margin-top:22px;font-size:17px;line-height:1.5;text-align:justify">Nada mais disse nem lhe foi perguntado. Lido o presente termo e achado conforme, vai devidamente assinado.</div></div>
<div style="position:absolute;left:64px;bottom:96px;{T}font-size:15px;border-top:2px solid #17171a;width:330px;padding-top:6px">Declarante</div>
<div style="position:absolute;left:470px;bottom:96px;{T}font-size:15px;border-top:2px solid #17171a;width:340px;padding-top:6px">Denise Rocha · Escrivã</div>
<div style="position:absolute;left:660px;top:925px;width:92px;height:110px;border:2px solid #17171a;border-radius:3px;{T}font-size:11px;text-align:center;padding-top:2px">POLEGAR D.<div style="position:absolute;inset:18px 12px 6px;border-radius:50%;background:repeating-radial-gradient(ellipse at 50% 55%,#1b2a6a 0 2px,transparent 2px 5px);opacity:.75;filter:url(#ink)"></div></div>
{sign('Rosa M. Santos',110,1062,36)}{sign('D. Rocha',520,1070,34)}
{stamp('DHPP · CARTÓRIO',380,985,-6,'#8a1f1f',250,24,'CONFERE COM O ORIGINAL')}
{staple(60,40,-10)}'''
    return page(body,rot=.5)
# 13 AUTO APREENSÃO
def barcode(w=250,h=46):
    import random;random.seed(5)
    x=0;bars=''
    while x<w:
        bw=random.choice([2,2,3,4]);bars+=f'<rect x="{x}" y="0" width="{bw}" height="{h}" fill="#111"/>';x+=bw+random.choice([2,3,4])
    return f'<svg width="{w}" height="{h}">{bars}</svg>'
def auto_apreensao():
    row=lambda k,v:f'<div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px dotted #444;font-size:18px"><b style="width:210px">{k}</b><span style="flex:1">{v}</span></div>'
    body=letterhead('HOMICÍDIOS · CARTÓRIO','AUTO Nº 0417/02<br>Cadeia de custódia<br>fl. 22')+f'''
<div style="padding:26px 64px;{T}"><div style="font-family:Elite;font-size:32px;text-align:center;letter-spacing:.06em">AUTO DE EXIBIÇÃO E APREENSÃO</div>
<div style="margin-top:20px;font-size:17px;line-height:1.5;text-align:justify">Aos dezessete dias de outubro de 2002, na residência da Rua das Acácias, Campo Belo, foi apreendido o objeto abaixo descrito, que foi lacrado e acondicionado para análise:</div>
<div style="margin-top:14px">{row('Item nº','01 (um)')}{row('Descrição','Aparelho celular, cor grafite, antena curta, pertencente a Helena Valença')}{row('Local','Quarto do casal · Rua das Acácias, Campo Belo')}{row('Estado','Desligado; sem avarias aparentes')}{row('Lacre nº','000417')}{row('Responsável','Maurício Farias · Perito Criminal')}</div>
<div style="margin-top:22px;border:2px solid #17171a;padding:12px 14px;background:rgba(255,255,255,.35);display:flex;gap:18px;align-items:center"><div style="flex:1"><b style="font-size:16px;letter-spacing:.12em">ETIQUETA DE CADEIA DE CUSTÓDIA</b><div style="font-size:15px;margin-top:6px;line-height:1.5">Caso 01 · Item 01<br>Lacre 000417 · Recebido na escrivania</div></div>{barcode()}</div>
<div style="margin-top:18px;font-size:17px">Testemunhas do ato:</div><div style="font-size:16px;line-height:1.7">1. ______________________ &nbsp;&nbsp; 2. ______________________</div></div>
{hand('Cláudio Pires',112,704,32,rot=-1)}{hand('Ivone Barros',392,704,32,rot=-1)}
{sign('M. Farias',100,1056,34)}{sign('D. Rocha',520,1062,34)}
<div style="position:absolute;left:64px;bottom:86px;{T}font-size:14px;border-top:2px solid #17171a;width:330px;padding-top:6px">Responsável pela apreensão</div>
<div style="position:absolute;left:470px;bottom:86px;{T}font-size:14px;border-top:2px solid #17171a;width:340px;padding-top:6px">Denise Rocha · Escrivã (custódia)</div>
{stamp('LACRADO',660,790,-12,'#8a1f1f',180,34,'DHPP · 17/10/2002')}
{staple(60,40,-10)}'''
    return page(body,rot=-.5)
# 15 MODELO TERMO
def modelo():
    line=lambda lbl:f'<div style="display:flex;gap:10px;margin:14px 0;font-size:17px"><span>{lbl}</span><span style="flex:1;border-bottom:1.5px solid #222"></span></div>'
    body=letterhead('HOMICÍDIOS · CARTÓRIO','TERMO DE DEPOIMENTO<br>Modelo DHPP-07<br>fl. ____')+f'''
<div style="padding:24px 64px;{T}"><div style="font-family:Elite;font-size:32px;text-align:center;letter-spacing:.06em">TERMO DE DEPOIMENTO</div>
<div style="display:flex;gap:30px"><div style="flex:1">{line('Inquérito nº')}</div><div style="flex:1">{line('Data:')}</div></div>
<div style="margin-top:6px;font-size:16px;font-weight:700;letter-spacing:.1em">QUALIFICAÇÃO</div>
{line('Nome:')}<div style="display:flex;gap:20px"><div style="flex:1">{line('Idade:')}</div><div style="flex:1">{line('Profissão:')}</div></div>{line('Endereço:')}{line('Relação com os fatos:')}
<div style="margin-top:12px;font-size:16px;line-height:1.5;text-align:justify">Advertido(a) das penas da lei, o(a) depoente declarou o que segue:</div>
{''.join('<div style="border-bottom:1.5px solid #222;height:40px"></div>' for _ in range(9))}
<div style="margin-top:22px;font-size:15px">Lido e achado conforme, vai assinado pelo(a) depoente, pela autoridade e pelo(a) escrivão(ã).</div></div>
<div style="position:absolute;left:64px;right:64px;bottom:76px;display:flex;gap:26px;{T}font-size:13px"><div style="flex:1;border-top:2px solid #222;padding-top:5px">Depoente</div><div style="flex:1;border-top:2px solid #222;padding-top:5px">Autoridade</div><div style="flex:1;border-top:2px solid #222;padding-top:5px">Escrivão(ã)</div></div>
{holes(14,[260,640,1020])}'''
    return page(body,bg='#dcdcd6',rot=-.9,extra_css='.paper{filter:grayscale(1) contrast(1.05)}')
if __name__=='__main__':
    shot(termo_cida(),OUT+'/termo_declaracao_terceiro_cida');shot(auto_apreensao(),OUT+'/termo_apreensao_celular_helena');shot(modelo(),OUT+'/termo_depoimento_modelo')
