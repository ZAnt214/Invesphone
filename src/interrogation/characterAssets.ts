import type { Expression } from './CharacterPortrait'

const base = import.meta.env.BASE_URL

export const characterAssets:Record<string,Partial<Record<Expression,string>> & {default:string}> = {
  livia:{
    default:`${base}characters/livia/livia-official-exact.jpg`,
    neutral:`${base}characters/livia/livia-official-exact.jpg`,
    tired:`${base}characters/livia/livia-official-exact.jpg`,
    uncomfortable:`${base}characters/livia/livia-official-exact.jpg`,
    defensive:`${base}characters/livia/livia-official-exact.jpg`,
    nervous:`${base}characters/livia/livia-official-exact.jpg`,
    shaken:`${base}characters/livia/livia-official-exact.jpg`
  }
}
