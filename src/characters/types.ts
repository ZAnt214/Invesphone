export type Expression =
  'neutral'|'tired'|'uncomfortable'|'defensive'|'nervous'|'shaken'|'angry'|'sad'|'confident'|'scared'|
  'apprehensive'|'lying'|'teary'|'false_relief'|'slightly_tired'

/** Retângulo em pixels do arquivo de retrato. */
export type Box = { x:number; y:number; w:number; h:number }

export type EyeRig = { cx:number; cy:number; rx:number; ry:number }

export type MouthRig = {
  cx:number
  /** y dos cantos da boca. */
  rimY:number
  /** quanto o meio da boca é mais alto que os cantos. */
  arch:number
  halfWidth:number
  /** limite inferior do lábio/queixo que desce. */
  bottom:number
  /** abertura máxima, em pixels do arquivo. */
  maxOpen:number
}

/**
 * Uma imagem oficial de uma expressão, com as marcas necessárias para animá-la.
 * As coordenadas são em pixels do próprio arquivo. A imagem nunca é redesenhada:
 * piscar e falar usam recortes dela e cores amostradas dela.
 */
export type ExpressionAsset = {
  src:string
  /** Ponto médio entre os olhos neste arquivo e escala para casar com o retrato neutro, e dois y do corpo: onde o pescoço encontra os ombros (a roupa alarga) e o fundo do decote, no centro. Cabeça alinhada pelos olhos e corpo pela roupa, com o pescoço esticado entre os dois: a troca não faz nenhuma das duas partes pular. */
  align:{ eyeMid:[number, number]; scale:number; neckY:number; shoulderY:number }
  eyes:{ left:EyeRig; right:EyeRig }
  mouth:MouthRig
}

export type Viseme = 'A'|'E'|'I'|'O'|'U'|'M'

/**
 * Formas de boca para a fala, lado a lado num arquivo. Cada uma é um recorte do queixo
 * com a boca no centro; o renderizador troca a boca da expressão por elas enquanto a personagem fala.
 */
export type VisemeAtlas = {
  src:string
  cellW:number
  cellH:number
  /** ordem das formas no arquivo */
  order:Viseme[]
  /** centro da boca dentro de uma célula */
  center:[number, number]
  /** largura da boca fechada (M) dentro de uma célula, para calcular a escala */
  lipWidth:number
}

/**
 * Camadas fixas do personagem (fundo, corpo e cabeça sem as feições). Quando existem, o retrato nunca troca
 * de imagem inteira: só o interior do rosto (`facePolygon`, em pixels do retrato) muda de expressão.
 */
export type CharacterRig = {
  background:string
  body:string
  head:string
  facePolygon:[number, number][]
}

export type CharacterDef = {
  id:string
  name:string
  portrait: {
    width:number
    height:number
    /** Parte do arquivo que aparece na tela. */
    crop:Box
    /** Ponto médio entre os olhos no retrato neutro: referência do alinhamento. */
    eyeMid:[number, number]
    /** O arquivo já traz REC / DEPOIMENTO desenhados, então a interface não repete. */
    hasBakedHud?:boolean
  }
  /** Imagens oficiais por expressão. `neutral` é obrigatória; expressão sem imagem usa a neutra. */
  assets: { neutral:ExpressionAsset } & Partial<Record<Expression,ExpressionAsset>>
  /** Formas de boca para sincronizar a fala. Sem isso, a boca fala abrindo o lábio de baixo. */
  visemes?: VisemeAtlas
  /** Camadas fixas: fundo, corpo e cabeça. Só o rosto muda de expressão. */
  rig?: CharacterRig
  /** Recorte quadrado do rosto (no retrato neutro) para listas e perfis. */
  face: { cx:number; cy:number; size:number }
}
