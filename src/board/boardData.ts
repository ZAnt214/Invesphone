/* Quadro do Caso 01: onde cada pista fica na cortiça e o que se sabe dela.
   Quem disse cada frase e quais pistas sustentam confronto vêm dos próprios depoimentos e da equipe,
   para o quadro nunca contar uma história diferente do resto do jogo. */
import { clues as caseClues, people as casePeople } from '../case01'
import { interrogations } from '../interrogation/registry'
import { caseTeam, teamDialogues, teamMaterialRequests, DEFAULT_DISCOVERED } from '../team/teamData'
import { progressOf } from '../case/depositions'
import type { CaseSave } from '../case/caseSave'

/** área de origem de cada papel (usada pelas imagens e pela pré-carga) */
export type ZoneId = 'cena'|'pessoas'|'noite'|'acesso'|'motivo'|'dinheiro'

/* Etapas do quadro = capítulos do caso (src/case01.ts). Cada capítulo é uma árvore de dedução: a pergunta do capítulo é a
   raiz; os três galhos são perguntas menores. O jogador põe evidências nos espaços de cada galho e escolhe o que elas provam;
   o jogo confere na hora (resposta certa + evidências que a sustentam). Com os três galhos acesos, acende a conclusão.
   Nada aqui libera ou trava a história: depoimentos, materiais e confrontos seguem pelas regras de sempre. */
