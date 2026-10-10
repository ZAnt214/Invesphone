/* Relatório de acusação do Caso 01: a mesma regra de final para o relatório do aparelho e o do quadro da base. */
import { acceptedProofs, clues } from '../case01'
import type { CaseSave } from './caseSave'

export type Ending = 'A'|'B'|'C'
export type Report = {executors:string[];mentor:string;motive:string;proofs:string[]}

/** A: executores, mentora, motivo e 3 provas aceitas. B: só os executores. C: executores errados. */
export function reportEnding(r:Report):Ending{
  const execOK=r.executors.includes('caio')&&r.executors.includes('teo')&&r.executors.length===2
  const mentorOK=r.mentor==='livia'
  const motiveOK=r.motive==='heranca'
  const proofOK=r.proofs.filter(x=>acceptedProofs.includes(x)).length>=3
  return execOK&&mentorOK&&motiveOK&&proofOK?'A':execOK?'B':'C'
}

/** Protocola o relatório no save: o aparelho abre direto no resultado. */
export function fileReport<G extends CaseSave&{score?:number}>(g:G,r:Report):G{
  const ending=reportEnding(r)
  const support=g.clues.filter(id=>clues.some(c=>c.id===id&&c.support)).length
  return {...g,ending,screen:'ending',score:(g.score??0)+(ending==='A'?100*support:0)}
}
