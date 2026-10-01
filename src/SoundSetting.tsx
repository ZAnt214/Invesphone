import { Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { sfx, sfxEnabled, setSfxEnabled } from './sfx'
import './quality-picker.css'

/** Liga e desliga os efeitos sonoros e a vibração do depoimento. */
export default function SoundSetting(){
  const [on,setOn] = useState(sfxEnabled)
  return (
    <div className="qp fs">
      <div className="qp-row">
        <small>SONS E VIBRAÇÃO</small>
        <button className="fs-btn" onClick={()=>{ const n=!on; setSfxEnabled(n); setOn(n); if(n) sfx.clue() }}>
          {on ? <><Volume2/> Ligado</> : <><VolumeX/> Desligado</>}
        </button>
      </div>
      <p>Efeitos discretos no depoimento: gravador, pistas anotadas e pressão sobre o interrogado.</p>
    </div>
  )
}
