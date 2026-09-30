import { characterAssets } from './characterAssets'

export type Expression = 'neutral'|'tired'|'uncomfortable'|'defensive'|'nervous'|'shaken'

type Props = {
  personId:string
  expression:Expression
  speaking?:boolean
}

export default function CharacterPortrait({personId,expression,speaking=false}:Props){
  const assets=characterAssets[personId]
  if(!assets)return <div className="ii-portrait-fallback">Retrato indisponível</div>
  const src=assets[expression]??assets.default
  return (
    <img
      className={`ii-character ii-character-img expression-${expression} ${speaking?'is-speaking':''}`}
      src={src}
      alt={`${personId}, expressão ${expression}`}
      draggable={false}
    />
  )
}
