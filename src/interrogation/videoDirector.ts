import type { VideoFileId, VideoState } from './types'
import { CROSS_TO_NEUTRAL, CROSS_TO_REACTION, GRAPH_FPS, GRAPH_FRAMES, JUMPS_NEUTRAL, JUMPS_REACTION } from './videoGraph'
import type { FrameTable } from './videoGraph'

type Buffers = Record<VideoFileId, [HTMLVideoElement, HTMLVideoElement]>

type Run = {
  state:VideoState
  end:number                              // fim do trecho contínuo atual (s)
  next:{ to:number; diff:number }|null    // para onde saltar
  prepared:{ el:HTMLVideoElement; to:number; diff:number }|null
  committing:boolean
}

const PREPARE_AHEAD = 0.55   // s antes do salto: posiciona o elemento escondido
const COMMIT_AHEAD = 0.07    // s antes do salto: começa a tocar e faz o fade
const JUMPS:Record<VideoFileId,FrameTable> = { neutral:JUMPS_NEUTRAL, reaction:JUMPS_REACTION }

// quando cada momento de cada arquivo foi exibido pela última vez; vale entre respostas
const lastShown:Record<VideoFileId,number[]> = {
  neutral:new Array(GRAPH_FRAMES).fill(0),
  reaction:new Array(GRAPH_FRAMES).fill(0)
}
const frameOf = (t:number) => Math.max(0, Math.min(GRAPH_FRAMES-1, Math.round(t*GRAPH_FPS)))
const timeOf = (f:number) => f/GRAPH_FPS
const rand = (a:number,b:number) => a + Math.random()*(b-a)

/** Marca um intervalo como recém-exibido. */
function markShown(file:VideoFileId, from:number, to:number){
  const now = performance.now()
  for(let f=frameOf(from); f<=frameOf(to); f++) lastShown[file][f] = now
}
/** 0 = acabou de aparecer, 1 = faz tempo (ou nunca apareceu). */
function coldness(file:VideoFileId, t:number){
  const now = performance.now()
  let last = 0
  const f0 = frameOf(t)
  for(let f=f0; f<Math.min(GRAPH_FRAMES,f0+GRAPH_FPS*2); f++) last = Math.max(last, lastShown[file][f])
  return last===0 ? 1 : Math.min(1, (now-last)/45000)
}

/**
 * Controla os dois arquivos como estados visuais de uma personagem.
 * Cada arquivo tem dois elementos <video>; o salto entre momentos é feito trocando de elemento com um fade curto.
 */
export class VideoDirector {
  private active:HTMLVideoElement|null = null
  private activeFile:VideoFileId|null = null
  private run:Run|null = null
  private raf = 0
  private destroyed = false
  private frozen = false
  private token = 0
  private z = 1
  private timers:number[] = []
  private warmed:{ stateId:string; t:number; diff:number; el:HTMLVideoElement }|null = null
  onFailure?:()=>void

  constructor(private bufs:Buffers, private states:Record<string,VideoState>, private idleId:string){
    for(const v of Object.values(bufs).flat()){
      v.muted = true
      v.defaultMuted = true
      v.volume = 0
      v.playsInline = true
      v.controls = false
      v.loop = false
      v.disablePictureInPicture = true
      v.setAttribute('playsinline','')
      v.setAttribute('webkit-playsinline','')
      v.setAttribute('disableremoteplayback','')
      v.addEventListener('error',()=>this.onFailure?.())
    }
    document.addEventListener('visibilitychange',this.onVisibility)
    this.tick()
  }

  destroy(){
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.timers.forEach(clearTimeout)
    document.removeEventListener('visibilitychange',this.onVisibility)
    for(const v of Object.values(this.bufs).flat()) v.pause()
  }

  async start(){
    await Promise.all(Object.values(this.bufs).flat().map(v=>this.ready(v)))
    // dá um tempo para o começo dos arquivos chegar antes da primeira troca
    await Promise.all(Object.values(this.bufs).flat().map(v=>this.buffered(v)))
    if(this.destroyed) return
    await this.enter(this.idleId,true)
  }
  play(stateId:string){ this.frozen = false; return this.enter(stateId,false) }
  idle(){ this.frozen = false; return this.enter(this.idleId,false) }
  freeze(){ this.frozen = true; this.token++; this.active?.pause() }
  resume(){
    if(this.frozen||!this.active) return
    if(this.active.paused) this.active.play().catch(()=>{})
  }

