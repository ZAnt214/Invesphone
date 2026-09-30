import type { CharacterDef } from './types'

const base = import.meta.env.BASE_URL

/**
 * Personagens com arte oficial. Um personagem novo entra aqui com o arquivo em public/characters/<id>/.
 * O rig marca onde ficam olhos, sobrancelhas e boca no retrato (em pixels do arquivo).
 */
export const characters:Record<string,CharacterDef> = {
  livia:{
    id:'livia',
    name:'Lívia Valença',
    portrait:{
      src:`${base}characters/livia/neutral.png`,
      width:941, height:1672,
      crop:{ x:0, y:0, w:941, h:1290 },
      hasBakedHud:true
    },
    rig:{
      eyes:{
        left:{ cx:401, cy:576, rx:39, ry:19, iris:19 },
        right:{ cx:552, cy:576, rx:39, ry:19, iris:19 }
      },
      brows:{
        left:{ x:345, y:510, w:110, h:30 },
        right:{ x:503, y:510, w:84, h:30 }
      },
      mouth:{ cx:476, rimY:721, arch:2, halfWidth:51, bottom:752, maxOpen:11 },
      samples:{
        skin:[401,543],
        sclera:[372,578],
        lash:[400,525],
        mouthInner:[432,720]
      }
    },
    face:{ cx:478, cy:600, size:560 }
  }
}

export const getCharacter = (id:string) => characters[id]
