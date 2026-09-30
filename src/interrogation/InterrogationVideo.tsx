import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { VideoDirector } from './videoDirector'
import type { InterrogationConfig } from './types'

type Props = {
  config:InterrogationConfig
  onDirector:(d:VideoDirector|null)=>void
  children?:ReactNode
}

/**
 * Palco de vídeo: quatro <video> (dois por arquivo) empilhados, sem controles nativos.
 * O enquadramento corta a base do quadro, onde os arquivos trazem legenda/marca embutida.
 */
export default function InterrogationVideo({config,onDirector,children}:Props){
  const refs = useRef<(HTMLVideoElement|null)[]>([])
  const [failed,setFailed] = useState(false)

  useEffect(()=>{
    const v = refs.current
    if(v.some(x=>!x)) return
    const el = v as HTMLVideoElement[]
    const director = new VideoDirector(
      { neutral:[el[0],el[1]], reaction:[el[2],el[3]] },
      config.states,
      config.idleState
    )
    director.onFailure = ()=>setFailed(true)
    onDirector(director)
    director.start()
    return ()=>{ onDirector(null); director.destroy() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[config])

  const files = [config.files.neutral,config.files.neutral,config.files.reaction,config.files.reaction]
  return (
    <div className="iv-stage" role="img" aria-label={`Imagem da gravação do depoimento de ${config.name}`}>
      {!failed && files.map((src,i)=>(
        <video
          key={i}
          ref={node=>{ refs.current[i]=node }}
          className="iv-video"
          src={`${src}#t=0.001`}
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
          aria-hidden="true"
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
          style={{opacity:0}}
        />
      ))}
      {failed && <div className="iv-fallback">Gravação indisponível</div>}
      {children}
    </div>
  )
}
