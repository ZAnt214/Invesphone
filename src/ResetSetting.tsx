import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import './quality-picker.css'

/** Recomeça o caso do zero (apaga o progresso salvo). Pede confirmação com um segundo toque. */
export default function ResetSetting({onReset}:{onReset:()=>void}){
  const [sure,setSure] = useState(false)
  return (
    <div className="qp fs">
      <div className="qp-row">
        <small>RECOMEÇAR O CASO</small>
        <button className="fs-btn" onClick={()=>{ if(sure) onReset(); else setSure(true) }}>
          <RotateCcw/> {sure ? 'Confirmar' : 'Recomeçar'}
        </button>
      </div>
      <p>{sure ? 'Toque em Confirmar para apagar todo o progresso: pistas, depoimentos e conversas da equipe.' : 'Apaga o progresso salvo e começa o caso desde a primeira ligação.'}</p>
    </div>
  )
}
