/**
 * Alguns navegadores do iPhone (Chrome, por exemplo) informam um recuo inferior de ~34 px mas a área da página
 * já termina acima do indicador de início: aplicar o recuo ali duplica o espaço vazio. Só se mantém o recuo quando a
 * página realmente ocupa a tela inteira; senão ele vira 0.
 */
export function fitSafeArea(){
  const root = document.documentElement
  const apply = ()=>{
    const portrait = window.innerHeight >= window.innerWidth
    const full = portrait ? Math.max(screen.width,screen.height) : Math.min(screen.width,screen.height)
    const covers = window.innerHeight >= full - 2
    root.style.setProperty('--safe-b',covers ? 'env(safe-area-inset-bottom,0px)' : '0px')
  }
  apply()
  window.addEventListener('resize',apply)
  window.addEventListener('orientationchange',apply)
}
