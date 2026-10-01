export type Metrics = {
  /** window.innerHeight */ inner:number
  /** maior lado de `screen` (altura do aparelho em pé) */ full:number
  /** recuo superior informado (barra de status / notch) */ top:number
  /** aberto como app instalado */ standalone:boolean
}

export type Layout = {
  /** altura do corpo do jogo; null = a do próprio navegador (100%) */ height:number|null
  /** a página chega ao fim da tela, então vale o recuo do indicador de início */ bottomInset:boolean
}

/**
 * Decide a altura do jogo a partir do que o navegador informa.
 * - Safari instalado (barra de status translúcida): `innerHeight` desconta a barra de status (47 px) mas a página é
 *   desenhada por baixo dela; sem corrigir, sobra uma faixa do tamanho da barra no rodapé.
 * - Página que já ocupa a tela inteira: nada a corrigir, vale o recuo do indicador.
 * - Qualquer outra (Chrome, Safari com barras): a área termina acima do indicador, então sem recuo.
 */
export function decideLayout({inner,full,top,standalone}:Metrics):Layout{
  if(standalone && top>0 && Math.abs(inner+top-full)<=3) return { height:full, bottomInset:true }
  if(inner>=full-2) return { height:null, bottomInset:true }
  return { height:null, bottomInset:false }
}
