/** Tela cheia no navegador. No iPhone o Safari não oferece a API: só o app instalado na tela de início abre sem barras. */

type FsDoc = Document & { webkitFullscreenElement?:Element|null; webkitFullscreenEnabled?:boolean; webkitExitFullscreen?:()=>Promise<void> }
type FsEl = HTMLElement & { webkitRequestFullscreen?:()=>Promise<void> }

const doc = () => document as FsDoc

/** O jogo já foi aberto como app (ícone na tela de início): sem barras do navegador. */
export function isStandalone():boolean{
  return !!(navigator as Navigator & { standalone?:boolean }).standalone
    || !!window.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches
}

export function canFullscreen():boolean{
  return !!(document.fullscreenEnabled || doc().webkitFullscreenEnabled)
}

export function isFullscreen():boolean{
  return !!(document.fullscreenElement || doc().webkitFullscreenElement)
}

export async function enterFullscreen():Promise<boolean>{
  const el = document.documentElement as FsEl
  try{
    if(el.requestFullscreen) await el.requestFullscreen({ navigationUI:'hide' })
    else if(el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
    else return false
    // em celulares, trava em retrato quando o navegador permite
    try{ await (screen.orientation as ScreenOrientation & { lock?:(o:string)=>Promise<void> }).lock?.('portrait') }catch{ /* nem todo navegador deixa */ }
    return true
  }catch{ return false }
}

export async function exitFullscreen(){
  try{
    if(document.exitFullscreen) await document.exitFullscreen()
    else await doc().webkitExitFullscreen?.()
  }catch{ /* ignora */ }
}

export function onFullscreenChange(fn:()=>void){
  document.addEventListener('fullscreenchange',fn)
  document.addEventListener('webkitfullscreenchange',fn)
  return ()=>{ document.removeEventListener('fullscreenchange',fn); document.removeEventListener('webkitfullscreenchange',fn) }
}
