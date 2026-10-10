/* Quadro do caso na sala da equipe da base: o mesmo save único, montado por cima da cena. */
import { createRoot, type Root } from 'react-dom/client'
import CaseBoard, { LEMOS_BACK, WALL_IMGS } from '../board/CaseBoard'

let root:Root|null=null

const loadImg=(src:string)=>new Promise<void>(res=>{const i=new Image();i.onload=i.onerror=()=>res();i.src=src})
let lemos:Promise<void>|null=null,art:Promise<unknown>|null=null
/** Baixa antes o que a entrada do quadro mostra (o Lemos de costas, a parede do fundo e as fontes),
 *  para a primeira abertura não esperar a rede. A base chama isto quando fica ociosa. */
export function preloadBoard(){
  lemos??=LEMOS_BACK?loadImg(LEMOS_BACK):Promise.resolve()
  art??=Promise.all([lemos,...WALL_IMGS.map(loadImg),
    ...["400 20px 'Permanent Marker'","400 20px 'Special Elite'","700 20px Caveat"].map(f=>document.fonts?.load(f).catch(()=>undefined))])
  return art
}

export function openBoard(host:HTMLElement,o:{found:string[];onClose:()=>void;onDeposition:(id:string)=>void;onTeam:(id:string)=>void;onSummoned:(id:string)=>void}){
  if(root)root.unmount()
  const r=root=createRoot(host)
  const close=(then?:()=>void)=>{r.unmount();if(root===r)root=null;o.onClose();then?.()}
  preloadBoard()
  // a entrada de cinema começa com o Lemos na tela: espera a imagem dele (no máximo um instante, se a rede estiver lenta)
  let shown=false
  const show=()=>{if(shown||root!==r)return;shown=true
    r.render(<CaseBoard found={o.found} onClose={()=>close()} onDeposition={id=>close(()=>o.onDeposition(id))} onTeam={id=>close(()=>o.onTeam(id))} onSummoned={o.onSummoned}/>)}
  lemos!.then(show);window.setTimeout(show,1500)
}
