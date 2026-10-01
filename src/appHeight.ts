/**
 * No iPhone, o app instalado na tela de início pode medir `100%` menos que a tela (sobra uma faixa embaixo,
 * na área do indicador de início). Quando está instalado, a altura do jogo passa a ser a da tela inteira.
 */
export function fitAppHeight(){
  const standalone = !!(navigator as Navigator & { standalone?:boolean }).standalone
    || !!window.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches
  const root = document.documentElement
  const apply = ()=>{
    if(!standalone){ root.style.removeProperty('--app-h'); return }
    const portrait = window.innerHeight >= window.innerWidth
    const long = Math.max(screen.width,screen.height), short = Math.min(screen.width,screen.height)
    const full = portrait ? long : short
    root.style.setProperty('--app-h',`${Math.max(window.innerHeight,full)}px`)
  }
  apply()
  window.addEventListener('resize',apply)
  window.addEventListener('orientationchange',apply)
}
