import { Maximize, Minimize } from 'lucide-react'
import { useEffect, useState } from 'react'
import { canFullscreen, enterFullscreen, exitFullscreen, isFullscreen, isStandalone, onFullscreenChange } from './fullscreen'
import './quality-picker.css'

/** Força o jogo em tela cheia no navegador; onde isso não existe (iPhone), explica como instalar. */
export default function FullscreenSetting(){
  const [full,setFull] = useState(isFullscreen)
  const [failed,setFailed] = useState(false)
  useEffect(()=>onFullscreenChange(()=>setFull(isFullscreen())),[])

  if(isStandalone()) return (
    <div className="qp fs">
      <div className="qp-row"><small>TELA CHEIA</small></div>
      <p>O jogo já está aberto como app, sem as barras do navegador.</p>
    </div>
  )

  if(!canFullscreen()) return (
    <div className="qp fs">
      <div className="qp-row"><small>TELA CHEIA</small></div>
      <p>O Safari do iPhone não deixa um site entrar em tela cheia por botão. Para jogar sem as barras: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>, e abra o ícone <b>Arquivo Morto</b>.</p>
    </div>
  )

  return (
    <div className="qp fs">
      <div className="qp-row">
        <small>TELA CHEIA</small>
        <button className="fs-btn" onClick={async()=>{ if(full) await exitFullscreen(); else setFailed(!(await enterFullscreen())) }}>
          {full ? <><Minimize/> Sair</> : <><Maximize/> Entrar</>}
        </button>
      </div>
      <p>{failed ? 'Seu navegador não permitiu. Tente de novo ou use "Adicionar à tela inicial" no menu.' : 'Esconde as barras do navegador e trava o jogo em pé.'}</p>
    </div>
  )
}
