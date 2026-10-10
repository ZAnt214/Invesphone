/**
 * O que baixar e em que ordem, a partir do save do Caso 01.
 *
 * Essencial (antes de entrar na base): a entrada e a parede do quadro, os rostos de quem o jogador já conhece e
 * o retrato completo de quem senta primeiro na sala de depoimentos (as expressões, as bocas e as máscaras).
 * Fundo (enquanto joga): os outros que esperam para depor, o retrato de quem já é conhecido, os materiais da equipe (os pedidos primeiro),
 * as fotos originais das pistas e, por último, o resto do elenco.
 * Baixar não revela nada: a interface continua mostrando só quem foi descoberto.
 */
import { getCharacter } from '../characters/characters'
import { depoPeople } from '../case/depositions'
import type { CaseSave } from '../case/caseSave'
import { DEFAULT_DISCOVERED, teamMaterialRequests } from '../team/teamData'
import { BOARD_PEOPLE, CARDS, LEMOS_BACK, WALL_IMGS, portrait, thumb } from '../board/boardData'

const FONTS=['/fonts/permanent-marker-latin.woff2','/fonts/special-elite-latin.woff2','/fonts/caveat-latin.woff2']
const CAST=['livia','caio','rafael','cida','jorge','teo']

/** tudo o que o depoimento de alguém usa */
export function characterAssets(id:string):string[]{
  const c=getCharacter(id);if(!c)return []
  return [...Object.values(c.assets).map(a=>a?.src),c.faceMask,c.figureMask,c.visemes?.src].filter((x):x is string=>!!x)
}
/** entrada de cinema e parede do quadro */
export function boardArt():string[]{return [...(LEMOS_BACK?[LEMOS_BACK]:[]),...WALL_IMGS,...FONTS]}

const discoveredOf=(g:CaseSave)=>g.discoveredPeople??DEFAULT_DISCOVERED
const waitingOf=(g:CaseSave)=>depoPeople(g).filter(p=>p.state==='ouvir'||p.state==='retomar').map(p=>p.id)

export function essentialAssets(g:CaseSave):string[]{
  const known=discoveredOf(g).filter(p=>BOARD_PEOPLE.includes(p))
  // só quem senta primeiro na sala de depoimentos; os outros que esperam vão na frente da fila de fundo
  return [...new Set([...boardArt(),'/sonia.jpg',...known.map(p=>thumb(portrait(p))),...waitingOf(g).slice(0,1).flatMap(characterAssets)])]
}

export function backgroundAssets(g:CaseSave):string[]{
  const known=discoveredOf(g),asked=new Set(g.requestedMaterials??[])
  const mats=[...teamMaterialRequests].sort((a,b)=>Number(asked.has(b.id))-Number(asked.has(a.id))).flatMap(r=>[...(r.assetPaths??[])])
  const cards=Object.values(CARDS).map(c=>c.img).filter((x):x is string=>!!x)
  return [...new Set([
    ...waitingOf(g).flatMap(characterAssets),
    ...known.filter(p=>CAST.includes(p)).flatMap(characterAssets),
    ...cards.map(thumb),
    ...mats,
    ...cards,
    ...BOARD_PEOPLE.map(p=>thumb(portrait(p))),
    ...CAST.filter(p=>!known.includes(p)).flatMap(characterAssets)
  ])]
}
