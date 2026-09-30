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

  if(personId==='livia'){
    return <LiviaLivePortrait src={src} expression={expression} speaking={speaking}/>
  }

  return <img className="ii-character ii-character-img" src={src} alt={personId} draggable={false}/>
}

function LiviaLivePortrait({src,expression,speaking}:{src:string;expression:Expression;speaking:boolean}){
  const tired=expression==='tired'
  const nervous=expression==='nervous'
  const defensive=expression==='defensive'
  const uncomfortable=expression==='uncomfortable'
  const shaken=expression==='shaken'

  const leftBrow = nervous ? 'M197 332 Q224 316 250 330' :
    defensive ? 'M196 333 Q224 327 251 332' :
    uncomfortable ? 'M196 332 Q224 321 250 330' :
    shaken ? 'M196 334 Q224 323 250 334' :
    'M197 333 Q224 326 250 332'

  const rightBrow = nervous ? 'M286 329 Q311 315 337 333' :
    defensive ? 'M285 331 Q311 325 337 332' :
    uncomfortable ? 'M285 329 Q311 319 337 333' :
    shaken ? 'M285 333 Q311 323 337 334' :
    'M285 331 Q311 325 337 332'

  return (
    <div className={`ii-live expression-${expression} ${speaking?'is-speaking':''}`}>
      <img className="ii-character ii-character-img" src={src} alt={`Lívia Valença, expressão ${expression}`} draggable={false}/>
      <svg className="ii-face-overlay" viewBox="0 0 540 820" aria-hidden="true">
        <g className="ii-brows">
          <path d={leftBrow}/>
          <path d={rightBrow}/>
        </g>

        <g className={`ii-lids ${tired||shaken?'is-heavy':''}`}>
          <path className="ii-lid ii-left" d="M201 365 Q229 350 258 366 Q230 381 201 365Z"/>
          <path className="ii-lid ii-right" d="M282 365 Q311 350 341 367 Q311 381 282 365Z"/>
        </g>

        {(uncomfortable||nervous||shaken)&&(
          <g className="ii-mouth-expression">
            <ellipse className="ii-mouth-mask" cx="272" cy="446" rx="51" ry="20"/>
            <path d={
              shaken ? 'M239 448 Q272 457 305 447' :
              nervous ? 'M239 447 Q272 451 305 446' :
              'M240 446 Q272 449 304 444'
            }/>
          </g>
        )}

        {speaking&&(
          <g className="ii-speaking-mouth">
            <ellipse className="ii-mouth-mask" cx="272" cy="446" rx="52" ry="21"/>
            <ellipse className="ii-mouth-open" cx="272" cy="448" rx="24" ry="8"/>
            <path className="ii-mouth-lip" d="M245 444 Q272 437 299 444"/>
          </g>
        )}

        {nervous&&<g className="ii-nervous-detail"><circle cx="355" cy="405" r="2.5"/><circle cx="361" cy="416" r="1.8"/></g>}
      </svg>
    </div>
  )
}
