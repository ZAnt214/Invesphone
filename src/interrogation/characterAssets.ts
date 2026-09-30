import type { Expression } from './CharacterPortrait'

const base = import.meta.env.BASE_URL

export const characterAssets:Record<string,Partial<Record<Expression,string>> & {default:string}> = {
  livia:{
    default:`${base}characters/livia/livia-official.jpg`,
    neutral:`${base}characters/livia/livia-official.jpg`,
    tired:`${base}characters/livia/livia-official.jpg`,
    uncomfortable:`${base}characters/livia/livia-official.jpg`,
    defensive:`${base}characters/livia/livia-official.jpg`,
    nervous:`${base}characters/livia/livia-official.jpg`,
    shaken:`${base}characters/livia/livia-official.jpg`
  }
}
