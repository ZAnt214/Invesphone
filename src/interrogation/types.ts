import type { Expression } from '../characters/types'

export type InterrogationQuestion = {
  id:string
  question:string
  answer:string
  /** Expressão do personagem enquanto responde. */
  expression?:Expression
  /**
   * Confrontação: só aparece depois que o jogador registrou esta pista (em qualquer depoimento ou cena),
   * além de ter sido liberada por outra pergunta.
   */
  requiresClue?:string
  /** Perguntas liberadas depois desta. */
  unlocks?:string[]
  /** Pessoas citadas/identificadas por esta resposta e que passam a integrar a investigação. */
  revealsPeople?:string[]
  /** Pistas registradas automaticamente depois desta resposta (só para perguntas sem `highlights`). */
  clues?:string[]
  /**
   * Trechos da resposta que o jogador pode anotar como pista tocando na frase. `phrase` precisa aparecer na
   * resposta; a frase que a contém vale a pista. Frases sem trecho são anotações sem valor para o caso.
   */
  highlights?:{ phrase:string; clue:string }[]
  /** Quanto esta pergunta aumenta a pressão sobre ela (negativo alivia). Padrão: vem da intensidade da expressão. */
  pressure?:number
}

export type InterrogationConfig = {
  id:string
  /** Id do personagem em src/characters/characters.ts (e em people). */
  personId:string
  name:string
  depositionLabel:string
  /** Expressão quando está só ouvindo ou esperando. */
  idleExpression?:Expression
  questions:InterrogationQuestion[]
  initial:string[]
  /** Quando todas estas foram feitas, a pergunta final é liberada. */
  requiredForFinal:string[]
  finalQuestion:string
  closingLabel:string
  /** Mensagem do detetive ao encerrar: agradece e libera o depoente. Há um texto padrão. */
  farewell?:string
  /** Estágios de pressão: ao passar de `at`, ela espera o jogador com esta expressão. Há um padrão. */
  pressureStages?:PressureStage[]
}

export type PressureStage = { at:number; expression:Expression; label:string }

export type InterrogationProgress = {
  asked:string[]
  unlocked:string[]
  currentQuestion:string|null
  completed:boolean
  /** Frases já anotadas pelo jogador (`<pergunta>:<índice da frase>`). */
  noted?:string[]
  /** Pressão acumulada de 0 a 100 (saves antigos não têm: começa em 0). */
  pressure?:number
  /** Assinatura do jogador na ficha do depoimento (PNG em data URL) e quando foi feita. */
  signature?:string
  signedAt?:string
}
