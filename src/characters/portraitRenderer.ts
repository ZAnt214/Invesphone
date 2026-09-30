import type { CharacterDef, Expression, ExpressionAsset, EyeRig, Viseme } from './types'
import { EXPRESSIONS } from './expressions'
import type { ExpressionParams } from './expressions'
import { sampleMouth } from './mouth'
import type { MouthKey } from './mouth'

type Rgb = [number, number, number]
const rgb = (c:Rgb, k=1) => `rgb(${Math.round(c[0]*k)},${Math.round(c[1]*k)},${Math.round(c[2]*k)})`
const rand = (a:number,b:number) => a + Math.random()*(b-a)
const clamp = (v:number,a:number,b:number) => Math.max(a,Math.min(b,v))

function loadImage(src:string){
  return new Promise<HTMLImageElement>((res,rej)=>{
    const img = new Image()
    img.decoding = 'async'
    img.onload = ()=>res(img)
    img.onerror = ()=>rej(new Error(`Não foi possível carregar ${src}`))
    img.src = src
  })
}

type Loaded = {
  asset:ExpressionAsset
  img:HTMLImageElement
  /** cores amostradas da própria imagem */
  skin:Rgb
  lash:Rgb
  inner:Rgb
  /** formas de boca na cor de pele desta imagem, com borda suave */
  visemes?:Partial<Record<Viseme,HTMLCanvasElement>>
}

const FADE_SECONDS = .22

/**
 * Desenha o retrato oficial num canvas e o anima: respiração, deriva de câmera, troca suave entre as
 * imagens de expressão, piscar e boca sincronizada com a fala. Não desenha rosto novo:
 * pálpebra e boca são recortes e cores da própria imagem.
 */
export class PortraitRenderer {
  private ctx:CanvasRenderingContext2D
  private loaded:Partial<Record<Expression,Loaded>> = {}
  private bg:Rgb = [20,26,28]
  private raf = 0
  private last = 0
  private destroyed = false
  private calm:boolean
  private cur:ExpressionParams = {...EXPRESSIONS.neutral}
  private tgt:ExpressionParams = {...EXPRESSIONS.neutral}
  private blink = { next:0, start:-1 }
  private mouth = 0
  private vis:Record<Viseme,number> = { A:0, E:0, I:0, O:0, U:0, M:0 }
  private atlas:HTMLImageElement|null = null
  private shapeAmount = 0
  private speech:{ keys:MouthKey[]; start:number; duration:number }|null = null
  private shown:Loaded|null = null
  private prev:Loaded|null = null
  private fade = 1
  private expression:Expression = 'neutral'

  constructor(private canvas:HTMLCanvasElement, private def:CharacterDef){
    this.ctx = canvas.getContext('2d')!
    this.calm = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  }

  async start(){
    if(this.def.visemes){
      try{ this.atlas = await loadImage(this.def.visemes.src) }catch{ /* fala com o lábio de baixo */ }
    }
    const entries = Object.entries(this.def.assets) as [Expression,ExpressionAsset][]
    await Promise.all(entries.map(async([k,asset])=>{
      try{
        const img = await loadImage(asset.src)
        this.loaded[k] = this.prepare(asset,img)
      }catch{ /* a expressão sem imagem usa a neutra */ }
    }))
    if(this.destroyed || !this.loaded.neutral) return
    const c = document.createElement('canvas'); c.width = 6; c.height = 6
    const cx = c.getContext('2d')!
    cx.drawImage(this.loaded.neutral.img,8,8,6,6,0,0,6,6)
    const d = cx.getImageData(0,0,6,6).data
    let r=0,g=0,b=0
    for(let i=0;i<d.length;i+=4){ r+=d[i]; g+=d[i+1]; b+=d[i+2] }
    this.bg = [r/36,g/36,b/36]
    this.shown = this.pick(this.expression)
    this.last = performance.now()
    this.blink.next = this.last + 1800
    this.loop(this.last)
  }

  destroy(){ this.destroyed = true; cancelAnimationFrame(this.raf) }