export type Branch = {
  id:string
  /** a pergunta do galho */
  q:string
  /** um grupo por espaço: qualquer uma das pistas do grupo serve naquele espaço (a ordem dos espaços não importa) */
  need:string[][]
  /** text: escolher a frase; people: escolher as pessoas */
  kind:'text'|'people'
  opts?:string[]
  people?:string[]
  ok:number|string[]
  /** galho de pessoas cuja resposta certa depende de qual evidência foi presa (pista → pessoa) */
  okBy?:Record<string,string>
  /** antes desta etapa do caso (task), a resposta fica anotada como hipótese, sem conferir: o quadro não entrega papéis antes da hora */
  confirmAfter?:number
  /** como o galho fica escrito quando acende */
  short:string
  /** Lemos, quando acende */
  yes:string
  /** Sônia, quando a resposta não fecha (aponta onde olhar, sem dar a resposta) */
  no:string
}
export type ChapterTree = {short:string;q:string;done:[string,string];pool:string[];branches:Branch[]}
export const TREE:ChapterTree[] = [
  {short:'A casa',q:'Foi um roubo?',done:['Não foi um roubo comum.','Quem entrou conhecia a casa.'],
    pool:['porta_intacta','painel_alarme','valores_intactos','escritorio_revirado','busca_dirigida','cao_canil','vitimas_dormindo','quarto_livia'],
    branches:[
      {id:'c1_entrada',q:'Como entraram?',kind:'text',need:[['porta_intacta'],['painel_alarme']],
        opts:['Arrombaram a porta da frente','Entraram por uma janela dos fundos','Ninguém forçou: abriram com a chave e desligaram o alarme com o código'],ok:2,
        short:'Sem força: chave e código',yes:'Porta sem marca e alarme desligado com o código. Quem entrou tinha a chave e sabia o código.',no:'Arrombamento deixa marca. Olhe a porta de novo.'},
      {id:'c1_valores',q:'Levaram alguma coisa?',kind:'text',need:[['valores_intactos'],['escritorio_revirado','busca_dirigida']],
        opts:['Levaram o que acharam, às pressas','Os valores ficaram: a bagunça foi montada','Reviraram tudo e não acharam nada'],ok:1,
        short:'Os valores ficaram: bagunça montada',yes:'Relógio em cima da mesa, joias na cômoda. Quem revirou o escritório não estava atrás de valor.',no:'Ladrão com pressa não deixa o relógio em cima da mesa. Volte à sala.'},
      {id:'c1_casa',q:'O que sabiam da casa?',kind:'text',need:[['cao_canil'],['vitimas_dormindo']],
        opts:['Pegaram a família de surpresa','Sabiam do Thor e de que o casal dormia','Só conheciam a rua'],ok:1,
        short:'Sabiam do Thor e do sono',yes:'Thor no canil, o casal no quarto. Quem entrou sabia como a casa estava àquela hora.',no:'Um cachorro solto não deixa ninguém entrar em silêncio. Quem prendeu o Thor?'}]},
  {short:'Versões',q:'Quem conhecia a casa?',done:['Lívia e Caio podiam entrar sem forçar.','O carro de Caio foi visto perto da casa. Falta conferir os horários.'],
    pool:['lan_paga','rafael_lan_confirmada','alibi_cida','cida_alibi_termo','livia_chave','livia_codigo','inconsistencia_caio_codigo','caio_viu_digitando','livia_porta_aberta','vigia_gol','caio_gol_dele','vigia_horario','brigas_namoro'],
    branches:[
      {id:'c2_fora',q:'Quem tem álibi confirmado?',kind:'people',people:['livia','caio','rafael','cida'],ok:[],okBy:{lan_paga:'rafael',rafael_lan_confirmada:'rafael',alibi_cida:'cida',cida_alibi_termo:'cida'},need:[['lan_paga','rafael_lan_confirmada','alibi_cida','cida_alibi_termo']],
        short:'Álibi confirmado: fora da suspeita',yes:'Recibo ou confirmação de terceiros: quem estava longe dali tem como provar.',no:'De quem é o álibi que você prendeu?'},
      {id:'c2_acesso',q:'Quem podia entrar sem forçar?',kind:'people',people:['livia','caio','rafael','cida','jorge'],ok:['livia','caio'],need:[['livia_chave','livia_codigo','livia_porta_aberta'],['caio_viu_digitando','inconsistencia_caio_codigo']],
        short:'Lívia e Caio podiam entrar',yes:'Chave e código: Lívia tinha os dois, e Caio viu o código ser digitado.',no:'Não basta ter estado na casa. Quem tinha a chave e o código?'},
      {id:'c2_rua',q:'O que a rua viu?',kind:'text',need:[['vigia_gol'],['caio_gol_dele','vigia_horario']],
        opts:['Ninguém estranho passou','O Gol de Caio estava perto da casa','Um carro qualquer, sem dono'],ok:1,
        short:'O Gol de Caio estava ali',yes:'O vigia viu o Gol branco, e o Gol é de Caio. Quem dirigia, ele não viu.',no:'O vigia lembra de um carro. De quem é?'}]},
  {short:'A janela',q:'O álibi cobre o horário?',done:['O álibi não cobre a janela.','Entre o alarme e o motel, 1h04 sem registro. Isso ainda não diz quem entrou.'],
    pool:['log_alarme','nota_motel','caio_horario','vigia_horario','caio_sem_intervalo','agenda_helena','ameaca_heranca','brigas_namoro','pergunta_inventario','livia_sabia_heranca'],
    branches:[
      {id:'c3_noite',q:'O álibi cobre a noite?',kind:'text',need:[['log_alarme'],['nota_motel']],
        opts:['Sim: estavam no motel desde as 23h','Não: entre 23:52 e 00:56 ninguém os viu','O alarme registrou a hora errada'],ok:1,
        short:'Não cobre 23:52 → 00:56',yes:'Alarme desligado às 23:52, entrada no motel às 00:56. Uma hora e quatro minutos sem ninguém.',no:'Registro de sistema não tem pressa nem motivo. Compare as duas horas.'},
      {id:'c3_gol',q:'Onde estava o Gol?',kind:'text',need:[['vigia_horario'],['caio_horario','caio_sem_intervalo']],
        opts:['No motel a noite toda','Perto da casa, antes de chegar ao motel','Na casa de Téo'],ok:1,
        short:'O Gol perto da casa antes do motel',yes:'Caio diz “onze e pouco” no motel. O vigia viu o Gol perto da casa às 23h30.',no:'Duas versões para o mesmo carro na mesma hora. Qual tem testemunha?'},
      {id:'c3_porque',q:'Por quê?',kind:'text',need:[['agenda_helena','brigas_namoro'],['ameaca_heranca','pergunta_inventario','livia_sabia_heranca']],
        opts:['Uma dívida de Ricardo','A família contra o namoro, com a herança em jogo','Um assalto que deu errado'],ok:1,
        short:'Namoro e herança',yes:'A agenda de Helena e a ameaça do pai. O namoro e a herança estavam em jogo.',no:'Volte ao que a família dizia sobre Lívia e Caio.'}]},
  {short:'O dinheiro',q:'De onde vem o dinheiro de Téo?',done:['O dinheiro da casa chegou a Téo.','Falta explicar por que ele tinha esse dinheiro.'],
    pool:['extrato_ricardo','carta_cobranca','moto_dolares','cinta_bancaria','teo_adiantamento','valores_intactos','busca_dirigida','agenda_helena'],
    branches:[
      {id:'c4_alvo',q:'Por que quase nada sumiu?',kind:'text',need:[['valores_intactos','busca_dirigida']],
        opts:['Os ladrões se assustaram e fugiram','Procuravam um dinheiro certo, e sabiam onde','Não acharam o cofre'],ok:1,
        short:'Procuravam um dinheiro certo',yes:'Joias e relógio ficaram. Quem entrou foi atrás de uma coisa só.',no:'Se fosse susto, a bagunça não seria tão escolhida. Olhe o que ficou.'},
      {id:'c4_origem',q:'De onde saíram os dólares?',kind:'text',need:[['cinta_bancaria'],['extrato_ricardo']],
        opts:['De um negócio de Téo','Do dinheiro que Ricardo sacou e guardava em casa','De uma economia da família Duarte'],ok:1,
        short:'Do dinheiro guardado na casa',yes:'Banco Meridional, agência 0431, 15/10/2002, US$ 5.000. A mesma cinta do saque de Ricardo.',no:'Compare a cinta com o extrato de Ricardo.'},
      {id:'c4_teo',q:'Com quem estava o dinheiro?',kind:'people',people:['caio','teo','livia','rafael'],ok:['teo'],need:[['moto_dolares'],['teo_adiantamento']],
        short:'Com Téo, passado por Caio',yes:'Os dólares da moto e o que Téo admitiu: Caio lhe passou parte do dinheiro.',no:'Quem gastou o que não tinha?'}]},
  {short:'A última versão',q:'Quem executou e quem facilitou?',done:['Caio e Téo entraram. Lívia abriu o caminho.','Pela herança e pelo namoro que os pais não aceitavam.'],
    pool:['teo_entrou_com_caio','caio_digitou_alarme','caio_admite_codigo','plano_preparado_antes','livia_thor_caio','livia_passou_codigo','confissao_teo','ameaca_heranca','livia_sabia_heranca','agenda_helena','log_alarme'],
    branches:[
      {id:'c5_dentro',q:'Quem entrou na casa?',kind:'people',people:['livia','caio','teo','rafael','jorge'],ok:['caio','teo'],need:[['teo_entrou_com_caio','confissao_teo'],['caio_digitou_alarme','caio_admite_codigo','log_alarme']],
        short:'Caio e Téo entraram',yes:'Téo entrou com Caio, e Caio digitou o código às 23:52.',no:'Quem digitou o código, e quem estava junto?'},
      {id:'c5_caminho',q:'Quem abriu o caminho?',kind:'people',people:['livia','caio','teo','cida'],ok:['livia'],confirmAfter:8,need:[['livia_passou_codigo','livia_thor_caio'],['plano_preparado_antes','confissao_teo']],
        short:'Lívia preparou o acesso',yes:'O código, o Thor, o horário. Alguém de dentro deixou tudo pronto.',no:'Quem chegou sabendo de tudo aprendeu com alguém da casa.'},
      {id:'c5_motivo',q:'Por quê?',kind:'text',need:[['ameaca_heranca'],['livia_sabia_heranca','agenda_helena','brigas_namoro','pergunta_inventario']],
        opts:['Roubo','Herança e o conflito dos pais com o namoro','Vingança de Téo'],ok:1,
        short:'Herança e namoro',yes:'O pai ameaçou cortar a herança, e Lívia sabia o que receberia.',no:'Nada de valor saiu da casa, além do dinheiro guardado. O que mais estava em jogo?'}]},
]
export const stageOfTask=(t:number)=>t<=1?1:t===2?2:t<=4?3:t<=6?4:5