  private onVisibility = () => { if(document.hidden) this.active?.pause(); else this.resume() }

  private ready(v:HTMLVideoElement){
    return new Promise<void>(res=>{
      if(v.readyState>=1){ res(); return }
      const done=()=>{ v.removeEventListener('loadedmetadata',done); clearTimeout(t); res() }
      const t = window.setTimeout(done,4000)
      v.addEventListener('loadedmetadata',done)
      v.load()
    })
  }

  private buffered(v:HTMLVideoElement){
    return new Promise<void>(res=>{
      if(v.readyState>=3){ res(); return }
      const done=()=>{ v.removeEventListener('canplay',done); clearTimeout(t); res() }
      const t = window.setTimeout(done,2500)
      v.addEventListener('canplay',done)
    })
  }

  /** Posiciona antecipadamente o elemento de um estado, enquanto a personagem ainda "ouve". */
  async warm(stateId:string){
    const state = this.states[stateId]
    if(!state || this.destroyed) return
    const start = this.startFor(state)
    const el = this.otherOfForEnter(state.file)
    if(el===this.active) return
    el.pause()
    this.warmed = { stateId, t:start.t, diff:start.diff, el }
    await this.seek(el,start.t)
  }

  private seekOnce(v:HTMLVideoElement, t:number){
    return new Promise<void>(res=>{
      if(Math.abs(v.currentTime-t)<0.02 && v.readyState>=2){ res(); return }
      const done=()=>{ v.removeEventListener('seeked',done); clearTimeout(to); res() }
      const to = window.setTimeout(done,700)
      v.addEventListener('seeked',done)
      try{ v.currentTime = t }catch{ done() }
    })
  }

  /** Posiciona e confere; se o navegador não chegou lá (comum no iOS), tenta de novo. */
  private async seek(v:HTMLVideoElement, t:number){
    for(let i=0;i<3;i++){
      await this.seekOnce(v,t)
      if(Math.abs(v.currentTime-t)<0.25) return
    }
  }

  private frame(v:HTMLVideoElement){
    return new Promise<void>(res=>{
      const anyV = v as HTMLVideoElement & { requestVideoFrameCallback?:(cb:()=>void)=>number }
      if(anyV.requestVideoFrameCallback){
        let done=false
        anyV.requestVideoFrameCallback(()=>{ done=true; res() })
        window.setTimeout(()=>{ if(!done) res() },250)
      } else window.setTimeout(res,70)
    })
  }

  private otherOf(file:VideoFileId){
    const [a,b] = this.bufs[file]
    return this.active===a ? b : a
  }

  /**
   * Novo elemento entra por cima e vai ficando opaco; o antigo só some quando o novo já cobre tudo.
   * Assim a imagem nunca escurece no meio do fade.
   */
  private show(next:HTMLVideoElement, diff:number, instant=false){
    const prev = this.active
    const ms = instant || matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : diff>2.2 ? 260 : 180
    next.style.zIndex = String(++this.z)
    next.style.transition = 'none'
    next.style.opacity = ms===0 ? '1' : '0'
    if(ms>0){
      void next.offsetWidth
      next.style.transition = `opacity ${ms}ms linear`
      next.style.opacity = '1'
    }
    this.active = next
    this.activeFile = (this.bufs.neutral.includes(next) ? 'neutral' : 'reaction')
    if(prev && prev!==next){
      const id = window.setTimeout(()=>{
        if(this.active!==prev){ prev.style.transition='none'; prev.style.opacity='0'; prev.pause() }
      }, ms+50)
      this.timers.push(id)
    }
  }

  /** Escolhe, entre candidatos [quadro, diferença], o melhor: emenda discreta e momento pouco visto. */
  private choose(file:VideoFileId, cands:[number,number][], lo:number, hi:number){
    const ok = cands.filter(([f])=>timeOf(f)>=lo && timeOf(f)<=hi)
    if(!ok.length) return null
    let best = ok[0], bestScore = Infinity
    for(const c of ok){
      const score = c[1] - 2.2*coldness(file,timeOf(c[0])) + Math.random()*0.5
      if(score<bestScore){ bestScore = score; best = c }
    }
    return best
  }

