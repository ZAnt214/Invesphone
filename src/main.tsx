import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './shell.css'
import { applyQuality } from './characters/quality'
import { fitSafeArea } from './safeArea'
import { installTapSound } from './tapSound'

applyQuality()
if((navigator as Navigator & { standalone?:boolean }).standalone || window.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches) document.documentElement.classList.add('standalone')
fitSafeArea()
installTapSound()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
