/* Save único do Caso 01, lido e escrito pelas cenas (base do DHPP e casa da Rua das Acácias).
   Ao carregar, os campos que faltarem vêm do começo do caso (merge com o jogo inicial). */
import { DEFAULT_DISCOVERED, type TeamGame } from '../team/teamData'

export const SAVE_KEY = 'invesphone-case01-v2'
export const SAVE_VERSION = 3

export type CaseSave = TeamGame & {version:number;summonedPeople?:string[];[k:string]:unknown}

/** Começo do caso quando ainda não há save: o plantão de madrugada na base do DHPP. */
const seed = ():CaseSave => ({version:SAVE_VERSION,screen:'incoming',app:'home',task:1,clues:[],interviewed:[],orders:[],discoveredPeople:[...DEFAULT_DISCOVERED],summonedPeople:['livia','caio'],score:1000})

/** Recomeçar o caso: apaga o save e tudo o que depende dele, para o jogo voltar ao plantão de madrugada:
    caderneta do Lemos, o que o HUD já anunciou, o fim da varredura da casa (sem ele a base volta a ser de madrugada),
    o que Lemos já examinou na base e, na sessão, os lugares já anunciados e a reabertura de depoimento/quadro.
    Os ajustes (gráficos, som, efeitos) e os tutoriais já vistos ficam. */
export const CASE_STORAGE = [SAVE_KEY,'invesphone.caderneta','invesphone.hud.seen','varredura.fim','base.seen']
export function resetCaseStorage(){
  for(const k of CASE_STORAGE){try{localStorage.removeItem(k)}catch{/* sem armazenamento */}}
  for(const k of ['invesphone.hud.lugares','base.reopen']){try{sessionStorage.removeItem(k)}catch{/* sem armazenamento */}}
}

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
  // Lívia e Caio são centrais; basta uma terceira versão para verificar o contexto.
  // Rafael e Cida ajudam, mas ouvir os dois não é pedágio para avançar.
  if(next===2&&g.interviewed.includes('livia')&&g.interviewed.includes('caio')&&heardInitial>=3)next=3
  if(next===3&&g.clues.includes('log_alarme'))next=4
  if(next===4&&g.clues.includes('nota_motel'))next=5
  // A carta de cobrança é pista falsa opcional, não requisito para abrir o dinheiro.
  if(next===5&&g.clues.includes('ameaca_heranca')&&g.clues.includes('extrato_ricardo'))next=6
  if(next===6&&g.clues.includes('cinta_bancaria')&&(g.discoveredPeople??[]).includes('teo'))next=7
  if(next===7&&g.clues.includes('confissao_teo'))next=8
  return next===g.task?g:{...g,task:next}
}
