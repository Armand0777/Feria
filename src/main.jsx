import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import RankingTV from './pages/RankingTV.jsx'

// La pantalla del televisor vive en /ranking-tv y no comparte estado con el juego
const Raiz = window.location.pathname === '/ranking-tv' ? RankingTV : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Raiz />
  </StrictMode>,
)
