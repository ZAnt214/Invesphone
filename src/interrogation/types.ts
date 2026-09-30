import type { Expression } from '../characters/types'

export type InterrogationQuestion = {
  id:string
  question:string
  answer:string
  /** Expressão do personagem enquanto responde. */
  expression?:Expression
  /** Perguntas liberadas depois desta. */
  unlocks?:string[]
  /** Pistas registradas depois desta resposta. */
  clues?:string[]
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
}

export type InterrogationProgress = {
  asked:string[]
  unlocked:string[]
  currentQuestion:string|null
  completed:boolean
}
