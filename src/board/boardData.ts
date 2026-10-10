/* Quadro do Caso 01: onde cada pista fica na cortiça e o que se sabe dela.
   Quem disse cada frase e quais pistas sustentam confronto vêm dos próprios depoimentos e da equipe,
   para o quadro nunca contar uma história diferente do resto do jogo. */
import { clues as caseClues, people as casePeople } from '../case01'
import { interrogations } from '../interrogation/registry'
import { caseTeam, teamDialogues, teamMaterialRequests, DEFAULT_DISCOVERED } from '../team/teamData'
import { progressOf } from '../case/depositions'
import type { CaseSave } from '../case/caseSave'

export type ZoneId = 'cena'|'pessoas'|'noite'|'acesso'|'motivo'|'dinheiro'
/** Cada área é uma pergunta do caso. As áreas ficam numa parede de 3×2 (cada uma com 562×390). */
export const ZONES:Record<ZoneId,{x:number;y:number;label:string;tab:string;q:string}> = {
  cena:{x:0,y:0,tab:'Cena',label:'A cena',q:'Foi um roubo?'},
  pessoas:{x:563,y:0,tab:'Pessoas',label:'Pessoas',q:'Quem estava onde?'},
  noite:{x:1126,y:0,tab:'Noite',label:'A noite · 16 → 17/10',q:'O que houve entre 23:52 e 00:56?'},
  acesso:{x:0,y:390,tab:'Acesso',label:'Acesso',q:'Quem podia entrar sem forçar?'},
  motivo:{x:563,y:390,tab:'Motivo',label:'Motivo',q:'Por quê?'},
  dinheiro:{x:1126,y:390,tab:'Dinheiro',label:'Dinheiro',q:'De onde vem o dinheiro?'},
}
export const ZONE_W=562, ZONE_H=390, WORLD_W=1688, WORLD_H=780

/** Partes da cortiça em cada capítulo (área de 562×390). */
export type Section =
  |{kind:'scene'}                                                  // croqui com as fotos da varredura
  |{kind:'people';notes:Record<string,string[]>}                    // fotos das pessoas conhecidas, com as falas de cada uma embaixo
  |{kind:'night'}                                                  // linha da noite (22:00 → 01:15)
  |{kind:'grid';title:string;x:number;y:number;w:number;cols:number;ids:string[]}
const ACCESS=['livia_chave','livia_codigo','inconsistencia_caio_codigo','caio_viu_digitando','livia_porta_aberta','livia_passou_codigo','rafael_nao_prendeu']
/** Etapas do quadro = capítulos do caso (src/case01.ts). O quadro abre na etapa atual e mostra só o que é dela,
    arrumado para responder a pergunta do capítulo; as anteriores ficam para rever, as seguintes não aparecem. */
export const CHAPTERS:{short:string;q:string;sections:Section[]}[] = [
  {short:'A casa',q:'Foi um roubo?',sections:[{kind:'scene'}]},
  {short:'Versões',q:'Quem estava onde, e quem podia entrar sem forçar?',sections:[
    {kind:'people',notes:{livia:['brigas_namoro','pergunta_inventario'],caio:['caio_horario','caio_gol_dele'],rafael:['lan_paga','rafael_lan_confirmada'],cida:['alibi_cida','cida_alibi_termo'],jorge:['vigia_gol','vigia_horario']}},
    {kind:'grid',title:'Quem podia entrar sem forçar?',x:6,y:246,w:550,cols:4,ids:ACCESS}]},
  {short:'A janela',q:'O que houve entre 23:52 e 00:56, e por quê?',sections:[
    {kind:'night'},
    {kind:'grid',title:'Por quê?',x:300,y:240,w:256,cols:2,ids:['agenda_helena','ameaca_heranca','brigas_namoro','pergunta_inventario']}]},
  {short:'O dinheiro',q:'De onde vem o dinheiro, e quem ganhava com as mortes?',sections:[
    {kind:'grid',title:'O dinheiro',x:6,y:22,w:550,cols:5,ids:['extrato_ricardo','carta_cobranca','moto_dolares','cinta_bancaria','teo_adiantamento']},
    {kind:'grid',title:'Por quê?',x:6,y:262,w:550,cols:4,ids:['ameaca_heranca','livia_sabia_heranca','pergunta_inventario','agenda_helena']}]},
  {short:'A última versão',q:'Quem fez o quê?',sections:[
    {kind:'people',notes:{livia:['livia_passou_codigo','livia_porta_aberta'],caio:['caio_saiu_22h30','caio_sem_intervalo'],rafael:['rafael_nao_prendeu','rafael_lan_confirmada'],cida:['cida_alibi_termo'],jorge:['jorge_so_o_carro'],teo:['confissao_teo','teo_adiantamento']}},
    {kind:'grid',title:'Provas principais',x:6,y:262,w:550,cols:6,ids:['valores_intactos','log_alarme','nota_motel','cinta_bancaria','confissao_teo','agenda_helena']}]},
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
export const portrait=(id:string)=>id==='ricardo'||id==='helena'?`/characters/${id}/portrait.jpg`:`/characters/${id}/expressions/neutral.jpg`
export const personOf=(id:string)=>casePeople.find(p=>p.id===id)
export const clueOf=(id:string)=>caseClues.find(c=>c.id===id)
export const titleOf=(id:string)=>SHORT[id]??clueOf(id)?.title??id

/** Frases marcadas nos depoimentos: pista → [quem, pergunta, frase]. */
export const SAID:Record<string,{person:string;question:string;phrase:string}[]> = {}
/** Pistas que sustentam um confronto previsto no depoimento de cada pessoa (direto ou pelo material que a pista libera). */
export const CONFRONT:Record<string,string[]> = {}
for(const [pid,cfg] of Object.entries(interrogations)){
  const set=new Set<string>()
  for(const q of cfg.questions){
    for(const h of q.highlights??[])(SAID[h.clue]??=[]).push({person:pid,question:q.id,phrase:h.phrase})
    if(q.requiresClue)set.add(q.requiresClue)
    if(q.requiresMaterial)teamMaterialRequests.find(r=>r.id===q.requiresMaterial)?.requiresClues?.forEach(c=>set.add(c))
  }
  CONFRONT[pid]=[...set]
}

/** O que o jogador tem agora: pistas do save mais as fotos que a varredura da casa trouxe. */
export function cluesOf(g:CaseSave,found:string[]){return [...new Set([...g.clues,...found.filter(id=>CARDS[id])])].filter(id=>CARDS[id])}

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
export type BoardSave = {stage?:number;links:Record<string,string[]>;placed:string[];seen:string[];roles:Record<string,'exec'|'mentor'|'fora'>;motive?:'heranca'|'roubo';proofs:string[]}
export const boardOf=(g:CaseSave):BoardSave=>({links:{},placed:[],seen:[],roles:{},proofs:[],...(g.board as Partial<BoardSave>|undefined)})
