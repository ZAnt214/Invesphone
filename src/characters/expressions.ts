import type { Expression } from './types'

/**
 * O rosto de cada expressão vem da imagem oficial. Estes parâmetros só ajustam o que a imagem
 * não dá sozinha: o movimento do corpo e o ritmo de piscar.
 */
export type ExpressionParams = {
  /** corpo um pouco mais baixo (cansaço) ou recuado (defesa), em pixels do arquivo */
  slump:number
  /** frequência de piscadas */
  blinkRate:number
  /** tremor do corpo */
  tremor:number
  /** boca em repouso, de 0 a 1 */
  mouthRest:number
}

const base:ExpressionParams = { slump:0, blinkRate:1, tremor:0, mouthRest:0 }
const mk = (p:Partial<ExpressionParams>):ExpressionParams => ({...base,...p})

export const EXPRESSIONS:Record<Expression,ExpressionParams> = {
  neutral:       mk({}),
  tired:         mk({ slump:2, blinkRate:.6 }),
  uncomfortable: mk({ slump:1, blinkRate:1.3 }),
  defensive:     mk({ slump:-1.5, blinkRate:.8 }),
  nervous:       mk({ blinkRate:2, tremor:.5 }),
  shaken:        mk({ slump:2, blinkRate:1.6, tremor:.8 }),
  angry:         mk({ slump:-1.5, blinkRate:.7 }),
  sad:           mk({ slump:2.5, blinkRate:1.1 }),
  confident:     mk({ slump:-1.5, blinkRate:.7 }),
  scared:        mk({ blinkRate:1.8, tremor:.7 }),
}