/** ph = foto da varredura, doc = documento, nt = nota (fala ou registro da equipe). */
export type Card = {
  zone:ZoneId; kind:'ph'|'doc'|'nt'
  x?:number; y?:number; r?:number
  /** imagem oficial (foto do cômodo ou documento da equipe) */
  img?:string
  /** ponto do cômodo no croqui (fração da imagem), para as fotos da cena */
  u?:number; v?:number
  /** minutos depois das 22:00 na linha da noite; reg = registro (fica preso), senão é fala que o jogador põe na linha */
  tm?:number; reg?:boolean
  /** nota que fica embaixo da foto de uma pessoa (álibis e falas dela) */
  col?:string; row?:number
  /** de onde veio, quando não é depoimento nem material da equipe */
  src?:string
}
const ROOM='/evidence/case01/new/comodos/'
const DOC='/evidence/case01/docs/'
export const CARDS:Record<string,Card> = {
  porta_intacta:{zone:'cena',kind:'ph',img:ROOM+'comodo_01_entrada.jpg',x:18,y:96,r:-4,u:.052,v:.31,src:'Varredura da casa · Entrada'},
  painel_alarme:{zone:'cena',kind:'ph',img:ROOM+'comodo_09_painel_alarme.jpg',x:18,y:206,r:3,u:.139,v:.253,src:'Varredura da casa · Painel do alarme'},
  valores_intactos:{zone:'cena',kind:'ph',img:ROOM+'comodo_02_sala.jpg',x:118,y:290,r:-2,u:.229,v:.352,src:'Varredura da casa · Sala'},
  vitimas_dormindo:{zone:'cena',kind:'ph',img:ROOM+'comodo_06_quarto_casal.jpg',x:232,y:294,r:2,u:.24,v:.582,src:'Varredura da casa · Quarto do casal'},
  cao_canil:{zone:'cena',kind:'ph',img:ROOM+'comodo_08_canil.jpg',x:346,y:290,r:-3,u:.45,v:.71,src:'Varredura da casa · Canil'},
  escritorio_revirado:{zone:'cena',kind:'ph',img:ROOM+'comodo_04_escritorio.jpg',x:454,y:96,r:4,u:.581,v:.352,src:'Varredura da casa · Escritório'},
  quarto_livia:{zone:'cena',kind:'ph',img:ROOM+'comodo_07_quarto_livia.jpg',x:454,y:206,r:-3,u:.5,v:.52,src:'Varredura da casa · Quarto de Lívia'},
  busca_dirigida:{zone:'cena',kind:'nt',x:300,y:40,r:2},
  livia_chave:{zone:'acesso',kind:'nt',x:16,y:132,r:-1.5},
  livia_porta_aberta:{zone:'acesso',kind:'nt',x:16,y:196,r:1.5},
  livia_codigo:{zone:'acesso',kind:'nt',x:200,y:120,r:1},
  inconsistencia_caio_codigo:{zone:'acesso',kind:'nt',x:200,y:178,r:-1.5},
  caio_viu_digitando:{zone:'acesso',kind:'nt',x:200,y:236,r:1.2},
  livia_passou_codigo:{zone:'acesso',kind:'nt',x:200,y:294,r:-1},
  rafael_nao_prendeu:{zone:'acesso',kind:'nt',x:390,y:132,r:1.5},
  log_alarme:{zone:'noite',kind:'doc',img:DOC+'log-alarme.svg',tm:112,reg:true},
  nota_motel:{zone:'noite',kind:'doc',img:DOC+'motel-cupom.svg',tm:176,reg:true},
  caio_horario:{zone:'noite',kind:'nt',tm:60},
  vigia_horario:{zone:'noite',kind:'nt',tm:90},
  caio_saiu_22h30:{zone:'noite',kind:'nt',tm:30},
  caio_gol_dele:{zone:'pessoas',kind:'nt',col:'caio',row:0},
  caio_sem_intervalo:{zone:'pessoas',kind:'nt',col:'caio',row:1},
  lan_paga:{zone:'pessoas',kind:'nt',img:DOC+'lan-house-recibo.svg',col:'rafael',row:0},
  rafael_lan_confirmada:{zone:'pessoas',kind:'nt',col:'rafael',row:1},
  alibi_cida:{zone:'pessoas',kind:'nt',col:'cida',row:0},
  cida_alibi_termo:{zone:'pessoas',kind:'nt',col:'cida',row:1},
  vigia_gol:{zone:'pessoas',kind:'nt',col:'jorge',row:0},
  jorge_so_o_carro:{zone:'pessoas',kind:'nt',col:'jorge',row:1},
  confissao_teo:{zone:'pessoas',kind:'nt',col:'teo',row:0},
  agenda_helena:{zone:'motivo',kind:'doc',img:DOC+'agenda-helena.svg',x:24,y:118,r:-3,src:'Telefone de Helena · Agenda'},
  brigas_namoro:{zone:'pessoas',kind:'nt',col:'livia',row:0},
  ameaca_heranca:{zone:'motivo',kind:'nt',x:140,y:112,r:-1.5},
  pergunta_inventario:{zone:'pessoas',kind:'nt',col:'livia',row:1},
  livia_sabia_heranca:{zone:'motivo',kind:'nt',x:310,y:118,r:1.2},
  extrato_ricardo:{zone:'dinheiro',kind:'doc',img:DOC+'extrato-ricardo.svg',x:24,y:110,r:-3},
  carta_cobranca:{zone:'dinheiro',kind:'doc',img:DOC+'carta-cobranca.svg',x:120,y:122,r:3},
  moto_dolares:{zone:'dinheiro',kind:'doc',img:DOC+'apreensao-dolares.svg',x:262,y:108,r:-2},
  cinta_bancaria:{zone:'dinheiro',kind:'doc',img:DOC+'cinta-bancaria.svg',x:360,y:118,r:2.5},
  teo_adiantamento:{zone:'dinheiro',kind:'nt',x:262,y:262,r:-1.5},
}
/** Títulos curtos para caber no papel; o texto completo vem de src/case01.ts. */
export const SHORT:Record<string,string> = {
  vitimas_dormindo:'Ataque no sono',livia_porta_aberta:'“Alguém deixou aberta”',livia_codigo:'Lívia sabia o código',inconsistencia_caio_codigo:'“Nunca passei o código”',
  caio_horario:'Caio: motel “onze e pouco”',vigia_horario:'Gol ali ~23h30',caio_saiu_22h30:'Caio saiu 22h30',caio_gol_dele:'O Gol é de Caio',caio_sem_intervalo:'Caio não explica 1h04',
  rafael_lan_confirmada:'LAN confirmada',alibi_cida:'Cida com a família',cida_alibi_termo:'Termo da irmã',vigia_gol:'Gol branco na rua',moto_dolares:'Dólares apreendidos',
}

