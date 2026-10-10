/* Quadro do caso na sala da equipe da base: o mesmo save único, montado por cima da cena. */
import { createRoot, type Root } from 'react-dom/client'
import CaseBoard from '../board/CaseBoard'
import { LEMOS_BACK } from '../board/boardData'
import { fetchAssets } from '../preload/loader'
import { boardArt } from '../preload/caseAssets'

let root:Root|null=null
let lemos:Promise<unknown>|null=null

const loadImg=(src:string)=>new Promise<void>(res=>{const i=new Image();i.onload=i.onerror=()=>res();i.src=src})

export function openBoard(host:HTMLElement,o:{found:string[];onClose:()=>void;onDeposition:(id:string)=>void;onTeam:(id:string)=>void;onSummoned:(id:string)=>void}){
  if(root)root.unmount()
  const r=root=createRoot(host)
  const close=(then?:()=>void)=>{r.unmount();if(root===r)root=null;o.onClose();then?.()}
  // abre na hora; a entrada de cinema fica parada no primeiro quadro (sala escura) até o Lemos estar pronto
  lemos??=LEMOS_BACK?loadImg(LEMOS_BACK):Promise.resolve()
  void fetchAssets(boardArt())
  r.render(<CaseBoard found={o.found} artReady={lemos} onClose={()=>close()} onDeposition={id=>close(()=>o.onDeposition(id))} onTeam={id=>close(()=>o.onTeam(id))} onSummoned={o.onSummoned}/>)
}
