/* Ponte para as cenas em JS (base e varredura): o que baixar antes de entrar e o que fica para o fundo. */
import { readCase } from '../case/caseSave'
import { bumpAssets, fetchAssets, queueAssets } from './loader'
import { backgroundAssets, characterAssets, essentialAssets } from './caseAssets'

/** o essencial do momento do caso, com progresso (feitos, total) */
export function prepare(onProgress?:(done:number,total:number)=>void){return fetchAssets(essentialAssets(readCase()),onProgress)}
/** o resto do caso, aos poucos, enquanto o jogador joga */
export function background(){const g=readCase();queueAssets([...essentialAssets(g),...backgroundAssets(g)])}
/** quem acabou de ser chamado passa na frente */
export function prioritize(ids:string[]){bumpAssets(ids.flatMap(characterAssets))}
