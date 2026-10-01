import { decideLayout } from './layoutMetrics'

/** Mede o recuo superior real (env) com um elemento de prova. */
function topInset():number{
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px)'
  document.body.appendChild(el)
  const v = parseFloat(getComputedStyle(el).paddingTop) || 0
  el.remove()
  return v
}

/**
 * Ajusta a altura do jogo e o recuo inferior ao que o navegador realmente entrega (veja `decideLayout`).
 * Resultado em `--app-h` e `--safe-b`, usados em shell.css.
 */
export function fitSafeArea(){
  const root = document.documentElement
  const standalone = !!(navigator as Navigator & { standalone?:boolean }).standalone
    || !!window.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches
  const apply = ()=>{
    const portrait = window.innerHeight >= window.innerWidth
    const full = portrait ? Math.max(screen.width,screen.height) : Math.min(screen.width,screen.height)
    const l = decideLayout({ inner:window.innerHeight, full, top:topInset(), standalone })
    if(l.height) root.style.setProperty('--app-h',`${l.height}px`); else root.style.removeProperty('--app-h')
    // o indicador de início ocupa só os ~14 px de baixo: o recuo útil é o restante, e os controles descem até ele
    root.style.setProperty('--safe-b',l.bottomInset ? 'max(0px, calc(env(safe-area-inset-bottom,0px) - 14px))' : '0px')
  }
  apply()
  window.addEventListener('resize',apply)
  window.addEventListener('orientationchange',apply)
}
