/* Edições do Jornal Sereno do Caso 01, "Lar Doce Lar" (docs/JORNAL_SERENO.md).
   need(F): a edição só sai quando o fato está no save (F vem de newsFacts em newspaper.js).
   front/inner: HTML da primeira página e da matéria completa (folha de 1000×748).
   mark: o trecho grifável. anno(F,page): o que o Lemos rabisca porque já sabe mais que o jornal.
   O texto é a versão da imprensa: nunca é prova e não antecipa culpas além do que já é público no caso. */
import { PRESS, pressOpt } from './press';

const B=import.meta.env.BASE_URL||'/';
const FACE=k=>`${B}news/rostos/${k}.jpg`;
const HOUSE_IMG=`${B}cenarios/rua-acacias/frente-noite.jpg`;

const ph=(k,h)=>`<div class="ht" style="background-image:url('${FACE(k)}');${h?`height:${h}px`:''}"></div>`;
const mug=(k,name,sub,tag)=>`<div class="mug">${ph(k)}<span>${name}</span>${sub?`<i>${sub}</i>`:''}${tag?`<em class="tag">${tag}</em>`:''}</div>`;
const house=(h,extra)=>`<div class="ht house" style="background-image:url('${HOUSE_IMG}');height:${h}px${extra||''}"></div>`;
const HOUSE_ICON='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8 L8 2.5 L14 8 M4 7 V14 H12 V7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const selo=e=>`<span class="selo"><b>${HOUSE_ICON}Lar doce lar</b><i>${e.day}</i></span>`;
export const head=e=>`<div class="mast"><div class="ear"><b>${e.earL[0]}</b>${e.earL[1]}</div><h2 class="ink">Jornal Sereno<small>O jornal de quem vive São Paulo</small></h2><div class="ear"><b>${e.earR[0]}</b>${e.earR[1]}</div></div>
  <div class="dl"><span>${e.date}</span><span class="ed">${e.ed||''}</span><span>${e.num}</span></div>${e.extra?'<div class="extra">Edição extra · Lar Doce Lar</div>':''}`;
export const rhead=e=>`<div class="rh"><span>${e.inner.pg} · ${e.inner.sec}</span><b>Jornal Sereno</b><span>${e.short}</span></div>`;
export const foot=e=>`<div class="foot"><b>Também</b>${e.also.map(a=>`<span>${a}</span>`).join('<span>·</span>')}</div>`;
const goto=e=>`<div><span class="goto" data-goto="1">Continua na página ${e.inner.pg} →</span></div>`;
const FACADE=`<svg viewBox="0 0 400 170" aria-hidden="true"><g fill="none" stroke="#19160f" stroke-width="2.5"><path d="M20 70 L130 30 L240 70"/><rect x="34" y="70" width="192" height="80"/><rect x="58" y="92" width="52" height="36"/><rect x="150" y="92" width="52" height="36"/><rect x="250" y="80" width="130" height="70"/>${Array.from({length:12},(_,i)=>`<line x1="${258+i*10}" y1="84" x2="${258+i*10}" y2="146"/>`).join('')}<line x1="0" y1="152" x2="400" y2="152"/></g><g font-family="'Avenir Next Condensed','Arial Narrow',sans-serif" font-weight="700" font-size="14" fill="#fff">${[[315,70,1],[130,82,2],[84,140,3]].map(([x,y,n])=>`<circle cx="${x}" cy="${y}" r="11" fill="#b3242a"/><text x="${x}" y="${y+5}" text-anchor="middle">${n}</text>`).join('')}</g></svg>`;