export const BOARD_PEOPLE=['livia','caio','rafael','cida','jorge','teo']
export const VICTIMS=[['ricardo','Ricardo'],['helena','Helena']] as const
/** Versão leve (public/thumbs, feita por scripts/make-board-thumbs.py) das fotos que o quadro mostra pequenas.
 *  O original oficial continua sendo o que abre no visualizador. */
export const thumb=(src:string)=>/^\/(evidence\/case01\/new|characters)\/.+\.jpg$/.test(src)?'/thumbs'+src:src
export const portrait=(id:string)=>id==='ricardo'||id==='helena'?`/characters/${id}/portrait.jpg`:`/characters/${id}/expressions/neutral.jpg`
/** Entrada do quadro: Lemos de costas (versão leve da arte oficial public/characters/lemos/back.png) e a parede do fundo. */
export const LEMOS_BACK:string|null='/thumbs/characters/lemos/back.webp'
export const WALL_IMGS=['/evidence/case01/new/croqui_rua.jpg','/evidence/case01/new/capa_inquerito.jpg','/evidence/case01/new/termo_depoimento_modelo.jpg',
  '/evidence/case01/new/comodos/comodo_02_sala.jpg','/evidence/case01/new/comodos/comodo_05_corredor.jpg','/evidence/case01/new/comodos/comodo_03_cozinha.jpg',
  '/evidence/case01/new/comodos/comodo_01_entrada.jpg','/evidence/case01/new/croqui_residencia.jpg'].map(thumb)
