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
 * iPhone 13, Safari instalado: innerHeight 797, tela 844, recuo superior 47. A página é desenhada até o fim físico da tela
 * (veja a peça de 100lvh em shell.css), embora o innerHeight não mostre isso: nesse caso o recuo do indicador de início vale.
 * Em páginas que já ocupam a tela inteira ele também vale; nos demais casos (área que termina acima do indicador) é 0.
 */
export function decideLayout({inner,full,top,standalone}:Metrics):Layout{
  const quirk = standalone && top>0 && Math.abs(inner+top-full)<=3
  return { height:null, bottomInset:inner>=full-2 || quirk }
}
