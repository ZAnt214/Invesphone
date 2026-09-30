import type { InterrogationConfig, InterrogationProgress, InterrogationQuestion } from './types'

export const newProgress = (cfg:InterrogationConfig):InterrogationProgress => ({
  asked:[], unlocked:[...cfg.initial], currentQuestion:null, completed:false
})

const byId = (cfg:InterrogationConfig, id:string) => cfg.questions.find(q=>q.id===id)

export function getQuestion(cfg:InterrogationConfig, id:string):InterrogationQuestion|undefined {
  return byId(cfg,id)
}

/** Perguntas liberadas que ainda não foram feitas, na ordem em que estão nos dados. */
export function pendingQuestions(cfg:InterrogationConfig, p:InterrogationProgress){
  return cfg.questions.filter(q=>p.unlocked.includes(q.id) && !p.asked.includes(q.id))
}

/** Perguntas já feitas, na ordem em que o jogador as fez. */
export function askedQuestions(cfg:InterrogationConfig, p:InterrogationProgress){
  return p.asked.map(id=>byId(cfg,id)).filter((q):q is InterrogationQuestion=>!!q)
}

/** Aplica o efeito de uma pergunta respondida: marca como feita, libera novas e devolve as pistas. */
export function applyAnswer(cfg:InterrogationConfig, p:InterrogationProgress, id:string){
  const q = byId(cfg,id)
  if(!q || p.asked.includes(id)) return { progress:{...p,currentQuestion:null}, clues:[] as string[] }
  const asked = [...p.asked, id]
  const unlocked = new Set([...p.unlocked, ...(q.unlocks ?? [])])
  if(cfg.requiredForFinal.every(r=>asked.includes(r))) unlocked.add(cfg.finalQuestion)
  return {
    progress:{ asked, unlocked:[...unlocked], currentQuestion:null, completed: id===cfg.finalQuestion },
    clues:q.clues ?? []
  }
}

/** Duração, em ms, para revelar o texto da resposta. */
export const typingDuration = (text:string, msPerChar=28) => text.length*msPerChar

export const between = (min:number, max:number) => min + Math.random()*(max-min)