  /** Planeja o fim do trecho contínuo que começa em t0 e para onde saltar depois. */
  private plan(state:VideoState, t0:number){
    const [lo,hi] = state.range
    const table = JUMPS[state.file]
    const minEnd = Math.min(hi-0.3, t0+state.run[0])
    const maxEnd = Math.min(hi-0.3, t0+state.run[1])
    let bestEnd = Math.max(minEnd,t0+0.8), next:{to:number;diff:number}|null = null, bestScore = Infinity
    for(let f=frameOf(minEnd); f<=frameOf(Math.max(minEnd,maxEnd)); f++){
      const cands = table[f]
      if(!cands) continue
      const pick = this.choose(state.file,cands,lo,hi-Math.min(state.run[0],(hi-lo)*0.5))
      if(!pick) continue
      const score = pick[1] + Math.random()*0.4
      if(score<bestScore){ bestScore = score; bestEnd = timeOf(f); next = { to:timeOf(pick[0]), diff:pick[1] } }
    }
    if(!next){
      // sem opção boa: volta ao início do intervalo com fade um pouco mais longo
      bestEnd = Math.min(hi-0.15, Math.max(t0+1, maxEnd))
      next = { to:lo+rand(0,0.6), diff:4 }
    }
    markShown(state.file,t0,bestEnd)
    return { end:bestEnd, next }
  }

  /** Onde começar ao entrar num estado, em função do que está na tela agora. */
  private startFor(state:VideoState){
    const [sLo,sHi] = state.startRange ?? state.range
    if(this.active && this.activeFile){
      const table = state.file==='reaction' ? CROSS_TO_REACTION : CROSS_TO_NEUTRAL
      if(this.activeFile!==state.file){
        const cands = table[frameOf(this.active.currentTime)]
        const pick = cands && this.choose(state.file,cands,sLo,sHi)
        if(pick) return { t:timeOf(pick[0]), diff:pick[1] }
      } else {
        const cands = JUMPS[state.file][frameOf(this.active.currentTime)]
        const pick = cands && this.choose(state.file,cands,sLo,sHi)
        if(pick) return { t:timeOf(pick[0]), diff:pick[1] }
      }
    }
    return { t:rand(sLo,Math.min(sHi,sLo+1.5)), diff:3 }
  }

  private async enter(stateId:string, instant:boolean){
    const state = this.states[stateId]
    if(!state) return
    const my = ++this.token
    const w = this.warmed && this.warmed.stateId===stateId ? this.warmed : null
    this.warmed = null
    const start = w ? { t:w.t, diff:w.diff } : this.startFor(state)
    const next = w ? w.el : this.otherOfForEnter(state.file)
    next.pause()
    await this.seek(next,start.t)
    if(this.destroyed || my!==this.token) return
    try{ await next.play() }catch{ /* iOS em economia de bateria: fica no quadro parado */ }
    await this.frame(next)
    if(this.destroyed || my!==this.token) return
    const { end, next:jump } = this.plan(state,start.t)
    this.run = { state, end, next:jump, prepared:null, committing:false }
    this.show(next,start.diff,instant)
  }

  private otherOfForEnter(file:VideoFileId){
    // no mesmo arquivo usa o elemento que está escondido; em outro arquivo, o primeiro que não está visível
    const [a,b] = this.bufs[file]
    if(this.active===a) return b
    if(this.active===b) return a
    return a
  }

  private tick = () => {
    if(this.destroyed) return
    this.raf = requestAnimationFrame(this.tick)
    const r = this.run, v = this.active
    if(!r || !v || this.frozen || v.paused) return
    const remaining = r.end - v.currentTime
    if(!r.prepared && r.next && remaining<=PREPARE_AHEAD){
      const el = this.otherOf(r.state.file)
      el.pause()
      el.currentTime = r.next.to
      r.prepared = { el, to:r.next.to, diff:r.next.diff }
    }
    if(remaining<=COMMIT_AHEAD && !r.committing && r.prepared){
      r.committing = true
      const p = r.prepared, run = r
      if(Math.abs(p.el.currentTime-p.to)>0.3) p.el.currentTime = p.to
      p.el.play().catch(()=>{})
      this.frame(p.el).then(()=>{
        if(this.destroyed || this.run!==run) return
        const plan = this.plan(run.state,p.to)
        this.show(p.el,p.diff)
        run.end = plan.end
        run.next = plan.next
        run.prepared = null
        run.committing = false
      })
    }
    // rede de segurança: chegou ao fim físico do arquivo sem salto preparado
    if(v.ended && !r.committing){ r.committing = true; v.pause() }
  }
}
