/* Quadro do caso na sala da equipe da base: o mesmo save único, montado por cima da cena.
   Para abrir sem espera, a base monta o quadro escondido quando o Lemos vai até ele ou chega perto (prepareBoard);
   ao chegar, openBoard só mostra o que já está montado e começa a entrada. */
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import CaseBoard, { prewarmBoard } from '../board/CaseBoard'
import { LEMOS_BACK } from '../board/boardData'
import { readCase } from '../case/caseSave'

type Opts={found:string[];onShown?:()=>void;onClose:()=>void;onDeposition:(id:string)=>void;onTeam:(id:string)=>void;onSummoned:(id:string)=>void}
let root:Root|null=null,live=false,snap=''

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

// o quadro montado de antemão só vale se o caso não mudou desde então
const stamp=(o:Opts)=>JSON.stringify(readCase())+'|'+o.found.join()
function render(o:Opts){
  const r=root!
  const close=(then?:()=>void)=>{r.unmount();if(root===r){root=null;live=false};o.onClose();then?.()}
  r.render(<CaseBoard live={live} found={o.found} onShown={o.onShown} onClose={()=>close()} onDeposition={id=>close(()=>o.onDeposition(id))} onTeam={id=>close(()=>o.onTeam(id))} onSummoned={o.onSummoned}/>)
}

/** monta escondido (sem entrada, som nem save) */
export function prepareBoard(host:HTMLElement,o:Opts){
  if(root)return
  void prewarm()
  root=createRoot(host);live=false;snap=stamp(o);render(o)
}
/** desmonta o que foi preparado e não chegou a abrir */
export function discardBoard(){if(root&&!live){root.unmount();root=null}}

export function openBoard(host:HTMLElement,o:Opts){
  if(root&&(live||snap!==stamp(o))){root.unmount();root=null}
  if(!root)root=createRoot(host)
  live=true;void prewarm()
  // aplica na hora: o quadro aparece (onShown) no mesmo quadro em que a entrada começa
  flushSync(()=>render(o))
}
