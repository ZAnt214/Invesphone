export type Expression = 'neutral'|'tired'|'uncomfortable'|'defensive'|'nervous'|'shaken'

type Props = {
  personId:string
  expression:Expression
  speaking?:boolean
}

export default function CharacterPortrait({personId,expression,speaking=false}:Props){
  if(personId==='livia') return <LiviaPortrait expression={expression} speaking={speaking}/>
  return <div className="ii-portrait-fallback">Retrato indisponível</div>
}

function LiviaPortrait({expression,speaking}:{expression:Expression;speaking:boolean}){
  const nervous = expression==='nervous'
  const tired = expression==='tired'||expression==='shaken'
  const defensive = expression==='defensive'
  const uncomfortable = expression==='uncomfortable'
  const shaken = expression==='shaken'

  const eyeY = tired ? 190 : nervous ? 186 : 188
  const pupilX = defensive ? 2 : nervous ? -3 : uncomfortable ? -2 : 0
  const browTilt = nervous ? -5 : defensive ? 5 : uncomfortable ? -3 : tired ? 2 : 0
  const mouthY = shaken ? 245 : uncomfortable ? 241 : 239
  const mouthCurve = defensive ? 0 : shaken ? 5 : uncomfortable ? 3 : nervous ? 2 : 1

  return (
    <svg className={`ii-character expression-${expression} ${speaking?'is-speaking':''}`} viewBox="0 0 390 440" role="img" aria-label={`Lívia Valença, expressão ${expression}`}>
      <defs>
        <linearGradient id="ii-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#363938"/><stop offset="1" stopColor="#242726"/></linearGradient>
        <linearGradient id="ii-shirt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#59615f"/><stop offset="1" stopColor="#343a39"/></linearGradient>
        <linearGradient id="ii-hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6d5038"/><stop offset=".55" stopColor="#8a6848"/><stop offset="1" stopColor="#473525"/></linearGradient>
        <filter id="ii-soft"><feGaussianBlur stdDeviation=".45"/></filter>
      </defs>

      <rect width="390" height="440" fill="url(#ii-wall)"/>
      <rect y="328" width="390" height="112" fill="#171a19"/>
      <rect x="0" y="326" width="390" height="4" fill="#515654" opacity=".5"/>
      <rect x="24" y="42" width="94" height="72" rx="3" fill="#1c201f" stroke="#505553" opacity=".72"/>
      <path d="M34 96L54 76 68 83 83 60 106 87" fill="none" stroke="#68706d" strokeWidth="2" opacity=".55"/>
      <rect x="294" y="58" width="62" height="43" rx="2" fill="#282c2b" stroke="#535957" opacity=".65"/>
      <path d="M302 89h42M302 79h33M302 69h26" stroke="#707774" strokeWidth="1" opacity=".5"/>
      <ellipse cx="319" cy="342" rx="72" ry="13" fill="#0c0e0e" opacity=".55"/>

      <g className="ii-body">
        <path d="M92 440c7-76 25-129 69-151 21-11 69-12 94 1 42 23 58 78 66 150z" fill="url(#ii-shirt)"/>
        <path d="M146 302c18 20 79 23 101-1l-7 42c-15 14-65 15-85 1z" fill="#d3a37e"/>
        <path d="M160 294c5 13 13 23 36 24 24 1 36-8 42-25l-4-49h-71z" fill="#d9a985"/>

        <path d="M124 163c5-55 37-94 86-91 50 3 77 42 73 102-2 32-14 72-40 96-16 15-39 24-60 17-37-12-61-59-59-124z" fill="#d8a782"/>
        <path d="M127 169c-15-42 3-91 45-112 35-17 85-9 106 29 15 28 11 65 2 86-5-31-19-49-42-58-34-13-65 0-88 25-8 9-14 19-23 30z" fill="url(#ii-hair)"/>
        <path d="M143 118c19-32 64-51 98-31 24 14 39 42 35 72-13-27-32-42-61-45-25-3-45 5-72 25z" fill="#78593f"/>
        <path d="M133 169c-7 37 3 76 26 101-19-5-34-19-40-39-7-25-3-50 14-62z" fill="#60452f"/>
        <path d="M269 160c12 31 10 79-10 108 17-5 29-21 33-42 4-24-4-49-23-66z" fill="#5d432f"/>
        <path d="M153 105c-8 17-10 36-9 58 7-23 25-42 49-50-16-1-26-4-40-8z" fill="#987454" opacity=".75"/>

        <g className="ii-face">
          <path d={`M159 ${176+browTilt}q17-10 34 1`} fill="none" stroke="#694b3a" strokeWidth="4" strokeLinecap="round"/>
          <path d={`M215 ${177-browTilt}q17-9 31 2`} fill="none" stroke="#694b3a" strokeWidth="4" strokeLinecap="round"/>

          <g className="ii-eye ii-eye-left" style={{transform:`translate(${pupilX}px,${eyeY-188}px)`}}>
            <path d="M162 190q14-10 29 0-14 11-29 0z" fill="#f2e5d8"/>
            <ellipse cx="177" cy="190" rx="5.5" ry={tired?3.6:5.5} fill="#604739"/>
            <circle cx="178" cy="189" r="2.2" fill="#171514"/>
          </g>
          <g className="ii-eye ii-eye-right" style={{transform:`translate(${pupilX}px,${eyeY-188}px)`}}>
            <path d="M215 190q13-9 27 1-13 10-27-1z" fill="#f2e5d8"/>
            <ellipse cx="229" cy="190" rx="5.3" ry={tired?3.5:5.3} fill="#604739"/>
            <circle cx="230" cy="189" r="2.1" fill="#171514"/>
          </g>

          {tired && <><path d="M160 201q15 6 31 0" fill="none" stroke="#9f725f" strokeWidth="2" opacity=".5"/><path d="M215 201q14 6 28 0" fill="none" stroke="#9f725f" strokeWidth="2" opacity=".5"/></>}
          <path d="M202 195q-4 20-9 31 8 4 17-1" fill="none" stroke="#b47f62" strokeWidth="2.2" strokeLinecap="round"/>
          <path className="ii-mouth" d={speaking ? `M178 ${mouthY}q22 ${mouthCurve+4} 43 0q-21 12-43 0z` : `M178 ${mouthY}q22 ${mouthCurve} 43 0`} fill={speaking?"#915e59":"none"} stroke="#8f5e58" strokeWidth="3" strokeLinecap="round"/>
          {nervous && <circle cx="253" cy="213" r="2" fill="#cf977d" opacity=".5"/>}
        </g>

        <path d="M154 344q42 16 85 0" fill="none" stroke="#87908d" strokeWidth="2" opacity=".38"/>
        <path d="M136 376q63 23 125 0" fill="none" stroke="#262c2b" strokeWidth="3" opacity=".5"/>
      </g>

      <g className="ii-hands" opacity={shaken?.82:1}>
        <path d="M115 383c20-7 40-7 54 5 9 8 5 19-5 21-21 5-43-2-59-11-8-5-1-12 10-15z" fill="#d4a17d"/>
        <path d="M270 383c-20-7-40-7-54 5-9 8-5 19 5 21 21 5 43-2 59-11 8-5 1-12-10-15z" fill="#d4a17d"/>
        <path d="M145 388q12 9 25 14M244 388q-12 9-25 14" stroke="#aa795e" strokeWidth="2" opacity=".65"/>
      </g>

      <rect x="18" y="406" width="354" height="34" fill="#101212" opacity=".88"/>
      <text x="30" y="428" fill="#d8dddd" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="1.4">LÍVIA VALENÇA · DEPOIMENTO 01</text>
    </svg>
  )
}
