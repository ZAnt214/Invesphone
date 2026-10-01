import type { CharacterDef, EyeRig, ExpressionAsset, MouthRig } from './types'
import castMarks from './castMarks.json'

const base = import.meta.env.BASE_URL
const src = (id:string,name:string) => `${base}characters/${id}/expressions/${name}.jpg`

/**
 * Personagens com arte oficial. Um personagem novo entra aqui com os arquivos em public/characters/<id>/.
 * As marcas (olhos, boca, alinhamento) são medidas na própria imagem, em pixels do arquivo.
 */
const eye = (cx:number,cy:number,rx=38,ry=17):EyeRig => ({cx,cy,rx,ry})
const mouth = (cx:number,rimY:number,halfWidth:number,bottom:number,arch=2,maxOpen=17):MouthRig => ({cx,rimY,arch,halfWidth,bottom,maxOpen})

/**
 * Elenco do Caso 01 (Caio, Téo, Rafael, Cida, Jorge): pacote de expressões do ChatGPT em
 * public/characters/<id>/ (expressions/*.jpg, visemes.png). As marcas de olhos e o alinhamento de cada expressão
 * vêm de castMarks.json (scripts/measure-cast.py); a boca usa a do retrato neutro acompanhando o deslocamento dos olhos.
 */
const cast = (id:string, name:string, m:{cx:number,rim:number,half:number,bottom:number}):CharacterDef => {
  const marks = castMarks[id as keyof typeof castMarks] as unknown as Record<string,{eyeMid:[number,number],scale:number,eyes:[number,number,number,number][],mouthDy:number}>
  const n = marks.neutral
  const assets = Object.fromEntries(Object.entries(marks).map(([k,v])=>{
    const dx = v.eyeMid[0]-n.eyeMid[0], dy = v.mouthDy
    const asset:ExpressionAsset = {
      src:`${base}characters/${id}/expressions/${k}.jpg`,
      align:{ eyeMid:v.eyeMid, scale:v.scale, neckY:760, shoulderY:673 },
      eyes:{ left:eye(...v.eyes[0]), right:eye(...v.eyes[1]) },
      mouth:mouth(m.cx+dx,m.rim+dy,m.half,m.bottom+dy)
    }
    return [k,asset]
  })) as CharacterDef['assets']
  return {
    id, name,
    portrait:{ width:900, height:1200, crop:{ x:80, y:10, w:740, h:800 }, eyeMid:n.eyeMid },
    assets,
    faceMask:`${base}characters/${id}/face-mask.png`,
    visemes:{ src:`${base}characters/${id}/visemes.png`, cellW:400, cellH:120, order:['A','E','I','O','U','M'], center:[200,60], lipWidth:108, reach:.5 },
    face:{ cx:n.eyeMid[0], cy:n.eyeMid[1]+18, size:420 }
  }
}

export const characters:Record<string,CharacterDef> = {
  caio:cast('caio','Caio Duarte',{ cx:454, rim:559, half:54, bottom:577 }),
  teo:cast('teo','Téo Duarte',{ cx:452, rim:570, half:47, bottom:586 }),
  rafael:cast('rafael','Rafael Valença',{ cx:450, rim:576, half:45, bottom:594 }),
  cida:cast('cida','Cida',{ cx:442, rim:599, half:57, bottom:616 }),
  jorge:cast('jorge','Jorge',{ cx:458, rim:551, half:50, bottom:568 }),
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
        align:{ eyeMid:[431.9,437], scale:1, neckY:760, shoulderY:673 },
        eyes:{ left:eye(360,437.2,38,17), right:eye(503.7,436.9,38,16) },
        mouth:mouth(432,560,54,574)
      },
      tired:{
        src:src('livia','tired'),
        align:{ eyeMid:[439.2,472.7], scale:.961, neckY:805, shoulderY:713 },
        eyes:{ left:eye(364.4,472.9,41,14), right:eye(513.9,472.5,40,14) },
        mouth:mouth(439,601,58,615)
      },
      uncomfortable:{
        src:src('livia','uncomfortable'),
        align:{ eyeMid:[435.4,484.5], scale:.986, neckY:803, shoulderY:720 },
        eyes:{ left:eye(362.5,484.9,39,17), right:eye(508.2,484.1,38,17) },
        mouth:mouth(444.5,609,55.5,625)
      },
      defensive:{
        src:src('livia','defensive'),
        align:{ eyeMid:[438.8,471.2], scale:1.023, neckY:786, shoulderY:707 },
        eyes:{ left:eye(368.5,471.2,37,17), right:eye(509,471.1,37,17) },
        mouth:mouth(439,591.5,53,600,1)
      },
      nervous:{
        src:src('livia','nervous'),
        align:{ eyeMid:[436.2,456.9], scale:.989, neckY:776, shoulderY:692 },
        eyes:{ left:eye(363.5,457.1,40,22), right:eye(508.8,456.6,39,22) },
        mouth:mouth(434.5,583.5,56.5,599)
      },
      shaken:{
        src:src('livia','shaken'),
        align:{ eyeMid:[436,459.1], scale:1.01, neckY:779, shoulderY:695 },
        eyes:{ left:eye(364.9,459.2,40,20), right:eye(507.1,459,39,20) },
        mouth:mouth(436,584.5,55,600,1)
      },
      apprehensive:{
        src:src('livia','apprehensive'),
        align:{ eyeMid:[445.3,474.5], scale:0.991, neckY:838, shoulderY:724 },
        eyes:{ left:eye(372.8,474.4,42,20), right:eye(517.8,474.5,41,20) },
        mouth:mouth(445,606.5,53,619,1)
      },
      lying:{
        src:src('livia','lying'),
        align:{ eyeMid:[441.7,490.1], scale:0.985, neckY:864, shoulderY:744 },
        eyes:{ left:eye(368.7,490,42,20), right:eye(514.6,490.2,41,20) },
        mouth:mouth(444,621,55,636,1)
      },
      teary:{
        src:src('livia','teary'),
        align:{ eyeMid:[446,465.4], scale:1.009, neckY:824, shoulderY:709 },
        eyes:{ left:eye(374.8,465.3,41,19), right:eye(517.2,465.5,41,19) },
        mouth:mouth(446.5,592.5,52.5,606,1)
      },
      false_relief:{
        src:src('livia','false_relief'),
        align:{ eyeMid:[446.8,460.9], scale:1.018, neckY:816, shoulderY:706 },
        eyes:{ left:eye(376.2,460.9,41,19), right:eye(517.3,460.9,40,19) },
        mouth:mouth(446.5,587.5,53.5,602.5,1)
      },
      slightly_tired:{
        src:src('livia','slightly_tired'),
        align:{ eyeMid:[444.7,480.2], scale:0.988, neckY:850, shoulderY:732 },
        eyes:{ left:eye(371.9,479.9,42,16), right:eye(517.4,480.4,41,15) },
        mouth:mouth(443.5,615,53.5,630,1)
      }
    },
    faceMask:`${base}characters/livia/face-mask.png`,
    visemes:{
      src:`${base}characters/livia/visemes.png`,
      cellW:400, cellH:120,
      order:['A','E','I','O','U','M'],
      center:[200,60],
      lipWidth:108
    },
    face:{ cx:432, cy:450, size:420 }
  }
}

export const getCharacter = (id:string) => characters[id]
