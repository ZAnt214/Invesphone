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
  brigas_namoro:{zone:'motivo',kind:'nt',x:130,y:110,r:1.5},
  ameaca_heranca:{zone:'motivo',kind:'nt',x:130,y:170,r:-1.5},
  pergunta_inventario:{zone:'motivo',kind:'nt',x:296,y:110,r:-1},
  livia_sabia_heranca:{zone:'motivo',kind:'nt',x:296,y:170,r:1.2},
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
export type BoardSave = {links:Record<string,string[]>;placed:string[];seen:string[];roles:Record<string,'exec'|'mentor'|'fora'>;motive?:'heranca'|'roubo';proofs:string[]}
export const boardOf=(g:CaseSave):BoardSave=>({links:{},placed:[],seen:[],roles:{},proofs:[],...(g.board as Partial<BoardSave>|undefined)})
