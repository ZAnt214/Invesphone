import type { Expression } from './types'

/**
 * Parâmetros de uma expressão aplicados ao retrato neutro.
 * Valores em pixels do arquivo; ângulos em graus.
 */
export type ExpressionParams = {
  /** deslocamento vertical das sobrancelhas (negativo sobe) */
  browDy:number
  /** inclinação: positivo levanta as pontas internas (olhar preocupado), negativo as abaixa (fechado) */
  browTilt:number
  /** pálpebra superior já caída, de 0 (aberto) a 1 (fechado) */
  lid:number
  gazeX:number
  gazeY:number
  /** corpo um pouco mais baixo (cansaço) ou recuado (defesa) */
  slump:number
  /** boca em repouso, de 0 a 1 */
  mouthRest:number
  /** frequência de piscadas */
  blinkRate:number
  /** tremor do corpo */
  tremor:number
  /** amplitude do olhar correndo de um lado ao outro */
  dart:number
}

const base:ExpressionParams = { browDy:0, browTilt:0, lid:0, gazeX:0, gazeY:0, slump:0, mouthRest:0, blinkRate:1, tremor:0, dart:0 }
const mk = (p:Partial<ExpressionParams>):ExpressionParams => ({...base,...p})

export const EXPRESSIONS:Record<Expression,ExpressionParams> = {
  neutral:       mk({}),
  tired:         mk({ browDy:2, browTilt:-1.5, lid:.2, gazeY:3, slump:4, blinkRate:.6 }),
  uncomfortable: mk({ browDy:-1.5, browTilt:5, gazeX:-5, gazeY:3, slump:2, mouthRest:.05, blinkRate:1.3, dart:2 }),
  defensive:     mk({ browDy:3, browTilt:-4, lid:.14, gazeY:-1, slump:-3, blinkRate:.8 }),
  nervous:       mk({ browDy:-3, browTilt:4, dart:6, mouthRest:.07, blinkRate:2, tremor:.6 }),
  shaken:        mk({ browDy:-2, browTilt:8, lid:.08, gazeX:-2, gazeY:5, slump:4, mouthRest:.1, blinkRate:1.6, tremor:1 }),
  angry:         mk({ browDy:4, browTilt:-8, lid:.16, slump:-3, blinkRate:.7 }),
  sad:           mk({ browDy:1, browTilt:8, lid:.2, gazeY:4, slump:5, blinkRate:1.1 }),
  confident:     mk({ browDy:-1, lid:.05, gazeY:-1, slump:-3, blinkRate:.7 }),
  scared:        mk({ browDy:-4, browTilt:6, dart:5, mouthRest:.12, blinkRate:1.8, tremor:.8 }),
}

export type NumericKey = keyof ExpressionParams
export const PARAM_KEYS = Object.keys(base) as NumericKey[]
