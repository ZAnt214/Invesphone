/**
 * O fundo de cada imagem de expressão tem brilho e textura um pouco diferentes; ao trocar de expressão
 * isso aparece. Aqui o fundo é separado da figura e substituído por um fundo único (o da imagem neutra,
 * suavizado), igual em todas as expressões. A figura não é alterada.
 */

const THRESHOLD = 1.5
const CELL = 8

/** Região que a câmera mostra (com folga): o resto da imagem não precisa ser processado. */
export const ROI = { x0:40, x1:860, y1:860 }

/** 1 onde é fundo: região lisa ligada às bordas (topo e laterais), delimitada pelo contorno da figura. */
export function backgroundMask(src:Uint8ClampedArray, w:number, h:number):Uint8Array {
  const n = w*h
  const { x0, x1 } = ROI
  const y1 = Math.min(h,ROI.y1)
  // dois canais (brilho e matiz), desfocados 3x3, para o ruído do JPEG não quebrar a região
  const a = new Int16Array(n), b = new Int16Array(n)
  for(let y=0;y<y1;y++) for(let x=x0;x<x1;x++){
    const i = y*w+x
    a[i] = src[i*4]+src[i*4+1]+src[i*4+2]
    b[i] = (src[i*4+2]-src[i*4])*3
  }
  const ta = new Int16Array(n), tb = new Int16Array(n)
  for(let y=0;y<y1;y++) for(let x=x0+1;x<x1-1;x++){
    const i = y*w+x
    ta[i] = (a[i-1]+a[i]+a[i+1])/3; tb[i] = (b[i-1]+b[i]+b[i+1])/3
  }
  const ba = new Int16Array(n), bb = new Int16Array(n)
  for(let y=1;y<y1-1;y++) for(let x=x0+1;x<x1-1;x++){
    const i = y*w+x
    ba[i] = (ta[i-w]+ta[i]+ta[i+w])/3; bb[i] = (tb[i-w]+tb[i]+tb[i+w])/3
  }
  const low = new Uint8Array(n)
  // limiar do brilho soma 3 canais, por isso ×3
  const t = THRESHOLD*3
  for(let y=1;y<y1-2;y++) for(let x=x0+1;x<x1-2;x++){
    const i = y*w+x
    if(Math.abs(ba[i+1]-ba[i])<t && Math.abs(ba[i+w]-ba[i])<t && Math.abs(bb[i+1]-bb[i])<t && Math.abs(bb[i+w]-bb[i])<t) low[i] = 1
  }
  const mask = new Uint8Array(n)
  const stack = new Int32Array(n)
  let sp = 0
  const push = (i:number)=>{ if(low[i] && !mask[i]){ mask[i] = 1; stack[sp++] = i } }
  for(let x=x0;x<x1;x++) push(w+x)
  for(let y=1;y<y1*.6;y++){ push(y*w+x0+1); push(y*w+x1-3) }
  while(sp>0){
    const i = stack[--sp], x = i%w
    if(x>x0) push(i-1)
    if(x<x1-1) push(i+1)
    if(i>=w) push(i-w)
    if(i<n-w) push(i+w)
  }
  // a borda não processada conta como fundo
  for(let x=x0;x<x1;x++) mask[x] = mask[w+x]
  for(let y=0;y<y1;y++){ mask[y*w+x0] = mask[y*w+x0+1]; mask[y*w+x1-1] = mask[y*w+x1-2] }
  // abertura (tira filetes finos que vazam para dentro da roupa) e mais 1 px para cobrir o halo do contorno
  return dilate(dilate(erode(mask,w,y1),w,y1),w,y1)
}

function erode(m:Uint8Array, w:number, h:number){
  const o = new Uint8Array(m.length)
  for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
    const i = y*w+x
    o[i] = m[i]&m[i-1]&m[i+1]&m[i-w]&m[i+w]
  }
  // nas bordas da imagem o fundo continua fundo
  for(let x=0;x<w;x++){ o[x] = m[x]; o[(h-1)*w+x] = m[(h-1)*w+x] }
  for(let y=0;y<h;y++){ o[y*w] = m[y*w]; o[y*w+w-1] = m[y*w+w-1] }
  return o
}

function dilate(m:Uint8Array, w:number, h:number){
  const o = new Uint8Array(m.length)
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const i = y*w+x
    o[i] = m[i] | (x>0?m[i-1]:0) | (x<w-1?m[i+1]:0) | (y>0?m[i-w]:0) | (y<h-1?m[i+w]:0)
  }
  return o
}

