import type { Expression } from '../characters/types'

/**
 * O que a personagem sente, de 0 a 100, em cada expressão. É o que o medidor de emoções mostra:
 * o jogador lê o estado dela sem precisar adivinhar só pelo rosto.
 */
export type Emotion = 'tension'|'defense'|'distress'
export type EmotionVector = Record<Emotion,number>

export const EMOTIONS:{ id:Emotion; label:string }[] = [
  { id:'tension', label:'Tensão' },
  { id:'defense', label:'Defensiva' },
  { id:'distress', label:'Abalo' }
]

const v = (tension:number, defense:number, distress:number):EmotionVector => ({ tension, defense, distress })

export const EXPRESSION_EMOTION:Record<Expression,EmotionVector> = {
  neutral:        v(10,10,5),
  slightly_tired: v(15,10,15),
  tired:          v(20,10,28),
  apprehensive:   v(55,25,25),
  uncomfortable:  v(45,40,20),
  defensive:      v(50,85,15),
  nervous:        v(85,45,35),
  lying:          v(62,70,22),
  shaken:         v(60,20,88),
  teary:          v(48,15,95),
  false_relief:   v(28,38,20),
  angry:          v(75,80,20),
  sad:            v(25,10,80),
  confident:      v(10,30,5),
  scared:         v(90,25,60)
}

export const emotionOf = (e:Expression):EmotionVector => EXPRESSION_EMOTION[e] ?? EXPRESSION_EMOTION.neutral

/** Intensidade geral do que ela sente (a emoção mais forte), de 0 a 100. */
export const emotionLevel = (x:EmotionVector) => Math.max(x.tension,x.defense,x.distress)

/** Rótulo do estado dominante. */
export function emotionLabel(x:EmotionVector):string{
  const top = EMOTIONS.reduce((a,b)=>x[b.id]>x[a.id]?b:a)
  if(x[top.id]<30) return 'CONTROLADA'
  return ({ tension:'NERVOSA', defense:'DEFENSIVA', distress:'ABALADA' } as Record<Emotion,string>)[top.id]
}
