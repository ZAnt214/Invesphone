/* Save único do Caso 01, lido e escrito pelo Invesphone e pelas cenas (base do DHPP).
   O Invesphone completa os campos que faltarem ao carregar (merge com o jogo inicial). */
import { DEFAULT_DISCOVERED, type TeamGame } from '../team/teamData'

export const SAVE_KEY = 'invesphone-case01-v2'
export const SAVE_VERSION = 3

export type CaseSave = TeamGame & {version:number;summonedPeople?:string[];[k:string]:unknown}

/** Começo do caso quando ainda não há save: a ligação da Sônia continua sendo a porta de entrada do aparelho. */
const seed = ():CaseSave => ({version:SAVE_VERSION,screen:'incoming',app:'home',task:1,clues:[],interviewed:[],orders:[],discoveredPeople:[...DEFAULT_DISCOVERED],summonedPeople:['livia','caio'],score:1000})

export function readCase():CaseSave{
  try{
    const raw=localStorage.getItem(SAVE_KEY)
    if(!raw)return seed()
    const g=JSON.parse(raw) as CaseSave
    return g&&g.version===SAVE_VERSION?{...seed(),...g}:seed()
  }catch{return seed()}
}

export function writeCase(update:(g:CaseSave)=>CaseSave):CaseSave{
  const next=advanceTask(update(readCase()))
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(next))}catch{/* sem armazenamento: o jogo segue, só não guarda */}
  return next
}

/** A investigação avança quando os fatos chegam, não porque o jogador "concluiu uma tarefa". */
export function advanceTask<G extends TeamGame>(g:G):G{
  let next=g.task
  const heardInitial=g.interviewed.filter(id=>['livia','rafael','cida','jorge','caio'].includes(id)).length
  if(next===1&&['porta_intacta','painel_alarme','cao_canil','valores_intactos'].every(id=>g.clues.includes(id)))next=2
  if(next===2&&heardInitial>=4)next=3
  if(next===3&&g.clues.includes('log_alarme'))next=4
  if(next===4&&g.clues.includes('nota_motel'))next=5
  if(next===5&&g.clues.includes('extrato_ricardo')&&g.clues.includes('carta_cobranca'))next=6
  if(next===6&&g.clues.includes('cinta_bancaria')&&(g.discoveredPeople??[]).includes('teo'))next=7
  if(next===7&&g.clues.includes('confissao_teo'))next=8
  return next===g.task?g:{...g,task:next}
}
