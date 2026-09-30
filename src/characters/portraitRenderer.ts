import type { CharacterDef, Expression, EyeRig, FaceRig } from './types'
import { EXPRESSIONS, PARAM_KEYS } from './expressions'
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

type Sprites = { browL:HTMLCanvasElement; browR:HTMLCanvasElement; browLSkin:HTMLCanvasElement; browRSkin:HTMLCanvasElement; irisL:HTMLCanvasElement; irisR:HTMLCanvasElement }
type Colors = { skin:Rgb; sclera:Rgb; lash:Rgb; inner:Rgb }

/**
 * Desenha o retrato oficial num canvas e o anima por recortes do próprio arquivo:
 * respiração, piscar, olhar, sobrancelhas, boca sincronizada com a fala.
 * Não desenha rosto novo: só move e recorta o que já está no arquivo.
 */
export class PortraitRenderer {
  private ctx:CanvasRenderingContext2D
  private img:HTMLImageElement|null = null
  private expressionImgs:Partial<Record<Expression,HTMLImageElement>> = {}
  private sprites:Sprites|null = null
  private colors:Colors|null = null
  private raf = 0
  private last = 0
  private destroyed = false
  private calm:boolean
  private cur:ExpressionParams = {...EXPRESSIONS.neutral}
  private tgt:ExpressionParams = {...EXPRESSIONS.neutral}
  private blink = { next:0, start:-1 }
  private gaze = { x:0, y:0, tx:0, ty:0, next:0 }
  private mouth = 0
  private speech:{ keys:MouthKey[]; start:number; duration:number }|null = null
  private expression:Expression = 'neutral'
  private shownAsset:Expression|null = null

  constructor(private canvas:HTMLCanvasElement, private def:CharacterDef){
    this.ctx = canvas.getContext('2d')!
    this.calm = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  }

  async start(){
    const p = this.def.portrait
    this.img = await loadImage(p.src)
    await Promise.all((Object.entries(this.def.expressionAssets ?? {}) as [Expression,string][]).map(async([k,src])=>{
      try{ this.expressionImgs[k] = await loadImage(src) }catch{ /* fica no retrato neutro */ }
    }))
    if(this.destroyed) return
    if(this.def.rig) this.prepareRig(this.img,this.def.rig)
    this.last = performance.now()
    this.blink.next = this.last + 1800
    this.loop(this.last)
  }

  destroy(){ this.destroyed = true; cancelAnimationFrame(this.raf) }

  setExpression(e:Expression){
    this.expression = e
    this.tgt = {...(EXPRESSIONS[e] ?? EXPRESSIONS.neutral)}
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

  private prepareRig(img:HTMLImageElement, rig:FaceRig){
    const src = document.createElement('canvas')
    src.width = img.naturalWidth; src.height = img.naturalHeight
    const sctx = src.getContext('2d', { willReadFrequently:true })!
    sctx.drawImage(img,0,0)
    const avg = ([x,y]:[number,number]):Rgb=>{
      const d = sctx.getImageData(x-2,y-2,5,5).data
      let r=0,g=0,b=0,n=0
      for(let i=0;i<d.length;i+=4){ r+=d[i]; g+=d[i+1]; b+=d[i+2]; n++ }
      return [r/n,g/n,b/n]
    }
    const colors:Colors = {
      skin:avg(rig.samples.skin), sclera:avg(rig.samples.sclera),
      lash:avg(rig.samples.lash), inner:avg(rig.samples.mouthInner)
    }
    this.colors = colors

    const browSprite = (b:{x:number;y:number;w:number;h:number})=>{
      const c = document.createElement('canvas'); c.width = b.w; c.height = b.h
      const cx = c.getContext('2d')!
      cx.drawImage(src,b.x,b.y,b.w,b.h,0,0,b.w,b.h)
      const id = cx.getImageData(0,0,b.w,b.h)
      for(let i=0;i<id.data.length;i+=4){
        const dr=id.data[i]-colors.skin[0], dg=id.data[i+1]-colors.skin[1], db=id.data[i+2]-colors.skin[2]
        const d = Math.sqrt(dr*dr+dg*dg+db*db)
        const px = (i/4)%b.w, py = Math.floor(i/4/b.w)
        // borda suave: a ponta da sobrancelha encosta no cabelo, então o recorte não pode ter quina
        const edge = clamp(Math.min(px,b.w-1-px,py,b.h-1-py)/2.5,0,1)
        id.data[i+3] = Math.round(255*clamp((d-26)/48,0,1)*edge)
      }
      cx.putImageData(id,0,0)
      return c
    }
    const irisSprite = (e:EyeRig)=>{
      const r = e.iris, s = Math.ceil(r*2+4)
      const c = document.createElement('canvas'); c.width = s; c.height = s
      const cx = c.getContext('2d')!
      cx.drawImage(src,e.cx-s/2,e.cy-s/2,s,s,0,0,s,s)
      cx.globalCompositeOperation = 'destination-in'
      const g = cx.createRadialGradient(s/2,s/2,r*.82,s/2,s/2,r)
      g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)')
      cx.fillStyle = g; cx.fillRect(0,0,s,s)
      return c
    }
    // silhueta da sobrancelha na cor da pele, para apagar a original sem deixar retângulo
    const skinOf = (s:HTMLCanvasElement)=>{
      const c = document.createElement('canvas'); c.width = s.width; c.height = s.height
      const cx = c.getContext('2d')!
      cx.drawImage(s,0,0)
      cx.globalCompositeOperation = 'source-in'
      cx.fillStyle = rgb(colors.skin); cx.fillRect(0,0,c.width,c.height)
      return c
    }
    const bl = browSprite(rig.brows.left), br = browSprite(rig.brows.right)
    this.sprites = {
      browL:bl, browR:br, browLSkin:skinOf(bl), browRSkin:skinOf(br),
      irisL:irisSprite(rig.eyes.left), irisR:irisSprite(rig.eyes.right)
    }
  }