/* o que o Lemos disse naquele momento (src/news/press.js) */
const pq=(F,e)=>pressOpt(e.id,F.press&&F.press[e.id]);
const said=(F,e,id)=>{const o=pq(F,e);return !!o&&o.id===id;};
function pressBox(F,e){const o=pq(F,e);if(!o)return '';const P=PRESS[e.id];
  if(!o.say)return `<div class="dhpp"><h6>O que diz o DHPP</h6><p class="none">Ninguém do DHPP falou com a imprensa ${P.where}.</p></div>`;
  if(o.id==='nada')return `<div class="dhpp"><h6>O que diz o DHPP</h6><p class="none">O investigador Lemos não quis comentar: "${o.say}"</p></div>`;
  return `<div class="dhpp"><h6>O que diz o DHPP</h6><div class="dq">${ph('lemos')}<blockquote>“${o.say}”<cite>Investigador Lemos, ${P.where}</cite></blockquote></div></div>`;}
const FINAL_SIDE=['Brasil escolhe presidente no domingo','Nova frente fria na sexta','Bienal bate recorde de público'];

export const ED=[
 {id:'e1',day:'1º dia',short:'Quinta, 17/10/2002',need:F=>F.casa,head:'Lar doce lar',
  date:'São Paulo, quinta-feira, 17 de outubro de 2002',ed:'Edição da tarde',num:'Ano XLI · Nº 14.903 · R$ 1,50',
  earL:['Hoje','Mapa das obras na Marginal no caderno Cidade'],earR:['Tempo','Garoa e frio. Mín. 12° · Máx. 17°'],
  also:['Segundo turno: último debate é amanhã','Frio segue até sábado','Alagamentos param a Marginal'],
  front:(e,F)=>`<div class="kick">${selo(e)}Zona Sul · Campo Belo · Rua das Acácias</div>
   <div class="band"><div class="bt ink">Lar doce <em>lar</em></div><div class="bs">${said(F,e,'vaza')?'Casal é encontrado morto dentro da própria casa; investigador diz que ninguém arrombou a porta':'Casal é encontrado morto dentro da própria casa; <span data-a="filha">a filha achou os corpos</span> ao voltar de madrugada'}</div></div>
   <div class="g e1">
    <div>${house(172)}<div class="cap"><b>Rua das Acácias.</b> A casa da família Valença, isolada pela PM na madrugada de hoje</div>
     <div class="txt cap1" style="margin-top:8px">Nenhum vizinho ouviu barulho. Equipes do DHPP passaram a madrugada no imóvel ${said(F,e,'aberto')?'e a polícia não descarta nenhuma hipótese.':said(F,e,'vaza')?'e, segundo o investigador, ninguém precisou arrombar nada.':'e a primeira hipótese da polícia é de roubo.'}</div>${goto(e)}</div>
    <div><div class="g" style="grid-template-columns:1fr 1fr;gap:10px">${mug('ricardo','Ricardo, 49','empresário')}${mug('helena','Helena, 46','')}</div>
     ${pq(F,e)?pressBox(F,e):'<div class="tl"><h6>A madrugada</h6><p><b>Antes das 4h</b><span data-a="tl1">A filha chega e encontra os pais</span></p><p><b>Pouco depois</b>PM isola a casa e chama o DHPP</p><p><b>Até o amanhecer</b>Perícia trabalha no imóvel</p></div>'}</div>
    <div class="know"><h5>O que se sabe até agora</h5>
     <dl><dt>Quem</dt><dd>O casal Ricardo e Helena Valença</dd><dt>Onde</dt><dd>Em casa, na Rua das Acácias, Campo Belo</dd><dt>Quando</dt><dd>Madrugada desta quinta-feira</dd><dt>Encontrou</dt><dd>A filha do casal, de 19 anos</dd><dt>A polícia</dt><dd>${said(F,e,'aberto')?'DHPP não descarta nenhuma hipótese':said(F,e,'vaza')?'DHPP diz que não houve arrombamento':'DHPP investiga; primeira hipótese é roubo'}</dd></dl>
     <div class="miss"><b>Ainda sem resposta</b><span data-a="q1">${said(F,e,'vaza')?'Quem tinha a chave?':'Como o criminoso entrou?'}</span> <span data-a="q2">Algo foi levado?</span> <span data-a="q3">Por que ninguém ouviu nada?</span></div></div>
   </div>`,
  inner:{pg:'C3',sec:'Cidade',html:(e,F)=>`<div class="kick">${selo(e)}Campo Belo</div>
   <div class="ih ink" data-l="1">Noite <em>silenciosa</em></div><p class="deck">Vizinhos dizem não ter ouvido nada; polícia ainda não sabe como o criminoso entrou na casa</p>
   <div class="inner"><div class="txt"><p>Pouco antes das 4h de hoje, a filha do casal Ricardo Valença, 49, e Helena Valença, 46, chegou em casa e encontrou os pais mortos. A Polícia Militar isolou o imóvel na Rua das Acácias e o DHPP assumiu o caso ainda de madrugada.</p>
    <div class="pull">“<span class="mk" data-mk="e1">Só garoa. Não ouvi carro, não ouvi grito, nada.</span>”</div>
    <p>A frase é de uma moradora que pediu para não ser identificada. Outros vizinhos contam a mesma coisa: a noite foi quieta, e a rua só acordou com as luzes da viatura.</p>
    <p>A polícia trata o caso como possível latrocínio, mas não descarta outras hipóteses. "É cedo para falar em motivação", disse um investigador. O casal deixa dois filhos.</p>
    <p>Ricardo era empresário. Helena é lembrada por amigas como "a que unia a família".</p></div>
   <div class="side"><div class="sbox"><h5>Os Valença</h5><div class="g" style="grid-template-columns:1fr 1fr;gap:8px">${mug('ricardo','Ricardo','49 anos')}${mug('helena','Helena','46 anos')}</div></div>
    ${said(F,e,'apelo')?'<div class="sbox"><h5>DHPP pede ajuda</h5><p>Quem passou pela Rua das Acácias na madrugada de quinta e viu algo pode procurar o DHPP, sem se identificar.</p></div>':'<div class="sbox"><h5>A madrugada</h5><ol><li><span class="t">Antes das 4h</span>A filha encontra os pais</li><li><span class="t">Pouco depois</span>PM isola a casa</li><li><span class="t">Até o amanhecer</span>Perícia no imóvel</li></ol></div>'}</div></div>`},
  mark:{title:'Vizinha: "não ouvi nada"',kind:'Boato de vizinha, sem nome'},
  anno:(F,p)=>p==='front'?[
    F.arromb&&{a:'q1',k:'circle',note:'ninguém arrombou!',side:'right'},
    F.dinheiro&&{a:'q2',k:'circle',note:'os dólares',side:'right'},
    F.livia&&{a:'tl1',k:'under',note:'fora a noite toda?',side:'below'}].filter(Boolean):[]},

 {id:'e2',day:'2º dia',short:'Sexta, 18/10/2002',need:F=>F.livia,head:'A filha fala',
  date:'São Paulo, sexta-feira, 18 de outubro de 2002',num:'Ano XLI · Nº 14.904 · R$ 1,50',
  earL:['Hoje','Guia do fim de semana: teatro, cinema e shows'],earR:['Tempo','Nublado, garoa à noite. Mín. 13° · Máx. 19°'],
  also:['Debate movimenta o segundo turno','Metrô amplia horário','Feira do livro abre amanhã'],
  front:(e,F)=>`<div class="g" style="grid-template-columns:268px 1fr;margin-top:12px">
    <div>${ph('livia',320)}<div class="cap"><b>Lívia Valença</b>, 19 anos, ao deixar o DHPP na noite de ontem</div></div>
    <div><div class="kick" style="margin-top:0">${selo(e)}Caso Valença</div><div class="hl ink" data-l="2" style="font-size:128px">A filha <em>fala</em></div>
     <p class="deck">Lívia Valença depõe por três horas no DHPP e diz que <span class="mk" data-mk="e2">passou a noite fora de casa</span>; ${said(F,e,'ninguem')?'“ninguém está descartado”, diz investigador':said(F,e,'test')?'para a polícia, ela é testemunha':'polícia ainda trata o caso como roubo'}</p>
     <div class="txt two">Segundo o advogado da família, ela repetiu que estava fora na noite do crime e que encontrou os pais ao chegar, de madrugada.</div>${goto(e)}${pressBox(F,e)}</div></div>`,
  inner:{pg:'C4',sec:'Cidade',html:e=>`<div class="kick">${selo(e)}DHPP</div>
   <div class="ih ink" data-l="2">“Ela está <em>destruída</em>”, diz advogado</div><p class="deck">Filha do casal Valença chega ao DHPP no começo da tarde, sai três horas depois e não fala com a imprensa</p>
   <div class="inner"><div class="txt"><p>Lívia Valença chegou ao prédio do DHPP pouco depois das 14h de ontem, acompanhada do advogado da família. Saiu no fim da tarde, de óculos escuros, sem responder às perguntas dos repórteres.</p>
    <div class="pull">“Ela passou a noite fora e só soube quando chegou em casa.”</div>
    <p>Segundo o advogado, a jovem de 19 anos repetiu aos investigadores a versão que já tinha dado à PM na madrugada do crime. A polícia não comenta o conteúdo do depoimento.</p>
    <p>Investigadores dizem que todas as pessoas próximas à família serão ouvidas. "Ninguém está descartado, ninguém está acusado", afirmou um policial.</p></div>
   <div class="side"><div class="sbox"><h5>O caso até aqui</h5><ol><li><span class="t">Madrugada de quinta</span>Casal é achado morto em casa</li><li><span class="t">Quinta</span>Perícia passa o dia no imóvel</li><li><span class="t">Ontem</span>Filha depõe por três horas</li></ol></div></div></div>`},
  mark:{title:'Lívia: "passou a noite fora"',kind:'Versão dela, publicada pela imprensa'},
  anno:(F,p)=>p==='front'?[{a:'@e2',k:'under',note:'onde? com quem?',side:'below'}]:[]},

 {id:'e3',day:'3º dia',short:'Sábado, 19/10/2002',need:F=>F.lock,head:'Ninguém arrombou a porta',
  date:'São Paulo, sábado, 19 de outubro de 2002',num:'Ano XLI · Nº 14.905 · R$ 1,80',
  earL:['Hoje','Roteiro de passeios para o fim de semana'],earR:['Tempo','Sol entre nuvens. Mín. 14° · Máx. 22°'],
  also:['Carreatas na reta final da campanha','Clássico no domingo, às 16h','Garoa dá trégua'],
  front:e=>`<div class="kick">${selo(e)}Caso Valença · Perícia</div><div class="hl ink" data-l="2" style="font-size:80px">Ninguém <em>arrombou</em> a porta</div>
   <div class="g" style="grid-template-columns:430px 1fr">
    <div class="info"><h5>A casa por fora</h5>${FACADE}<ol><li><b>1</b><span data-a="m1">Portão da garagem: sem marcas</span></li><li><b>2</b>Porta da frente: fechadura intacta</li><li><b>3</b>Janelas: vidros inteiros</li></ol></div>
    <div><p class="deck">Perícia não encontra sinal de invasão na casa dos Valença; para investigadores, quem entrou não precisou forçar nada</p>
     <div class="txt cap1">O DHPP não confirma oficialmente, mas a tese de assalto, levantada logo depois do crime, perdeu força entre os investigadores.</div>${goto(e)}</div></div>`,
  inner:{pg:'C2',sec:'Polícia',html:e=>`<div class="kick">${selo(e)}Perícia</div>
   <div class="ih ink" data-l="1">Quem tinha a <em>chave?</em></div><p class="deck">Sem arrombamento, a investigação muda de direção: deixa de procurar um estranho e passa a olhar para quem conhecia a casa</p>
   <div class="inner"><div class="txt"><p>A perícia examinou as fechaduras das portas, o portão da garagem e as janelas do térreo da casa da Rua das Acácias. Em nenhum ponto foram encontradas marcas de ferramenta ou vidro quebrado, segundo fonte ligada à investigação.</p>
    <div class="pull">“Quando não há arrombamento, a pergunta passa a ser <span class="mk" data-mk="e3">quem tinha acesso à casa</span>.”</div>
    <p>A frase é de um ex-delegado ouvido pelo jornal. Chaves, senhas e a rotina da família passam a importar mais do que impressões digitais na porta.</p>
    <p>Oficialmente, o DHPP diz apenas que "todas as hipóteses seguem em análise".</p></div>
   <div class="side"><div class="sbox"><h5>O que foi examinado</h5><ul><li>Fechaduras da frente e dos fundos</li><li>Portão da garagem</li><li>Janelas do térreo</li><li>Muros e grades</li></ul></div><div class="sbox"><h5>Resultado</h5><p>Nenhum sinal de entrada forçada.</p></div></div></div>`},
  mark:{title:'Quem tinha acesso à casa',kind:'Pergunta levantada pela imprensa'},
  anno:(F,p)=>p==='front'?[{a:'m1',k:'circle',note:'bate com a varredura',side:'below'}]:[]},

 {id:'e4',day:'5º dia',short:'Segunda, 21/10/2002',need:F=>F.dinheiro,head:'Onde estão os dólares?',
  date:'São Paulo, segunda-feira, 21 de outubro de 2002',num:'Ano XLI · Nº 14.907 · R$ 1,50',
  earL:['Hoje','Caderno de Empregos com 1.200 vagas'],earR:['Tempo','Nublado. Mín. 14° · Máx. 20°'],
  also:['Última semana antes da votação','Dólar fecha em alta','Novas linhas de ônibus em novembro'],
  front:(e,F)=>`<div class="g" style="grid-template-columns:1fr 350px;margin-top:10px">
    <div><div class="kick" style="margin-top:0">${selo(e)}Caso Valença</div><div class="hl ink" data-l="3" style="font-size:100px">${said(F,e,'valor')?'Onde estão os <em data-a="dol">US$ 5 mil?</em>':'Onde estão os <em data-a="dol">dólares?</em>'}</div>
     <p class="deck">${said(F,e,'valor')?'Investigador confirma que a vítima sacou cinco mil dólares dias antes do crime; dinheiro estaria guardado na casa':'Polícia rastreia dinheiro em moeda americana sacado pela vítima dias antes do crime e que estaria guardado na casa'}</p>
     <div class="txt two">${said(F,e,'valor')?'O DHPP não diz se a quantia foi encontrada.':'O DHPP não informa o valor nem se a quantia foi encontrada.'} O banco não comenta. A família não quis falar.</div>${goto(e)}</div>
    <div><div class="cash"><div class="n" style="left:18px;top:120px;transform:rotate(-8deg)">US$</div><div class="n" style="left:40px;top:96px;transform:rotate(4deg)">US$</div><div class="n" style="left:26px;top:150px;transform:rotate(-2deg)">US$</div><div class="q">?</div></div><div class="cap"><b>Arte Jornal Sereno.</b> ${said(F,e,'valor')?'O valor foi revelado pelo DHPP':'A quantia nunca foi divulgada'}</div>${pressBox(F,e)}</div></div>`,
  inner:{pg:'C3',sec:'Polícia',html:e=>`<div class="kick">${selo(e)}Investigação</div>
   <div class="ih ink" data-l="2">O dinheiro que <em>ninguém viu</em></div><p class="deck">Investigadores querem saber quem sabia que a família guardava moeda estrangeira em casa</p>
   <div class="inner"><div class="txt"><p>Dias antes de morrer, Ricardo Valença teria retirado uma quantia em dólares, segundo fonte ligada à investigação. O dinheiro estaria guardado temporariamente na casa da Rua das Acácias.</p>
    <div class="pull">“A pergunta é <span class="mk" data-mk="e4">quem sabia que o dinheiro estava lá</span>.”</div>
    <p>A polícia não informa o valor nem se a quantia foi encontrada. O banco procurado pela reportagem não comenta movimentações de clientes.</p>
    <p>Para um investigador ouvido em reserva, o dinheiro pode explicar o crime ou pode ser só uma pista falsa. "Depende de quem sabia."</p></div>
   <div class="side"><div class="sbox"><h5>O que se sabe</h5><ul><li>Saque em moeda americana dias antes</li><li>Quantia guardada na casa</li><li>Valor não divulgado</li></ul></div></div></div>`},
  mark:{title:'Quem sabia do dinheiro',kind:'Pergunta levantada pela imprensa'},
  anno:(F,p)=>p==='front'&&(F.cinta||said(F,ED_E4,'valor'))?[{a:'dol',k:'circle',note:said(F,ED_E4,'valor')?'saiu no jornal…':'US$ 5.000 · cinta do Meridional',side:'below'}]:[]},

 ...['A','B','C'].map(X=>({id:'f'+X,day:'7º dia',short:'Quarta, 23/10/2002',extra:true,need:F=>F.final===X,
  head:{A:'A filha planejou, diz a polícia',B:'Quem abriu a porta?',C:'Sem culpados'}[X],
  date:'São Paulo, quarta-feira, 23 de outubro de 2002',num:'Ano XLI · Nº 14.909 · R$ 1,50',
  earL:['Hoje','O que muda nas regras de trânsito'],earR:['Tempo','Garoa fina. Mín. 13° · Máx. 18°'],also:FINAL_SIDE,
  front:e=>({
   A:`<div class="kick">${selo(e)}Inquérito concluído</div><div class="hl ink" data-l="2" style="font-size:80px">A filha planejou, <em>diz a polícia</em></div>
     <div class="g" style="grid-template-columns:150px 150px 150px 1fr;gap:16px">${mug('livia','Lívia Valença','mentora, segundo o DHPP','Indiciada')}${mug('caio','Caio Duarte','namorado','Indiciado')}${mug('teo','Téo Duarte','irmão de Caio','Indiciado')}
     <div><p class="deck" style="font-size:18px">Para o DHPP, o roubo foi encenado; o motivo seria a herança da família</p><div class="txt cap1">Os três foram indiciados pela morte de Ricardo e Helena Valença. A defesa não se manifestou.</div>${goto(e)}</div></div>`,
   B:`<div class="kick">${selo(e)}Irmãos indiciados</div><div class="hl ink" data-l="1" style="font-size:96px">Quem abriu a <em>porta?</em></div>
     <div class="g" style="grid-template-columns:150px 150px 150px 1fr;gap:16px">${mug('caio','Caio Duarte','namorado da filha','Indiciado')}${mug('teo','Téo Duarte','irmão de Caio','Indiciado')}<div class="mug void"><div class="box" data-a="void">?</div><span>Ninguém</span><i>quem sabia do alarme, do cão e do dinheiro?</i></div>
     <div><p class="deck" style="font-size:18px">Polícia aponta os irmãos Duarte, mas não explica como eles conheciam a rotina da casa</p><div class="txt cap1">A filha do casal não foi indiciada. O relatório não diz quem passou as informações aos dois.</div>${goto(e)}</div></div>`,
   C:`<div class="kick">${selo(e)}Promotoria devolve inquérito</div><div class="hl ink" data-l="1" style="font-size:96px">Sem <em>culpados</em></div>
     <div class="g" style="grid-template-columns:520px 1fr"><div style="position:relative">${house(250)}<div class="stamp" style="left:120px;top:90px">Arquivado</div><div class="cap"><b>Rua das Acácias.</b> A casa dos Valença, ainda fechada</div></div>
     <div><p class="deck">Provas reunidas não sustentam a acusação, diz a promotoria; caso pode ser arquivado</p><div class="txt cap1">A polícia diz que a investigação pode ser reaberta se surgirem fatos novos.</div>${goto(e)}</div></div>`})[X],
  inner:{pg:'C1',sec:'Cidade',html:()=>({
   A:`<div class="kick">${selo({day:'7º dia'})}O inquérito</div><div class="ih ink" data-l="1">Como foi o <em>crime</em></div><p class="deck">A reconstituição do DHPP, passo a passo, do código do alarme à nota do motel</p>
     <div class="inner"><div class="txt"><p>Segundo o relatório, o alarme da casa foi desligado às 23h52 com o código da família. O cachorro, Thor, estava preso no canil. Ninguém precisou arrombar nada.</p><div class="pull">“O roubo foi montado para enganar a polícia.”</div><p>Os executores, Caio e Téo Duarte, entraram sabendo a rotina da casa. Depois, objetos foram revirados para parecer assalto. A nota de um motel registra a entrada de Lívia e Caio às 0h56, depois do período crítico: o álibi foi construído depois.</p><p>Para o DHPP, Lívia planejou o crime e repassou as informações. O motivo seria a herança.</p></div>
     <div class="side"><div class="sbox"><h5>A noite, segundo o inquérito</h5><ol><li><span class="t">23h52</span>Alarme desligado com o código</li><li><span class="t">Depois</span>Thor preso no canil; entrada sem arrombamento</li><li><span class="t">0h56</span>Entrada no motel registrada</li><li><span class="t">Antes das 4h</span>A filha "encontra" os pais</li></ol></div></div></div>`,
   B:`<div class="kick">${selo({day:'7º dia'})}O inquérito</div><div class="ih ink" data-l="2">O que ficou sem <em>resposta</em></div><p class="deck">Os irmãos foram indiciados, mas o relatório não explica como eles sabiam o que sabiam</p>
     <div class="inner"><div class="txt"><p>O inquérito aponta Caio e Téo Duarte como os autores das mortes. Faltam, porém, respostas que a própria polícia levantou no começo da investigação.</p><div class="pull">“Alguém de dentro abriu caminho. Quem?”</div><p>Como os dois desligaram o alarme sem disparar? Quem sabia que o cachorro ficaria preso? Quem contou que havia dólares guardados na casa? O relatório não diz.</p><p>Para a família de Helena, a sensação é de que o caso foi fechado pela metade.</p></div>
     <div class="side"><div class="sbox"><h5>Perguntas abertas</h5><ul><li>Quem passou o código do alarme?</li><li>Quem sabia do canil?</li><li>Quem sabia dos dólares?</li></ul></div></div></div>`,
   C:`<div class="kick">${selo({day:'7º dia'})}Promotoria</div><div class="ih ink" data-l="2">Por que o caso não se <em>sustentou</em></div><p class="deck">Para a promotoria, as provas apresentadas não ligam os acusados aos fatos da noite do crime</p>
     <div class="inner"><div class="txt"><p>Ao devolver o inquérito, a promotoria afirmou que a acusação "não encontra apoio nas provas reunidas". Sem novos elementos, o caso caminha para o arquivo.</p><div class="pull">“Não basta suspeitar. É preciso provar.”</div><p>Investigadores ouvidos em reserva admitem que pontos importantes da noite do crime não foram esclarecidos. A polícia diz que o caso pode ser reaberto.</p><p>A casa da Rua das Acácias continua fechada.</p></div>
     <div class="side"><div class="sbox"><h5>O que diz a promotoria</h5><p>Acusação sem apoio nas provas. Inquérito devolvido ao DHPP.</p></div></div></div>`})[X]},
  mark:null,
  anno:(F,p)=>p==='front'&&X==='B'?[{a:'void',k:'circle',note:'faltou essa peça',side:'below'}]:[]}))
];
const ED_E4=ED.find(e=>e.id==='e4');
