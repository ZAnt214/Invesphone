import type { CharacterDef } from './types'

/** Rosto do personagem para listas e perfis, recortado do retrato neutro (nenhum arquivo extra). */
export default function CharacterFace({character}:{character:CharacterDef}){
  const { portrait:p, face:f, assets } = character
  const x0 = f.cx-f.size/2, y0 = f.cy-f.size/2
  // o recorte é quadrado; em imagens mais largas que altas, a posição vertical usa a folga que existe
  const slackY = Math.max(1,p.height-f.size)
  return (
    <span
      className="face-crop"
      role="img"
      aria-label={character.name}
      style={{
        backgroundImage:`url(${assets.neutral.src})`,
        backgroundSize:`${p.width/f.size*100}% auto`,
        backgroundPosition:`${x0/(p.width-f.size)*100}% ${y0/slackY*100}%`
      }}
    />
  )
}