  // ---------- animação ----------

  private loop = (now:number)=>{
    if(this.destroyed) return
    this.raf = requestAnimationFrame(this.loop)
    if(document.hidden || !this.img) return
    const dt = Math.min(.05,(now-this.last)/1000)
    this.last = now
    this.update(now,dt)
    this.draw(now)
  }

  private update(now:number, dt:number){
    const k = 1-Math.exp(-dt*5)
    for(const key of PARAM_KEYS) this.cur[key] += (this.tgt[key]-this.cur[key])*k

    // piscar
    if(this.blink.start<0 && now>=this.blink.next) this.blink.start = now
    if(this.blink.start>=0 && now-this.blink.start>170){
      this.blink.start = -1
      this.blink.next = now + rand(2300,5200)/Math.max(.3,this.cur.blinkRate)
    }

    // olhar: pequenos movimentos de sempre, e mais largos quando nervosa
    if(now>=this.gaze.next){
      const dart = this.calm ? 0 : this.cur.dart
      this.gaze.tx = this.cur.gazeX + rand(-1,1)*(1.2+dart)
      this.gaze.ty = this.cur.gazeY + rand(-.6,.6)*(1+dart*.5)
      this.gaze.next = now + (dart>3 ? rand(380,900) : rand(900,2400))
    }
    const kg = 1-Math.exp(-dt*(this.cur.dart>3?16:9))
    this.gaze.x += (this.gaze.tx-this.gaze.x)*kg
    this.gaze.y += (this.gaze.ty-this.gaze.y)*kg

    // boca
    let target = this.cur.mouthRest
    const sp = this.speech
    if(sp){
      const e = now-sp.start
      if(e>=sp.duration) this.speech = null
      else target = Math.max(target,sampleMouth(sp.keys,e))
    }
    const km = 1-Math.exp(-dt*(target>this.mouth?30:20))
    this.mouth += (target-this.mouth)*km
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
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#141616'
    ctx.fillRect(crop.x,crop.y,crop.w,crop.h)

    // câmera: respiração e deriva lenta; o corpo afunda quando cansada
    const t = now/1000
    const calm = this.calm
    const breath = calm ? 0 : Math.sin(t*2*Math.PI/4.6)
    const drift = calm ? 0 : Math.sin(t*.31)*1.4
    const trem = calm ? 0 : this.cur.tremor*(Math.sin(t*37)*.6+Math.sin(t*23.3)*.4)*1.1
    const pivotX = crop.x+crop.w/2, pivotY = crop.y+crop.h*.45
    const scale = 1.035 + breath*.0025 - Math.min(0,this.cur.slump)*.0016
    const dx = drift + trem
    const dy = breath*1.7 + Math.max(0,this.cur.slump)*1.4 + this.mouth*.8
    ctx.save()
    ctx.translate(pivotX,pivotY)
    ctx.scale(scale,scale)
    ctx.translate(-pivotX+dx,-pivotY+dy)

    const asset = this.expressionImgs[this.expression]
    this.shownAsset = asset ? this.expression : null
    ctx.drawImage(asset ?? this.img!,0,0,def.portrait.width,def.portrait.height)
    if(!asset && def.rig && this.sprites && this.colors) this.drawFace(def.rig,this.sprites,this.colors,now)

    ctx.restore()
  }

