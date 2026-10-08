/* Sala de depoimentos da base: o mesmo depoimento ilustrado do Invesphone, montado por cima da cena e gravando no save único. */
import { createRoot, type Root } from 'react-dom/client'
import IllustratedInterrogation from '../interrogation/IllustratedInterrogation'
import { interrogations } from '../interrogation/registry'
import { clues } from '../case01'
import { teamMaterialRequests, DEFAULT_DISCOVERED } from '../team/teamData'
import { readCase, writeCase } from '../case/caseSave'
import { progressOf, withProgress } from '../case/depositions'

let root:Root|null=null

export function openDeposition(host:HTMLElement,id:string,onClose:()=>void){
  const cfg=interrogations[id];if(!cfg)return
  if(root)root.unmount()
  root=createRoot(host)
  const close=()=>{root?.unmount();root=null;onClose()}
  const render=()=>{
    const g=readCase()
    root?.render(<IllustratedInterrogation key={id} config={cfg} progress={progressOf(g,id)}
      onProgress={p=>{writeCase(x=>withProgress(x,id,p));render()}}
      onClue={cid=>{writeCase(x=>x.clues.includes(cid)?x:{...x,clues:[...x.clues,cid]});render()}}
      onPersonDiscovered={pid=>{writeCase(x=>{const known=x.discoveredPeople??DEFAULT_DISCOVERED;return known.includes(pid)?x:{...x,discoveredPeople:[...known,pid]}});render()}}
      clueTitle={cid=>clues.find(c=>c.id===cid)?.title}
      registeredClues={g.clues} registeredMaterials={g.requestedMaterials??[]}
      materialTitle={mid=>teamMaterialRequests.find(r=>r.id===mid)?.label}
      onComplete={()=>{writeCase(x=>x.interviewed.includes(id)?x:{...x,interviewed:[...x.interviewed,id]});render()}}
      onBack={close} onReturn={close}/>)
  }
  render()
}
