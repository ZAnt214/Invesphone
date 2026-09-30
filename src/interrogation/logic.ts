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

export const between = (min:number, max:number) => min + Math.random()*(max-min)

/**
 * Divide uma resposta em legendas curtas (até ~80 caracteres), quebrando em frases e, se preciso, em vírgulas.
 */
export function subtitleChunks(text:string, max=80):string[]{
  const sentences = text.match(/[^.!?…]+[.!?…]+["”]?\s*|[^.!?…]+$/g)?.map(s=>s.trim()).filter(Boolean) ?? [text]
  const parts:string[] = []
  for(const s of sentences){
    if(s.length<=max){ parts.push(s); continue }
    const bits = s.includes(', ') ? s.split(/,\s+/).map((b,i,a)=>i<a.length-1?b+',':b) : [s]
    let acc = ''
    for(const b of bits){
      if(acc && (acc+' '+b).length>max){ parts.push(acc); acc = b } else acc = acc ? acc+' '+b : b
    }
    if(acc) parts.push(acc)
  }
  // junta frases muito curtas com a seguinte
  const out:string[] = []
  for(const p of parts){
    const prev = out[out.length-1]
    if(prev && prev.length<28 && (prev+' '+p).length<=max) out[out.length-1] = prev+' '+p
    else out.push(p)
  }
  return out
}

/** Tempo de leitura de uma legenda, em ms. */
export const subtitleDuration = (s:string) => Math.max(1500, s.length*55)
