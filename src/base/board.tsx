/* Quadro do caso na sala da equipe da base: o mesmo save único, montado por cima da cena. */
import { createRoot, type Root } from 'react-dom/client'
import CaseBoard from '../board/CaseBoard'

let root:Root|null=null

export function openBoard(host:HTMLElement,o:{found:string[];onClose:()=>void;onDeposition:(id:string)=>void;onTeam:(id:string)=>void;onSummoned:(id:string)=>void}){
  if(root)root.unmount()
  root=createRoot(host)
  const close=(then?:()=>void)=>{root?.unmount();root=null;o.onClose();then?.()}
  root.render(<CaseBoard found={o.found} onClose={()=>close()} onDeposition={id=>close(()=>o.onDeposition(id))} onTeam={id=>close(()=>o.onTeam(id))} onSummoned={o.onSummoned}/>)
}