  private drawFace(rig:FaceRig, sp:Sprites, col:Colors, now:number){
    const { ctx } = this
    const c = this.cur
    const lid = clamp(Math.max(c.lid,this.blinkAmount(now)),0,1)
    const eyes:[EyeRig,HTMLCanvasElement][] = [[rig.eyes.left,sp.irisL],[rig.eyes.right,sp.irisR]]

    // olhar
    if(Math.abs(this.gaze.x)+Math.abs(this.gaze.y)>.5){
      for(const [e,iris] of eyes){
        ctx.save()
        ctx.beginPath(); ctx.ellipse(e.cx,e.cy,e.rx-3,e.ry-5,0,0,Math.PI*2); ctx.clip()
        ctx.fillStyle = rgb(col.sclera); ctx.fillRect(e.cx-e.rx,e.cy-e.ry,e.rx*2,e.ry*2)
        const gx = clamp(this.gaze.x,-e.rx*.38,e.rx*.38), gy = clamp(this.gaze.y,-e.ry*.25,e.ry*.25)
        ctx.drawImage(iris,e.cx-iris.width/2+gx,e.cy-iris.height/2+gy)
        ctx.restore()
      }
    }

    // pálpebras: pele da própria personagem, com a linha de cílios na borda
    if(lid>.02){
      for(const [e] of eyes){
        const top = e.cy-e.ry-2
        const edge = top + lid*(e.ry*2+4)
        const bulge = 3.2*lid
        ctx.save()
        ctx.beginPath(); ctx.ellipse(e.cx,e.cy,e.rx+1.5,e.ry+1.5,0,0,Math.PI*2); ctx.clip()
        ctx.fillStyle = rgb(col.skin)
        ctx.beginPath()
        ctx.moveTo(e.cx-e.rx-3,top-4); ctx.lineTo(e.cx+e.rx+3,top-4); ctx.lineTo(e.cx+e.rx+3,edge)
        ctx.quadraticCurveTo(e.cx,edge+bulge*2,e.cx-e.rx-3,edge)
        ctx.closePath(); ctx.fill()
        ctx.strokeStyle = rgb(col.lash); ctx.lineWidth = 2.6; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(e.cx-e.rx-1,edge); ctx.quadraticCurveTo(e.cx,edge+bulge*2,e.cx+e.rx+1,edge); ctx.stroke()
        ctx.restore()
      }
    }

    // sobrancelhas: apaga com a cor da pele e desenha o recorte da sobrancelha movido
    const emphasis = this.mouth>.7 ? -1.2 : 0
    const dy = c.browDy+emphasis
    if(Math.abs(dy)>.25 || Math.abs(c.browTilt)>.25){
      const brows:[typeof rig.brows.left,HTMLCanvasElement,HTMLCanvasElement,number][] = [
        [rig.brows.left,sp.browL,sp.browLSkin,-c.browTilt],
        [rig.brows.right,sp.browR,sp.browRSkin,c.browTilt]
      ]
      brows.forEach(([b,,skin],i)=>{
        // a ponta externa fica no lugar, então o apagado não avança para ela
        const from = i===0 ? 0 : -2, to = i===0 ? 2 : 0
        for(let ox=from;ox<=to;ox+=1) for(let oy=-2;oy<=2;oy+=1) ctx.drawImage(skin,b.x+ox,b.y+oy)
      })
      // gira em torno da ponta externa: a parte interna sobe e a ponta quase não sai do lugar
      brows.forEach(([b,sprite,,tilt],i)=>{
        const outerX = i===0 ? b.x+2 : b.x+b.w-2
        const angle = tilt*.6 + (i===0 ? 1 : -1)*dy*.6
        ctx.save()
        ctx.translate(outerX,b.y+b.h/2+dy*.4)
        ctx.rotate(angle*Math.PI/180)
        ctx.drawImage(sprite,b.x-outerX,-b.h/2)
        ctx.restore()
      })
    }

    // boca: a parte de baixo desce em tiras, mais no meio do que nos cantos
    const m = rig.mouth
    const open = this.mouth
    if(open>.02){
      const d = open*m.maxOpen
      const img = this.img!
      const x0 = Math.floor(m.cx-m.halfWidth-1), x1 = Math.ceil(m.cx+m.halfWidth+1)
      for(let x=x0;x<x1;x+=2){
        const u = clamp((x+1-m.cx)/m.halfWidth,-1,1)
        const edge = Math.pow(1-u*u,.7)
        const rim = m.rimY-m.arch*(1-u*u)
        const s = d*edge
        if(s<.3) continue
        const top = Math.round(rim)
        ctx.fillStyle = rgb(col.inner,.62)
        ctx.fillRect(x,top,2.4,s+1)
        ctx.drawImage(img,x,top,2.4,m.bottom-top,x,top+s,2.4,m.bottom-top)
      }
    }
  }
}
