/* Quadro do caso na sala da equipe da base: o mesmo save único, montado por cima da cena. */
import { createRoot, type Root } from 'react-dom/client'
import CaseBoard, { prewarmBoard } from '../board/CaseBoard'
import { LEMOS_BACK } from '../board/boardData'

let root:Root|null=null

// o Lemos de costas fica decodificado na memória: a entrada de cinema começa com ele já na tela
let lemos:HTMLImageElement|null=null
let warm:Promise<void>|null=null
/** Prepara a abertura (imagem do Lemos decodificada, cortiça e parede desenhadas). A base chama no cartão de abertura. */
export function prewarm(){
  return warm??=(async()=>{
    if(LEMOS_BACK&&!lemos){lemos=new Image();lemos.src=LEMOS_BACK;await lemos.decode().catch(()=>undefined)}
    await prewarmBoard()
  })()
}

export function openBoard(host:HTMLElement,o:{found:string[];onShown?:()=>void;onClose:()=>void;onDeposition:(id:string)=>void;onTeam:(id:string)=>void;onSummoned:(id:string)=>void}){
  if(root)root.unmount()
  const r=root=createRoot(host)
  const close=(then?:()=>void)=>{r.unmount();if(root===r)root=null;o.onClose();then?.()}
  void prewarm()
  r.render(<CaseBoard found={o.found} onShown={o.onShown} onClose={()=>close()} onDeposition={id=>close(()=>o.onDeposition(id))} onTeam={id=>close(()=>o.onTeam(id))} onSummoned={o.onSummoned}/>)
}
