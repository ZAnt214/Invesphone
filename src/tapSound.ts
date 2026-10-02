import { sfx } from './sfx'

/**
 * Som discreto ao tocar em qualquer opção do jogo. Fica de fora o que já tem som próprio:
 * os depoimentos (gravador, pergunta, pista) e a ligação (toque, atender, desligar).
 */
const OWN_SOUND = '.ii, .call-screen, .launching, .ringtone-picker'

export function installTapSound(){
  document.addEventListener('click',e=>{
    const t = (e.target as Element | null)?.closest?.('button, [role="button"], a[href]')
    if(!t || (t as HTMLButtonElement).disabled || t.closest(OWN_SOUND)) return
    sfx.tap()
  },true)
}
