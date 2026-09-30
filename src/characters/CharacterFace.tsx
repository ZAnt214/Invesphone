import type { CharacterDef } from './types'

/** Rosto do personagem para listas e perfis, recortado do retrato oficial (nenhum arquivo extra). */
export default function CharacterFace({character}:{character:CharacterDef}){
  const { portrait:p, face:f } = character
  const x0 = f.cx-f.size/2, y0 = f.cy-f.size/2
  return (
    <span
      className="face-crop"
      role="img"
      aria-label={character.name}
      style={{
        backgroundImage:`url(${p.src})`,
        backgroundSize:`${p.width/f.size*100}% auto`,
        backgroundPosition:`${x0/(p.width-f.size)*100}% ${y0/(p.height-f.size)*100}%`
      }}
    />
  )
}
