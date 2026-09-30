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
      },
      apprehensive:{
        src:src('livia','apprehensive'),
        align:{ eyeMid:[445.3,474.5], scale:0.991 },
        eyes:{ left:eye(372.8,474.4,42,20), right:eye(517.8,474.5,41,20) },
        mouth:mouth(445,606.5,53,619,1)
      },
      lying:{
        src:src('livia','lying'),
        align:{ eyeMid:[441.7,490.1], scale:0.985 },
        eyes:{ left:eye(368.7,490,42,20), right:eye(514.6,490.2,41,20) },
        mouth:mouth(444,621,55,636,1)
      },
      teary:{
        src:src('livia','teary'),
        align:{ eyeMid:[446,465.4], scale:1.009 },
        eyes:{ left:eye(374.8,465.3,41,19), right:eye(517.2,465.5,41,19) },
        mouth:mouth(446.5,592.5,52.5,606,1)
      },
      false_relief:{
        src:src('livia','false_relief'),
        align:{ eyeMid:[446.8,460.9], scale:1.018 },
        eyes:{ left:eye(376.2,460.9,41,19), right:eye(517.3,460.9,40,19) },
        mouth:mouth(446.5,587.5,53.5,602.5,1)
      },
      slightly_tired:{
        src:src('livia','slightly_tired'),
        align:{ eyeMid:[444.7,480.2], scale:0.988 },
        eyes:{ left:eye(371.9,479.9,42,16), right:eye(517.4,480.4,41,15) },
        mouth:mouth(443.5,615,53.5,630,1)
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
