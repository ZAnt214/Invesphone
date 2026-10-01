import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './shell.css'
import { applyQuality } from './characters/quality'
import { fitSafeArea } from './safeArea'

applyQuality()
fitSafeArea()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