  setExpression(e:Expression){
    this.expression = e
    this.tgt = {...(EXPRESSIONS[e] ?? EXPRESSIONS.neutral)}
    const next = this.pick(e)
    if(next && next!==this.shown){
      this.prev = this.shown
      this.shown = next
      this.fade = this.calm || !this.prev ? 1 : 0
    }
  }

  setSpeech(keys:MouthKey[]|null, duration=0){
    this.speech = keys ? { keys, start:performance.now(), duration } : null
  }

  resize(cssWidth:number){
    const crop = this.def.portrait.crop
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    this.canvas.width = Math.round(cssWidth*dpr)
    this.canvas.height = Math.round(cssWidth*dpr*crop.h/crop.w)
  }

  // ---------- preparação a partir do próprio arquivo ----------

  private pick(e:Expression){ return this.loaded[e] ?? this.loaded.neutral ?? null }

  private prepare(asset:ExpressionAsset, img:HTMLImageElement):Loaded{
    const c = document.createElement('canvas')
    c.width = img.naturalWidth; c.height = img.naturalHeight
    const cx = c.getContext('2d', { willReadFrequently:true })!
    cx.drawImage(img,0,0)
    const avg = (x:number,y:number,r=2):Rgb=>{
      const d = cx.getImageData(Math.round(x-r),Math.round(y-r),r*2+1,r*2+1).data
      let R=0,G=0,B=0,n=0
      for(let i=0;i<d.length;i+=4){ R+=d[i]; G+=d[i+1]; B+=d[i+2]; n++ }
      return [R/n,G/n,B/n]
    }
    // pele: bochecha esquerda; interior da boca: junto ao canto; cílios: ponto mais escuro do olho
    const [mx,my] = asset.align.eyeMid
    const dist = asset.eyes.right.cx-asset.eyes.left.cx
    const skin = avg(mx-dist*.52,my+dist*.71,3)
    const m = asset.mouth
    const inner = avg(m.cx-m.halfWidth*.6,m.rimY,1)
    const e = asset.eyes.left
    const d = cx.getImageData(Math.round(e.cx-e.rx),Math.round(e.cy-e.ry),e.rx*2,e.ry*2).data
    let best = 9999, lash:Rgb = [50,35,30]
    for(let i=0;i<d.length;i+=4){
      const l = d[i]+d[i+1]+d[i+2]
      if(l<best){ best = l; lash = [d[i],d[i+1],d[i+2]] }
    }
    return { asset, img, skin, lash, inner, visemes:this.tintVisemes(skin) }
  }

