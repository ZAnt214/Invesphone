export type Expression =
  'neutral'|'tired'|'uncomfortable'|'defensive'|'nervous'|'shaken'|'angry'|'sad'|'confident'|'scared'

/** Retângulo em pixels do arquivo de retrato. */
export type Box = { x:number; y:number; w:number; h:number }

export type EyeRig = { cx:number; cy:number; rx:number; ry:number; iris:number }

/**
 * Marcações sobre o retrato oficial, em pixels do arquivo.
 * O retrato é recortado e transformado (sobrancelhas, íris, pálpebras, boca); nada é redesenhado.
 * As cores vêm de pontos do próprio arquivo (samples).
 */
export type FaceRig = {
  eyes: { left:EyeRig; right:EyeRig }
  brows: { left:Box; right:Box }
  mouth: {
    cx:number
    /** y dos cantos da boca. */
    rimY:number
    /** quanto o meio do lábio é mais alto que os cantos. */
    arch:number
    halfWidth:number
    /** limite inferior do recorte do lábio/queixo que desce. */
    bottom:number
    /** abertura máxima, em pixels do arquivo. */
    maxOpen:number
  }
  samples: {
    skin:[number, number]
    sclera:[number, number]
    lash:[number, number]
    mouthInner:[number, number]
  }
}

export type CharacterDef = {
  id:string
  name:string
  portrait: {
    /** Retrato neutro oficial. */
    src:string
    width:number
    height:number
    /** Parte do arquivo que aparece na tela. */
    crop:Box
    /** O arquivo já traz REC / DEPOIMENTO desenhados, então a interface não repete. */
    hasBakedHud?:boolean
  }
  /** Imagens oficiais por expressão. Quando existir uma, ela substitui o retrato neutro animado. */
  expressionAssets?: Partial<Record<Expression,string>>
  /** Sem rig, o retrato só respira. */
  rig?: FaceRig
  /** Recorte quadrado do rosto para listas e perfis. */
  face: { cx:number; cy:number; size:number }
}