export const personOf=(id:string)=>casePeople.find(p=>p.id===id)
export const clueOf=(id:string)=>caseClues.find(c=>c.id===id)
export const titleOf=(id:string)=>SHORT[id]??clueOf(id)?.title??id

/** Frases marcadas nos depoimentos: pista → [quem, pergunta, frase]. */
export const SAID:Record<string,{person:string;question:string;phrase:string}[]> = {}
for(const [pid,cfg] of Object.entries(interrogations)){
  for(const q of cfg.questions)for(const h of q.highlights??[])(SAID[h.clue]??=[]).push({person:pid,question:q.id,phrase:h.phrase})
}

/** O que o jogador tem agora: pistas do save mais as fotos que a varredura da casa trouxe. */
export function cluesOf(g:CaseSave,found:string[]){return [...new Set([...g.clues,...found])].filter(id=>!!clueOf(id))}

/** Quem a pista envolve, para o rosto no papel quando ela não tem foto nem documento. */
const WHO:[RegExp,string][]=[[/^livia|^pergunta_inventario|^brigas/,'livia'],[/^caio/,'caio'],[/^teo|^confissao_teo|^plano_preparado/,'teo'],[/^rafael|^lan_/,'rafael'],[/^cida|^alibi_cida/,'cida'],[/^jorge|^vigia/,'jorge'],[/^ameaca_heranca/,'livia'],[/^inconsistencia_caio/,'caio']]
export function personOfClue(id:string){return SAID[id]?.[0]?.person??WHO.find(([r])=>r.test(id))?.[1]}
/** Imagem do papel: foto da perícia ou documento oficial; senão, o rosto de quem disse; senão, o termo de depoimento. */
export function clueImg(id:string){const c=CARDS[id];if(c?.img)return c.img;const p=personOfClue(id);return p?portrait(p):'/evidence/case01/new/termo_depoimento_modelo.jpg'}
export const kindOf=(id:string)=>CARDS[id]?.kind==='ph'?'Foto da perícia':CARDS[id]?.img||clueOf(id)?.category==='documento'||clueOf(id)?.category==='financeiro'?'Documento':clueOf(id)?.category==='digital'?'Registro':'Depoimento'

