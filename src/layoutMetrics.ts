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
 * Decide o recuo inferior a partir do que o navegador informa.
 * Medido no iPhone 13 (Safari instalado): innerHeight 797, tela 844, recuo superior 47, e o conteúdo além de 797 é cortado:
 * a área da página termina 47 px acima do fim da tela. Forçar a altura da tela só corta o rodapé, então a altura é sempre
 * a do navegador. O recuo do indicador de início só vale quando a página realmente chega ao fim da tela.
 */
export function decideLayout({inner,full}:Metrics):Layout{
  return { height:null, bottomInset:inner>=full-2 }
}
