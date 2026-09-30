import type { VideoFileId, VideoSegment, VideoState } from './types'

type Buffers = Record<VideoFileId, [HTMLVideoElement, HTMLVideoElement]>

type Run = {
  stateId:string
  state:VideoState
  seg:VideoSegment
  index:number          // posição na sequência (estados 'sequence')
  prepared:{ el:HTMLVideoElement; seg:VideoSegment; index:number }|null
  committing:boolean
}

const FADE_MS = 180        // crossfade curto entre trechos
const PREPARE_AHEAD = 0.5  // s antes do fim do trecho para já posicionar o próximo
const COMMIT_AHEAD = 0.07  // s antes do fim para começar o próximo

/**
 * Controla os dois arquivos de vídeo como estados visuais de uma personagem.
 * Cada arquivo tem dois elementos <video>; a emenda é feita trocando de elemento com um fade curto,
 * então o "recomeço" de um trecho nunca aparece como corte.
 */
export class VideoDirector {
  private active:HTMLVideoElement|null = null
  private run:Run|null = null
  private raf = 0
  private destroyed = false
  private frozen = false
  private token = 0
  private lastRandom = -1
  private fadeTimers:number[] = []
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
    this.fadeTimers.forEach(clearTimeout)
    document.removeEventListener('visibilitychange',this.onVisibility)
    for(const v of Object.values(this.bufs).flat()) v.pause()
  }

  /** Começa no estado parado. */
  async start(){
    await Promise.all(Object.values(this.bufs).flat().map(v=>this.ready(v)))
    if(this.destroyed) return
    await this.enter(this.idleId,true)
  }

  /** Troca para um estado (ex.: uma resposta). */
  play(stateId:string){
    this.frozen = false
    return this.enter(stateId,false)
  }

  /** Volta ao estado parado. */
  idle(){
    this.frozen = false
    return this.enter(this.idleId,false)
  }

  /** Segura o quadro atual. */
  freeze(){
    this.frozen = true
    this.token++
    this.active?.pause()
  }

  /** Tenta retomar (iOS pode exigir um toque do jogador depois de pausar em segundo plano). */
  resume(){
    if(this.frozen||!this.active) return
    if(this.active.paused) this.active.play().catch(()=>{})
  }

  private onVisibility = () => {
    if(document.hidden) this.active?.pause()
    else this.resume()
  }

  private ready(v:HTMLVideoElement){
    return new Promise<void>(res=>{
      if(v.readyState>=1){ res(); return }
      const done=()=>{ v.removeEventListener('loadedmetadata',done); clearTimeout(t); res() }
      const t = window.setTimeout(done,4000)
      v.addEventListener('loadedmetadata',done)
      v.load()
    })
  }

  private seek(v:HTMLVideoElement, t:number){
    return new Promise<void>(res=>{
      if(Math.abs(v.currentTime-t)<0.02 && v.readyState>=2){ res(); return }
      const done=()=>{ v.removeEventListener('seeked',done); clearTimeout(to); res() }
      const to = window.setTimeout(done,700)
      v.addEventListener('seeked',done)
      try{ v.currentTime = t }catch{ done() }
    })
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

  private show(next:HTMLVideoElement){
    const prev = this.active
    next.style.opacity = '1'
    this.active = next
    if(prev && prev!==next){
      prev.style.opacity = '0'
      const id = window.setTimeout(()=>{ if(this.active!==prev) prev.pause() }, FADE_MS+60)
      this.fadeTimers.push(id)
    }
  }

  private pick(state:VideoState, index:number):VideoSegment{
    if(state.kind==='random'){
      let i = Math.floor(Math.random()*state.segments.length)
      if(state.segments.length>1 && i===this.lastRandom) i = (i+1)%state.segments.length
      this.lastRandom = i
      return state.segments[i]
    }
    const last = state.sequence.length-1
    return state.sequence[Math.min(index,last)]
  }

  /** Entra num estado com crossfade. `instant` só é usado na primeira entrada. */
  private async enter(stateId:string, instant:boolean){
    const state = this.states[stateId]
    if(!state) return
    const my = ++this.token
    const seg = this.pick(state,0)
    const next = this.otherOf(state.file)
    next.pause()
    await this.seek(next,seg.start)
    if(this.destroyed || my!==this.token) return
    try{ await next.play() }catch{ /* iOS em modo de baixo consumo: fica no quadro parado */ }
    await this.frame(next)
    if(this.destroyed || my!==this.token) return
    this.run = { stateId, state, seg, index:0, prepared:null, committing:false }
    if(instant){ next.style.opacity='1'; this.active=next } else this.show(next)
  }

  private tick = () => {
    if(this.destroyed) return
    this.raf = requestAnimationFrame(this.tick)
    const r = this.run, v = this.active
    if(!r || !v || this.frozen || v.paused) return
    const remaining = r.seg.end - v.currentTime
    // 1) posiciona o próximo trecho no elemento que está escondido
    if(!r.prepared && remaining<=PREPARE_AHEAD){
      const nextIndex = r.index+1
      const st = r.state
      const finished = st.kind==='sequence' && !st.repeatLast && nextIndex>st.sequence.length-1
      if(!finished){
        const seg = this.pick(st,nextIndex)
        const el = this.otherOf(st.file)
        el.pause()
        el.currentTime = seg.start
        r.prepared = { el, seg, index:nextIndex }
      }
    }
    // 2) na hora, começa o próximo e faz o fade
    if(remaining<=COMMIT_AHEAD && !r.committing){
      r.committing = true
      if(r.prepared){
        const p = r.prepared
        const run = r
        p.el.play().catch(()=>{})
        this.frame(p.el).then(()=>{
          if(this.destroyed || this.run!==run) return
          this.show(p.el)
          run.seg = p.seg
          run.index = p.index
          run.prepared = null
          run.committing = false
        })
      } else {
        // sequência sem repetição chegou ao fim: segura o último quadro
        v.pause()
        this.frozen = true
      }
    }
    // rede de segurança: fim físico do arquivo
    if(v.ended && !r.committing){ r.committing = true; v.pause() }
  }
}
