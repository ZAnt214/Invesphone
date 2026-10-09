import { useEffect, useRef } from 'react'
import { roomSfx, setRoomPressure, startRoom, stopRoom } from './roomAudio'

type Props = {
  /** Pressão acumulada, 0 a 100: a lâmpada falha mais e o coração aparece no som. */
  pressure:number
  /** Recebe a falha da lâmpada (para o resto da cena piscar junto). */
  onFlicker:(on:boolean)=>void
}

/**
 * Vida da sala de depoimentos: poeira no ar que só brilha dentro do facho da luminária, fumaça do cigarro no cinzeiro
 * (acende ao cruzar a luz), falhas da lâmpada e o som ambiente. A geometria segue a caixa do depoente (`.ii-actorfx`):
 * o canvas cobre a caixa com folga dos lados, e o facho sai da lâmpada (50%, 13,5%) até 79% da altura, com meia
 * largura de 61,5% da caixa, as mesmas medidas do CSS.
 */
export default function RoomFx({pressure,onFlicker}:Props){
  const canvas = useRef<HTMLCanvasElement>(null)
  const pRef = useRef(pressure/100)
  const flick = useRef(0)
  const onFlickerRef = useRef(onFlicker)
  onFlickerRef.current = onFlicker
  pRef.current = pressure/100

  useEffect(()=>{ setRoomPressure(pressure/100) },[pressure])

  // som ambiente enquanto a sala estiver aberta
  useEffect(()=>{ startRoom(); return ()=>stopRoom() },[])

  // a lâmpada falha de vez em quando; com pressão alta, mais vezes
  useEffect(()=>{
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let t = 0
    const next = ()=>{
      const p = pRef.current
      t = window.setTimeout(()=>{
        const strong = Math.random()<.35+p*.4
        flick.current = performance.now()
        onFlickerRef.current(true)
        roomSfx.zap(strong ? 1 : .5)
        t = window.setTimeout(()=>{ onFlickerRef.current(false); next() }, strong ? 260 : 120)
      }, (9000-p*6500)*(.6+Math.random()*.8))
    }
    next()
    return ()=>window.clearTimeout(t)
  },[])

  useEffect(()=>{
    const cv = canvas.current
    if(!cv) return
    const ctx = cv.getContext('2d')!
    const calm = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let W = 0, H = 0, dpr = 1, raf = 0, last = performance.now()
    const box = { x:0, y:0, w:1, h:1 }
    const fit = ()=>{
      dpr = Math.min(2,window.devicePixelRatio||1)
      W = cv.clientWidth; H = cv.clientHeight
      cv.width = Math.max(1,Math.round(W*dpr)); cv.height = Math.max(1,Math.round(H*dpr))
      // o canvas vai de -70% a 170% da largura da caixa e de 0 a 106% da altura
      box.w = W/2.4; box.h = H/1.06; box.x = box.w*.7; box.y = 0
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(cv)

    // sprite macio para fumaça e poeira grande
    const soft = document.createElement('canvas'); soft.width = soft.height = 64
    { const g = soft.getContext('2d')!, r = g.createRadialGradient(32,32,0,32,32,32)
      r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(.45,'rgba(255,255,255,.35)'); r.addColorStop(1,'rgba(255,255,255,0)')
      g.fillStyle = r; g.fillRect(0,0,64,64) }

    const apex = ()=>({ x:box.x+box.w*.5, y:box.y+box.h*.135 })
    /** 0 fora do facho, 1 no eixo: queda suave nas bordas e no fim do facho. */
    const inCone = (x:number,y:number)=>{
      const a = apex(), end = box.h*.79
      if(y<a.y || y>end) return 0
      const k = (y-a.y)/(end-a.y), half = box.w*.615*k+2
      const d = Math.abs(x-a.x)/half
      if(d>=1) return 0
      return (1-d*d)*Math.min(1,(1-k)*3)*(.55+.45*k)
    }
    const rnd = (a:number,b:number)=>a+Math.random()*(b-a)
    type Mote = { x:number; y:number; vx:number; vy:number; r:number; ph:number }
    const motes:Mote[] = Array.from({length:90},()=>({ x:rnd(0,1), y:rnd(.05,1), vx:rnd(-.004,.004), vy:rnd(-.006,.002), r:rnd(.5,1.7), ph:rnd(0,6.28) }))
    type Puff = { x:number; y:number; vx:number; vy:number; r:number; life:number; t:number; ph:number }
    const puffs:Puff[] = []
    let spawn = 0

    const frame = (now:number)=>{
      const dt = Math.min(.05,(now-last)/1000); last = now
      ctx.setTransform(dpr,0,0,dpr,0,0)
      ctx.clearRect(0,0,W,H)
      const flickering = now-flick.current<260 ? .35 : 1
      // poeira: posições em fração do canvas, vagando devagar
      ctx.globalCompositeOperation = 'lighter'
      for(const m of motes){
        if(!calm){
          m.ph += dt*.6
          m.x += (m.vx+Math.sin(m.ph)*.002)*dt; m.y += (m.vy+Math.cos(m.ph*.7)*.002)*dt
          if(m.y<.02) m.y = 1; if(m.y>1.02) m.y = .03; if(m.x<0) m.x = 1; if(m.x>1) m.x = 0
        }
        const x = m.x*W, y = m.y*H, lit = inCone(x,y)
        const a = (.04+lit*.75)*flickering*(.75+.25*Math.sin(m.ph*3))
        if(a<.02) continue
        ctx.globalAlpha = a
        ctx.fillStyle = lit>.05 ? '#ffe9c4' : '#9aa6b0'
        ctx.beginPath(); ctx.arc(x,y,m.r*(lit>.4?1.15:1),0,6.283); ctx.fill()
      }
      // fumaça do cigarro: sobe enrolando e clareia ao cruzar o facho
      const ex = box.x+box.w*-.06, ey = box.y+box.h*.935
      spawn -= dt
      if(spawn<=0 && !calm){ spawn = .09; puffs.push({ x:ex, y:ey, vx:rnd(-3,3), vy:rnd(-26,-18), r:rnd(2,3.5), life:rnd(3.5,5), t:0, ph:rnd(0,6.28) }) }
      for(let i=puffs.length-1;i>=0;i--){
        const p = puffs[i]
        p.t += dt
        if(p.t>p.life){ puffs.splice(i,1); continue }
        const k = p.t/p.life
        p.x += (p.vx+Math.sin(p.ph+p.t*1.7)*(6+18*k))*dt; p.y += p.vy*dt*(1-k*.4); p.r += dt*(5+7*k)
        const lit = inCone(p.x,p.y)
        ctx.globalAlpha = Math.min(1,p.t*4)*(1-k)*(.05+lit*.22)*flickering
        ctx.drawImage(soft,p.x-p.r,p.y-p.r,p.r*2,p.r*2)
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const vis = ()=>{ cancelAnimationFrame(raf); if(!document.hidden){ last = performance.now(); raf = requestAnimationFrame(frame) } }
    document.addEventListener('visibilitychange',vis)
    return ()=>{ cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange',vis) }
  },[])

  return (
    <div className="ii-actorfx" aria-hidden="true">
      <div className="ii-falloff"/>
      <div className="ii-ashtray"><i/></div>
      <canvas ref={canvas} className="ii-motes"/>
    </div>
  )
}