  /** Recorta cada forma de boca, ajusta a cor da pele à da imagem e suaviza a borda. */
  private tintVisemes(target:Rgb){
    const vd = this.def.visemes
    if(!vd || !this.atlas) return undefined
    const out:Partial<Record<Viseme,HTMLCanvasElement>> = {}
    vd.order.forEach((v,i)=>{
      const c = document.createElement('canvas'); c.width = vd.cellW; c.height = vd.cellH
      const cx = c.getContext('2d', { willReadFrequently:true })!
      cx.drawImage(this.atlas!,i*vd.cellW,0,vd.cellW,vd.cellH,0,0,vd.cellW,vd.cellH)
      // pele da forma de boca: faixa acima da boca
      const s = cx.getImageData(Math.round(vd.center[0]-20),3,40,4).data
      let R=0,G=0,B=0,n=0
      for(let k=0;k<s.length;k+=4){ R+=s[k]; G+=s[k+1]; B+=s[k+2]; n++ }
      const gain = [target[0]/(R/n),target[1]/(G/n),target[2]/(B/n)]
      const id = cx.getImageData(0,0,vd.cellW,vd.cellH)
      for(let k=0;k<id.data.length;k+=4){
        id.data[k] = Math.min(255,id.data[k]*gain[0])
        id.data[k+1] = Math.min(255,id.data[k+1]*gain[1])
        id.data[k+2] = Math.min(255,id.data[k+2]*gain[2])
      }
      cx.putImageData(id,0,0)
      // borda suave em elipse, longe dos cantos escuros do queixo
      cx.globalCompositeOperation = 'destination-in'
      cx.save()
      cx.translate(vd.center[0],vd.center[1]); cx.scale(1,24/64)
      const g = cx.createRadialGradient(0,0,64*.6,0,0,64)
      g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)')
      cx.fillStyle = g; cx.fillRect(-64,-64,128,128)
      cx.restore()
      out[v] = c
    })
    return out
  }

  // ---------- animação ----------

  private loop = (now:number)=>{
    if(this.destroyed) return
    this.raf = requestAnimationFrame(this.loop)
    if(document.hidden || !this.shown) return
    const dt = Math.min(.05,(now-this.last)/1000)
    this.last = now
    this.update(now,dt)
    this.draw(now)
  }

  private update(now:number, dt:number){
    const k = 1-Math.exp(-dt*5)
    const keys = Object.keys(this.cur) as (keyof ExpressionParams)[]
    for(const key of keys) this.cur[key] += (this.tgt[key]-this.cur[key])*k
    if(this.fade<1) this.fade = Math.min(1,this.fade+dt/FADE_SECONDS)

    if(this.blink.start<0 && now>=this.blink.next) this.blink.start = now
    if(this.blink.start>=0 && now-this.blink.start>170){
      this.blink.start = -1
      this.blink.next = now + rand(2300,5200)/Math.max(.3,this.cur.blinkRate)
    }

    let target = this.cur.mouthRest
    let shape:Viseme|null = null
    const sp = this.speech
    if(sp){
      const e = now-sp.start
      if(e>=sp.duration) this.speech = null
      else {
        const s = sampleMouth(sp.keys,e)
        shape = s.v
        target = Math.max(target,s.v==='M' ? 0 : s.a*(s.v==='I'||s.v==='U' ? .6 : 1))
        this.shapeAmount = s.a
      }
    }
    const km = 1-Math.exp(-dt*(target>this.mouth?30:20))
    this.mouth += (target-this.mouth)*km
    // peso de cada forma de boca, suavizado
    const kv = 1-Math.exp(-dt*24)
    for(const v of Object.keys(this.vis) as Viseme[]){
      const goal = shape===v ? this.shapeAmount : 0
      this.vis[v] += (goal-this.vis[v])*kv
    }
  }

  /** Tamanho do rosto em relação à arte de referência (olhos a 73 px), para escalar movimentos em pixels. */
  private unit(){
    const e = this.def.assets.neutral.eyes
    return (e.right.cx-e.left.cx)/73
  }

  private blinkAmount(now:number){
    if(this.blink.start<0) return 0
    const p = (now-this.blink.start)/170
    return p<.4 ? p/.4 : 1-(p-.4)/.6
  }

  private draw(now:number){
    const { ctx, canvas, def } = this
    const crop = def.portrait.crop
    const k = canvas.width/crop.w
    ctx.setTransform(k,0,0,k,-crop.x*k,-crop.y*k)
    ctx.globalAlpha = 1
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = rgb(this.bg)
    ctx.fillRect(crop.x-40,crop.y-40,crop.w+80,crop.h+80)

    // câmera: respiração e deriva lenta; o corpo afunda quando cansada e treme quando nervosa
    const t = now/1000
    const calm = this.calm
    const breath = calm ? 0 : Math.sin(t*2*Math.PI/4.6)
    const u = this.unit()
    const drift = calm ? 0 : Math.sin(t*.31)*.8*u
    const trem = calm ? 0 : this.cur.tremor*(Math.sin(t*37)*.6+Math.sin(t*23.3)*.4)*.7*u
    const pivotX = crop.x+crop.w/2, pivotY = crop.y+crop.h*.45
    const scale = 1.04 + breath*.002 - Math.min(0,this.cur.slump)*.0016
    ctx.save()
    ctx.translate(pivotX,pivotY)
    ctx.scale(scale,scale)
    ctx.translate(-pivotX+drift+trem,-pivotY+(breath+Math.max(0,this.cur.slump)+this.mouth*.5)*u)

    if(this.prev && this.fade<1) this.drawAsset(this.prev,now,1)
    if(this.shown) this.drawAsset(this.shown,now,this.prev ? this.fade : 1)
    ctx.restore()
  }

  /** Imagem de uma expressão alinhada ao retrato neutro, com boca e piscar por cima. */
  private drawAsset(l:Loaded, now:number, alpha:number){
    const { ctx, def } = this
    const { asset, img } = l
    const [rx,ry] = def.portrait.eyeMid
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(rx,ry)
    ctx.scale(asset.align.scale,asset.align.scale)
    ctx.translate(-asset.align.eyeMid[0],-asset.align.eyeMid[1])
    ctx.drawImage(img,0,0,img.naturalWidth,img.naturalHeight)
    this.drawMouth(l)
    this.drawLids(l,now)
    ctx.restore()
  }

  private drawLids(l:Loaded, now:number){
    const amount = clamp(this.blinkAmount(now),0,1)
    if(amount<.03) return
    const { ctx } = this
    const eyes:EyeRig[] = [l.asset.eyes.left,l.asset.eyes.right]
    for(const e of eyes){
      const top = e.cy-e.ry-1
      const edge = top + amount*(e.ry*2+2)
      const bulge = 1.6*amount*this.unit()
      ctx.save()
      ctx.beginPath(); ctx.ellipse(e.cx,e.cy,e.rx+1,e.ry+1,0,0,Math.PI*2); ctx.clip()
      ctx.fillStyle = rgb(l.skin)
      ctx.beginPath()
      ctx.moveTo(e.cx-e.rx-2,top-3); ctx.lineTo(e.cx+e.rx+2,top-3); ctx.lineTo(e.cx+e.rx+2,edge)
      ctx.quadraticCurveTo(e.cx,edge+bulge*2,e.cx-e.rx-2,edge)
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = rgb(l.lash); ctx.lineWidth = 1.5*this.unit(); ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(e.cx-e.rx,edge); ctx.quadraticCurveTo(e.cx,edge+bulge*2,e.cx+e.rx,edge); ctx.stroke()
      ctx.restore()
    }
  }

  /** Boca falando: formas de boca oficiais sobre a da expressão; sem elas, o lábio de baixo desce em tiras. */
  private drawMouth(l:Loaded){
    const vd = this.def.visemes
    if(vd && l.visemes){
      const m = l.asset.mouth
      const s = (m.halfWidth*2)/vd.lipWidth
      const { ctx } = this
      for(const v of vd.order){
        const w = this.vis[v]
        const sprite = l.visemes[v]
        if(w<.02 || !sprite) continue
        ctx.save()
        ctx.globalAlpha *= clamp(w,0,1)
        ctx.translate(m.cx,m.rimY)
        ctx.scale(s,s)
        ctx.translate(-vd.center[0],-vd.center[1])
        ctx.drawImage(sprite,0,0)
        ctx.restore()
      }
      return
    }
    this.drawMouthStrips(l)
  }

  /** A parte de baixo da boca desce em tiras, mais no meio do que nos cantos. */
  private drawMouthStrips(l:Loaded){
    const open = this.mouth
    if(open<.02) return
    const { ctx } = this
    const m = l.asset.mouth
    const d = open*m.maxOpen
    const w = 1.3*this.unit()
    const x0 = Math.floor(m.cx-m.halfWidth-1), x1 = Math.ceil(m.cx+m.halfWidth+1)
    const step = w
    for(let x=x0;x<x1;x+=step){
      const u = clamp((x+.5-m.cx)/m.halfWidth,-1,1)
      const edge = Math.pow(1-u*u,.7)
      const rim = m.rimY-m.arch*(1-u*u)
      const s = d*edge
      if(s<.2) continue
      const top = Math.round(rim)
      ctx.fillStyle = rgb(l.inner,.7)
      ctx.fillRect(x,top,w,s+.8)
      ctx.drawImage(l.img,x,top,w,m.bottom-top,x,top+s,w,m.bottom-top)
    }
  }
}
