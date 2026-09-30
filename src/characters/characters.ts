import type { CharacterDef, EyeRig, MouthRig } from './types'

const base = import.meta.env.BASE_URL
const src = (id:string,name:string) => `${base}characters/${id}/expressions/${name}.jpg`

/**
 * Personagens com arte oficial. Um personagem novo entra aqui com os arquivos em public/characters/<id>/.
 * As marcas (olhos, boca, alinhamento) são medidas na própria imagem, em pixels do arquivo.
 */
const eye = (cx:number,cy:number,rx=38,ry=17):EyeRig => ({cx,cy,rx,ry})
const mouth = (cx:number,rimY:number,halfWidth:number,bottom:number,arch=2,maxOpen=17):MouthRig => ({cx,rimY,arch,halfWidth,bottom,maxOpen})

export const characters:Record<string,CharacterDef> = {
  livia:{
    id:'livia',
    name:'Lívia Valença',
    portrait:{
      width:900, height:1200,
      crop:{ x:80, y:10, w:740, h:800 },
      eyeMid:[431.9,437]
    },
    assets:{
      neutral:{
        src:src('livia','neutral'),
        align:{ eyeMid:[431.9,437], scale:1 },
        eyes:{ left:eye(360,437.2,38,17), right:eye(503.7,436.9,38,16) },
        mouth:mouth(432,560,54,574)
      },
      tired:{
        src:src('livia','tired'),
        align:{ eyeMid:[439.2,472.7], scale:.961 },
        eyes:{ left:eye(364.4,472.9,41,14), right:eye(513.9,472.5,40,14) },
        mouth:mouth(439,601,58,615)
      },
      uncomfortable:{
        src:src('livia','uncomfortable'),
        align:{ eyeMid:[435.4,484.5], scale:.986 },
        eyes:{ left:eye(362.5,484.9,39,17), right:eye(508.2,484.1,38,17) },
        mouth:mouth(444.5,609,55.5,625)
      },
      defensive:{
        src:src('livia','defensive'),
        align:{ eyeMid:[438.8,471.2], scale:1.023 },
        eyes:{ left:eye(368.5,471.2,37,17), right:eye(509,471.1,37,17) },
        mouth:mouth(439,591.5,53,600,1)
      },
      nervous:{
        src:src('livia','nervous'),
        align:{ eyeMid:[436.2,456.9], scale:.989 },
        eyes:{ left:eye(363.5,457.1,40,22), right:eye(508.8,456.6,39,22) },
        mouth:mouth(434.5,583.5,56.5,599)
      },
      shaken:{
        src:src('livia','shaken'),
        align:{ eyeMid:[436,459.1], scale:1.01 },
        eyes:{ left:eye(364.9,459.2,40,20), right:eye(507.1,459,39,20) },
        mouth:mouth(436,584.5,55,600,1)
      }
    },
    visemes:{
      src:`${base}characters/livia/visemes.png`,
      cellW:216, cellH:56,
      order:['A','E','I','O','U','M'],
      center:[108,27],
      lipWidth:85
    },
    face:{ cx:432, cy:450, size:420 }
  }
}

export const getCharacter = (id:string) => characters[id]
