/**
 * Medidor de FPS (Ajustes → Gráficos → Interface → "Medidor de FPS", desligado por padrão).
 *
 * Fica no alto, no meio da tela do jogo (dentro de #app, então gira junto no celular em pé) e mostra:
 * - quantos quadros por segundo o navegador está desenhando (média do último meio segundo);
 * - o pior quadro do último segundo, em fps ("mín"), que é o que o olho sente como tranco.
 * Verde a partir de 55, âmbar a partir de 40, vermelho abaixo disso.
 *
 * Desligado, não existe: nenhum requestAnimationFrame extra rodando.
 */
import { fxOn, onFxChange } from './gameSettings'

let el:HTMLDivElement|null = null
let raf = 0
let host:HTMLElement|null = null

function ensureStyle(){
  if(document.getElementById('fps-meter-style')) return
  const s = document.createElement('style'); s.id = 'fps-meter-style'
  s.textContent = `.fps-meter{position:absolute;top:max(4px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;
    font:600 11px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.04em;color:#e8f5e9;background:rgba(6,8,12,.72);
    border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:4px 7px;white-space:nowrap;font-variant-numeric:tabular-nums}
  .fps-meter b{font-weight:800}
  .fps-meter i{font-style:normal;opacity:.7}
  .fps-meter.ok b{color:#7ee08a}.fps-meter.mid b{color:#ffc65c}.fps-meter.bad b{color:#ff6b5e}`
  document.head.appendChild(s)
}

function start(){
  if(el||!host) return
  ensureStyle()
  el = document.createElement('div'); el.className = 'fps-meter ok'; el.setAttribute('aria-hidden','true'); el.textContent = '— FPS'
  host.appendChild(el)
  let last = performance.now(), acc = 0, n = 0, shown = performance.now()
  const worst:number[] = []   // duração dos quadros do último segundo
  const tick = (now:number)=>{
    const dt = now - last; last = now
    if(dt>0&&dt<1000){ acc += dt; n++; worst.push(dt); if(worst.length>240) worst.shift() }
    if(now - shown >= 500 && n){
      const fps = 1000/(acc/n)
      let sum = 0, mx = 0; for(let i = worst.length-1; i>=0 && sum<1000; i--){ sum += worst[i]; if(worst[i]>mx) mx = worst[i] }
      const low = mx ? 1000/mx : fps
      if(el){
        el.className = 'fps-meter ' + (fps>=55?'ok':fps>=40?'mid':'bad')
        el.innerHTML = `<b>${Math.round(fps)}</b> FPS <i>· mín ${Math.round(Math.min(low,fps))}</i>`
      }
      acc = 0; n = 0; shown = now
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

function stop(){
  if(raf) cancelAnimationFrame(raf); raf = 0
  el?.remove(); el = null
}

const sync = ()=>{ if(fxOn('hud.fps')) start(); else stop() }

/** chama uma vez por página, com o contêiner do jogo (#app) */
export function mountFpsMeter(parent:HTMLElement){
  host = parent
  sync()
  onFxChange(sync)
}
