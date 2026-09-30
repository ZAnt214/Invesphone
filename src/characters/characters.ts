import type { CharacterDef, EyeRig, MouthRig } from './types'

const base = import.meta.env.BASE_URL
const src = (id:string,name:string) => `${base}characters/${id}/${name}.jpg`

/**
 * Personagens com arte oficial. Um personagem novo entra aqui com os arquivos em public/characters/<id>/.
 * As marcas (olhos, boca, alinhamento) são medidas na própria imagem, em pixels do arquivo.
 */
const eye = (cx:number,cy:number,rx=20,ry=9):EyeRig => ({cx,cy,rx,ry})
const mouth = (cx:number,rimY:number,halfWidth:number,bottom:number,arch=1,maxOpen=9):MouthRig => ({cx,rimY,arch,halfWidth,bottom,maxOpen})

export const characters:Record<string,CharacterDef> = {
  livia:{
    id:'livia',
    name:'Lívia Valença',
    portrait:{
      width:498, height:410,
      crop:{ x:34, y:0, w:430, h:410 },
      eyeMid:[242.2,208.9]
    },
    assets:{
      neutral:{
        src:src('livia','neutral'),
        align:{ eyeMid:[242.2,208.9], scale:1 },
        eyes:{ left:eye(205.6,208.7), right:eye(278.8,209.2,20,10) },
        mouth:mouth(242.2,269.2,27,281)
      },
      tired:{
        src:src('livia','tired'),
        align:{ eyeMid:[248.4,212.3], scale:.988 },
        eyes:{ left:eye(211.4,212.7,20,8), right:eye(285.5,211.9,20,8) },
        mouth:mouth(249.6,273.6,27.6,286)
      },
      uncomfortable:{
        src:src('livia','uncomfortable'),
        align:{ eyeMid:[253.6,211.2], scale:.985 },
        eyes:{ left:eye(216.3,212.1,21,10), right:eye(290.9,210.3,18,10) },
        mouth:mouth(259.8,276.3,27.3,289)
      },
      defensive:{
        src:src('livia','defensive'),
        align:{ eyeMid:[244.2,195.9], scale:1.04 },
        eyes:{ left:eye(209,197.9,18,8), right:eye(279.4,193.8,19,8) },
        mouth:mouth(246,254.4,25,266,.5)
      },
      nervous:{
        src:src('livia','nervous'),
        align:{ eyeMid:[243.9,195.6], scale:.988 },
        eyes:{ left:eye(206.9,195.7,20,12), right:eye(281,195.4,20,12) },
        mouth:mouth(243.5,262.4,28.5,276)
      },
      shaken:{
        src:src('livia','shaken'),
        align:{ eyeMid:[248.9,212.4], scale:1.008 },
        eyes:{ left:eye(212.6,215.2,20,8), right:eye(285.2,209.6,20,8) },
        mouth:mouth(255,277.6,28,290,.5)
      }
    },
    face:{ cx:243, cy:215, size:240 }
  }
}

export const getCharacter = (id:string) => characters[id]