/** Fundo único e liso: média do fundo da imagem neutra, com os buracos da figura preenchidos por difusão. */
export function buildPlate(src:Uint8ClampedArray, mask:Uint8Array, w:number, h:number):ImageData {
  const gw = Math.ceil(w/CELL), gh = Math.ceil(h/CELL)
  const sum = new Float32Array(gw*gh*3), cnt = new Float32Array(gw*gh)
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const i = y*w+x
    if(!mask[i]) continue
    const g = ((y/CELL)|0)*gw+((x/CELL)|0)
    cnt[g]++
    for(let c=0;c<3;c++) sum[g*3+c] += src[i*4+c]
  }
  const val = new Float32Array(gw*gh*3), known = new Uint8Array(gw*gh)
  let mean = [0,0,0], nk = 0
  for(let g=0;g<gw*gh;g++){
    if(cnt[g]>=CELL*CELL*.75){
      known[g] = 1; nk++
      for(let c=0;c<3;c++){ val[g*3+c] = sum[g*3+c]/cnt[g]; mean[c] += val[g*3+c] }
    }
  }
  mean = mean.map(v=>v/Math.max(1,nk))
  for(let g=0;g<gw*gh;g++) if(!known[g]) for(let c=0;c<3;c++) val[g*3+c] = mean[c]
  // difusão (Gauss-Seidel) só nas células desconhecidas
  for(let it=0;it<400;it++){
    for(let y=0;y<gh;y++) for(let x=0;x<gw;x++){
      const g = y*gw+x
      if(known[g]) continue
      const a = x>0?g-1:g, b = x<gw-1?g+1:g, u = y>0?g-gw:g, d = y<gh-1?g+gw:g
      for(let c=0;c<3;c++) val[g*3+c] = (val[a*3+c]+val[b*3+c]+val[u*3+c]+val[d*3+c])/4
    }
  }
  const small = document.createElement('canvas'); small.width = gw; small.height = gh
  const sx = small.getContext('2d')!
  const id = sx.createImageData(gw,gh)
  for(let g=0;g<gw*gh;g++){
    for(let c=0;c<3;c++) id.data[g*4+c] = val[g*3+c]
    id.data[g*4+3] = 255
  }
  sx.putImageData(id,0,0)
  const big = document.createElement('canvas'); big.width = w; big.height = h
  const bx = big.getContext('2d',{ willReadFrequently:true })!
  bx.imageSmoothingEnabled = true
  bx.imageSmoothingQuality = 'high'
  bx.drawImage(small,0,0,w,h)
  return bx.getImageData(0,0,w,h)
}

/** Troca o fundo da imagem pelo fundo único; a borda entra com 1 px de transição. */
export function applyPlate(c:HTMLCanvasElement, plate:ImageData, mask:Uint8Array){
  const w = c.width, h = c.height
  const cx = c.getContext('2d',{ willReadFrequently:true })!
  const id = cx.getImageData(0,0,w,h)
  const d = id.data, p = plate.data
  const y1 = Math.min(h,ROI.y1)
  for(let y=1;y<y1-1;y++) for(let x=ROI.x0+1;x<ROI.x1-1;x++){
    const i = y*w+x
    const m = mask[i]
    if(m===mask[i-1] && m===mask[i+1] && m===mask[i-w] && m===mask[i+w] && m===mask[i-w-1] && m===mask[i-w+1] && m===mask[i+w-1] && m===mask[i+w+1]){
      if(m){ d[i*4] = p[i*4]; d[i*4+1] = p[i*4+1]; d[i*4+2] = p[i*4+2] }
      continue
    }
    let s = 0, k = 0
    for(let dy=-1;dy<=1;dy++){
      const yy = y+dy
      if(yy<0||yy>=h) continue
      for(let dx=-1;dx<=1;dx++){
        const xx = x+dx
        if(xx<0||xx>=w) continue
        s += mask[yy*w+xx]; k++
      }
    }
    const a = s/k
    if(a<=0) continue
    for(let ch=0;ch<3;ch++) d[i*4+ch] = a*p[i*4+ch]+(1-a)*d[i*4+ch]
  }
  for(let x=ROI.x0;x<ROI.x1;x++) if(mask[x]){ d[x*4] = p[x*4]; d[x*4+1] = p[x*4+1]; d[x*4+2] = p[x*4+2] }
  cx.putImageData(id,0,0)
}
