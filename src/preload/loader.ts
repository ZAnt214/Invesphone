/**
 * Baixa arquivos do jogo para o cache do aparelho (Cache API, o mesmo que o service worker usa para as imagens).
 * Assim o que já veio abre na hora e continua disponível sem rede.
 *
 * - `fetchAssets` baixa uma lista agora (o essencial antes de entrar), com progresso.
 * - `queueAssets` põe na fila de fundo: um por vez, parando enquanto algo da frente baixa.
 * - `bumpAssets` passa arquivos para a frente da fila (ex.: alguém foi chamado para depor).
 * O que já está no cache não é baixado de novo.
 */
declare const __ART_CACHE__:string
/** nome do cache (o mesmo do service worker em vite.config.ts); muda quando alguma imagem do jogo muda */
export const ART_CACHE=__ART_CACHE__

const have=new Set<string>()
const running=new Map<string,Promise<boolean>>()
let cache:Promise<Cache|null>|null=null
const openCache=()=>cache??=('caches' in window?(async()=>{
  // caches de versões antigas das imagens saem para liberar espaço
  for(const k of await caches.keys().catch(()=>[] as string[]))if(k.startsWith('case-art')&&k!==ART_CACHE)void caches.delete(k)
  return caches.open(ART_CACHE)
})().catch(()=>null):Promise.resolve(null))

/** baixa um arquivo (se ainda não está no cache); devolve se ficou disponível */
export function fetchAsset(url:string):Promise<boolean>{
  if(have.has(url))return Promise.resolve(true)
  const cur=running.get(url);if(cur)return cur
  const p=(async()=>{
    const c=await openCache()
    if(c&&await c.match(url).catch(()=>undefined)){have.add(url);return true}
    try{
      const res=await fetch(url,{credentials:'same-origin'})
      if(!res.ok)return false
      if(c)await c.put(url,res.clone()).catch(()=>undefined)
      await res.blob()
      have.add(url);return true
    }catch{return false}
  })().finally(()=>running.delete(url))
  running.set(url,p);return p
}

/** baixa uma lista com até `par` ao mesmo tempo, avisando o progresso (feitos, total) */
export async function fetchAssets(urls:string[],onProgress?:(done:number,total:number)=>void,par=4):Promise<void>{
  const list=[...new Set(urls)];let i=0,done=0
  onProgress?.(0,list.length)
  // enquanto isto baixa, a fila de fundo espera
  fg++
  const worker=async()=>{while(i<list.length){const u=list[i++];await fetchAsset(u);onProgress?.(++done,list.length)}}
  try{await Promise.all(Array.from({length:Math.min(par,list.length)},worker))}finally{fg--;pump()}
}

/* fila de fundo */
const queue:string[]=[]
let active=0,fg=0
// um por vez e com folga entre um e outro: o fundo não pode atrasar o que o jogador abre
const PAR=1,GAP=250
const saveData=()=>!!(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData
function pump(){
  while(active<PAR&&!fg&&queue.length){
    const u=queue.shift()!
    if(have.has(u))continue
    active++
    fetchAsset(u).finally(()=>{active--;window.setTimeout(pump,GAP)})
  }
}
/** põe no fim da fila de fundo (respeita o modo de economia de dados do aparelho) */
export function queueAssets(urls:string[]){
  if(saveData())return
  for(const u of urls)if(!have.has(u)&&!queue.includes(u))queue.push(u)
  pump()
}
/** passa para a frente da fila */
export function bumpAssets(urls:string[]){
  const fresh=urls.filter(u=>!have.has(u))
  for(const u of fresh){const k=queue.indexOf(u);if(k>=0)queue.splice(k,1)}
  queue.unshift(...fresh);pump()
}