/** Um galho fecha quando as pistas presas cabem nos espaços dele (uma de cada grupo, em qualquer ordem). */
export function fits(b:Branch,ids:(string|null)[]){
  if(ids.some(x=>!x)||ids.length!==b.need.length)return false
  if(b.need.length===1)return b.need[0].includes(ids[0]!)
  const [x,y]=ids as string[];return (b.need[0].includes(x)&&b.need[1].includes(y))||(b.need[0].includes(y)&&b.need[1].includes(x))
}
export function rightAnswer(b:Branch,a:number|string[]|undefined,ids:(string|null)[]=[]){
  if(a==null)return false
  if(b.kind==='text')return a===b.ok
  const ok=b.okBy?[...new Set(ids.filter((x):x is string=>!!x).map(id=>b.okBy![id]).filter(Boolean))]:b.ok as string[]
  const s=(v:string[])=>[...v].sort().join();return Array.isArray(a)&&ok.length>0&&s(a)===s(ok)
}

/** Frases que o jogador de fato ouviu (a pergunta foi feita no depoimento). */
export function heardOf(g:CaseSave,id:string){
  return (SAID[id]??[]).filter(s=>interrogations[s.person]&&progressOf(g,s.person).asked.includes(s.question))
}

/** Origem de uma pista: varredura, material ou conversa da equipe. */
export function sourcesOf(g:CaseSave,id:string,found:string[]){
  const out:{text:string;img?:string}[]=[]
  const c=CARDS[id]
  if(c?.src&&(c.zone!=='cena'||found.includes(id)||g.clues.includes(id)))out.push({text:c.src,img:c.img})
  const name=(m:string)=>caseTeam.find(x=>x.id===m)?.name.split(' ')[0]??'Equipe'
  for(const r of teamMaterialRequests)if(r.clueIds?.includes(id)&&(g.requestedMaterials??[]).includes(r.id))out.push({text:`Material · ${name(r.memberId)} · ${r.label}`,img:c?.kind==='doc'?c.img:r.assetPaths?.[0]})
  for(const t of teamDialogues)if(t.clueIds?.includes(id)&&(g.teamTopics??[]).includes(t.id))out.push({text:`Conversa com ${name(t.memberId)} · ${t.label}`})
  return out
}
export const discoveredOf=(g:CaseSave)=>g.discoveredPeople??DEFAULT_DISCOVERED

/** Estado do quadro guardado no save (fios do jogador, falas postas na linha, o que ele já viu e o relatório em montagem). */
export type BranchSave = {s:(string|null)[];lit?:boolean;a?:number|string[];hyp?:boolean}
export type BoardSave = {stage?:number;links:Record<string,string[]>;placed:string[];seen:string[];roles:Record<string,'exec'|'mentor'|'fora'>;motive?:'heranca'|'roubo';proofs:string[]
  /** árvore de dedução: o que está preso em cada galho e se ele já acendeu */
  tree:Record<string,BranchSave>}
export const boardOf=(g:CaseSave):BoardSave=>({links:{},placed:[],seen:[],roles:{},proofs:[],tree:{},...(g.board as Partial<BoardSave>|undefined)})
