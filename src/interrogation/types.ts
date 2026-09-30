export type VideoFileId = 'neutral' | 'reaction'

/**
 * Estado visual = um "passeio" pelo tempo de um dos arquivos.
 * O vídeo toca de forma contínua e, de tempos em tempos, salta para outro momento com pose quase igual.
 * Como o salto vai para lugares diferentes a cada vez, o jogador não vê um loop.
 */
export type VideoState = {
  file:VideoFileId
  /** Intervalo do arquivo (s) que este estado pode usar. */
  range:[number, number]
  /** Duração de cada trecho contínuo antes de saltar (s). */
  run:[number, number]
  /** Onde pode começar ao entrar no estado (s). Padrão: o intervalo todo. */
  startRange?:[number, number]
}

export type InterrogationQuestion = {
  id:string
  question:string
  answer:string
  /** Estado visual usado pela versão em vídeo, quando existir. */
  videoState:string
  /** Expressão usada pela versão ilustrada do interrogatório. */
  expression?:'neutral'|'tired'|'uncomfortable'|'defensive'|'nervous'|'shaken'
  /** Perguntas liberadas depois desta. */
  unlocks?:string[]
  /** Pistas registradas depois desta resposta. */
  clues?:string[]
}

export type InterrogationConfig = {
  id:string
  personId:string
  name:string
  depositionLabel:string
  /** Só estes arquivos existem. Os estados abaixo apontam para eles. */
  files:Record<VideoFileId,string>
  states:Record<string,VideoState>
  idleState:string
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
