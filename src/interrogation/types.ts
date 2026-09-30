export type VideoFileId = 'neutral' | 'reaction'

/** Trecho de um dos arquivos, em segundos. Nada é cortado fisicamente. */
export type VideoSegment = { start:number; end:number }

export type VideoState =
  /** Sorteia um trecho a cada ciclo e emenda com crossfade curto. Usado para ficar parado. */
  | { file:VideoFileId; kind:'random'; segments:VideoSegment[] }
  /** Toca os trechos em ordem. Com repeatLast, o último trecho se repete até mandarem parar. */
  | { file:VideoFileId; kind:'sequence'; sequence:VideoSegment[]; repeatLast:boolean }

export type InterrogationQuestion = {
  id:string
  question:string
  answer:string
  /** Estado visual que representa a personagem enquanto responde. */
  videoState:string
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
