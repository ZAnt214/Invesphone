/* Depoimentos do Caso 01 sobre o save único: quem pode ser chamado, progresso de cada um e o que falta perguntar.
   Usado pela sala de depoimentos da base do DHPP; o app Interrogar do Invesphone segue as mesmas regras. */
import { people } from '../case01'
import { interrogations } from '../interrogation/registry'
import { newProgress, pendingQuestions } from '../interrogation/logic'
import type { InterrogationProgress } from '../interrogation/types'
import { DEFAULT_DISCOVERED } from '../team/teamData'
import type { CaseSave } from './caseSave'

/** Pessoas que só podem ser chamadas depois de o jogador ter as provas para confrontá-las. */
export const summonRequires:Record<string,string[]>={teo:['log_alarme','cinta_bancaria']}
export const DEFAULT_SUMMONED=['livia','caio']

type DepoSave = CaseSave & {liviaInterrogation?:InterrogationProgress;depositions?:Record<string,InterrogationProgress>}

export function progressOf(g:CaseSave,id:string):InterrogationProgress{
  const d=g as DepoSave,cfg=interrogations[id]
  return (id==='livia'?d.liviaInterrogation:d.depositions?.[id])??newProgress(cfg)
}
export function withProgress(g:CaseSave,id:string,p:InterrogationProgress):CaseSave{
  const d=g as DepoSave
  return id==='livia'?{...d,liviaInterrogation:p}:{...d,depositions:{...d.depositions,[id]:p}}
}

export type DepoState = 'chamar'|'sem_provas'|'ouvir'|'retomar'|'registrado'
export type DepoPerson = {id:string;name:string;first:string;role:string;state:DepoState;pending:number}

/** Quem a investigação já conhece e tem depoimento possível, com o que dá para fazer agora. */
export function depoPeople(g:CaseSave):DepoPerson[]{
  const discovered=g.discoveredPeople??DEFAULT_DISCOVERED
  const summoned=g.summonedPeople??DEFAULT_SUMMONED
  return people.filter(p=>p.id!=='sonia'&&discovered.includes(p.id)&&interrogations[p.id]).map(p=>{
    const cfg=interrogations[p.id],done=g.interviewed.includes(p.id)
    const pending=pendingQuestions(cfg,progressOf(g,p.id),g.clues,g.requestedMaterials??[]).length
    let state:DepoState
    if(!summoned.includes(p.id))state=(summonRequires[p.id]??[]).some(c=>!g.clues.includes(c))?'sem_provas':'chamar'
    else if(!done)state='ouvir'
    else state=pending>0?'retomar':'registrado'
    return {id:p.id,name:p.name,first:p.name.split(' ')[0],role:p.role,state,pending}
  })
}
export function summon(g:CaseSave,id:string):CaseSave{
  const s=g.summonedPeople??DEFAULT_SUMMONED
  if(s.includes(id)||(summonRequires[id]??[]).some(c=>!g.clues.includes(c)))return g
  return {...g,summonedPeople:[...s,id]}
}
