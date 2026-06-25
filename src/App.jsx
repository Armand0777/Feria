import { useState } from 'react'
import configInicial from './config'
import { supabase } from './lib/supabase'
import GameCanvas from './components/GameCanvas'
import ConfigPanel from './components/ConfigPanel'
import GameSelector from './components/GameSelector'
import ResultadoFinal from './components/ResultadoFinal'
import VersusSelector from './components/VersusSelector'
import VersusCanvas from './components/VersusCanvas'
import ResultadoVersus from './pages/ResultadoVersus'
import Ranking from './components/Ranking'
import RankingTV from './pages/RankingTV'

function App() {
  // Si la URL contiene /ranking-tv, mostrar solo esa pantalla
  if (window.location.pathname === '/ranking-tv') {
    return <RankingTV />
  }

  const [config, setConfig] = useState(configInicial)
  const [pantalla, setPantalla] = useState('configurar')
  const [intento, setIntento] = useState(0)
  const [mejorPuntaje, setMejorPuntaje] = useState(0)
  const [ultimoPuntaje, setUltimoPuntaje] = useState(0)
  const [puntajeGuardado, setPuntajeGuardado] = useState(false)
  const [configVersusJ1, setConfigVersusJ1] = useState(null)
  const [configVersusJ2, setConfigVersusJ2] = useState(null)
  const [resultadoVersus, setResultadoVersus] = useState(null)

  const guardarPuntaje = async (puntaje) => {
    const { error } = await supabase.from('puntajes').insert({
      nombre: config.jugador.nombre,
      color: config.jugador.color,
      puntaje,
      juego: 'geo-runner',
    })
    if (error) {
      console.error(error)
      return
    }
    setPuntajeGuardado(true)
  }

  const iniciarPartida = () => {
    setIntento((i) => i + 1)
    setPantalla('jugar')
  }

  const onGameOver = (puntaje) => {
    setUltimoPuntaje(puntaje)
    setMejorPuntaje((prev) => Math.max(prev, puntaje))
  }

  const onReintentar = () => {
    setIntento((i) => i + 1)
  }

  const onSalir = () => {
    if (!puntajeGuardado && mejorPuntaje > 0) {
      guardarPuntaje(mejorPuntaje)
    }
    setPantalla('resultado')
  }

  const onJugarDeNuevo = () => {
    setIntento(0)
    setPuntajeGuardado(false)
    setPantalla('jugar')
  }

  const onCambiarConfig = () => {
    setIntento(0)
    setMejorPuntaje(0)
    setUltimoPuntaje(0)
    setPuntajeGuardado(false)
    setPantalla('configurar')
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a1a' }}>
      {/* Barra superior */}
      <div
        className="flex items-center justify-between px-4"
        style={{ height: 40, background: '#0f172a', borderBottom: '1px solid #1e293b' }}
      >
        <span className="font-mono text-xs font-bold" style={{ color: '#6366f1' }}>
          GEO RUNNER
        </span>
        <span className="text-xs text-gray-400">{config.jugador.nombre}</span>
        <span className="font-mono text-xs" style={{ color: mejorPuntaje > 0 ? '#fbbf24' : '#475569' }}>
          {mejorPuntaje > 0 ? `MEJOR: ${mejorPuntaje}` : '—'}
        </span>
      </div>

      <div className="px-4 py-8 text-white">
        {pantalla === 'configurar' && (
          <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <ConfigPanel config={config} onConfigChange={setConfig} />
            <GameSelector
              config={config}
              onStart={iniciarPartida}
              onVersus={() => setPantalla('versus-config')}
            />
          </div>
        )}

        {pantalla === 'jugar' && (
          <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <div className="flex w-full min-w-0 justify-center">
              <GameCanvas
                config={config}
                onGameOver={onGameOver}
                intento={intento}
                mejorPuntaje={mejorPuntaje}
                onReintentar={onReintentar}
                onSalir={onSalir}
              />
            </div>
            <Ranking />
          </div>
        )}

        {pantalla === 'resultado' && (
          <div className="flex w-full flex-col items-center gap-8">
            <ResultadoFinal
              config={config}
              puntaje={ultimoPuntaje}
              intentos={intento}
              mejorPuntaje={mejorPuntaje}
              puntajeGuardado={puntajeGuardado}
              onGuardarPuntaje={() => setPuntajeGuardado(true)}
              onJugarDeNuevo={onJugarDeNuevo}
              onCambiarConfig={onCambiarConfig}
            />
            <Ranking />
          </div>
        )}

        {pantalla === 'versus-config' && (
          <VersusSelector
            onIniciar={(cj1, cj2) => {
              setConfigVersusJ1(cj1)
              setConfigVersusJ2(cj2)
              setPantalla('versus-jugar')
            }}
            onVolver={() => setPantalla('configurar')}
          />
        )}

        {pantalla === 'versus-jugar' && (
          <div className="flex w-full min-w-0 justify-center">
            <VersusCanvas
              configJ1={configVersusJ1}
              configJ2={configVersusJ2}
              onVersusEnd={(res) => {
                setResultadoVersus({
                  ...res,
                  nombreJ1: configVersusJ1.jugador.nombre,
                  nombreJ2: configVersusJ2.jugador.nombre,
                  colorJ1: configVersusJ1.jugador.color,
                  colorJ2: configVersusJ2.jugador.color,
                })
                setPantalla('versus-resultado')
              }}
            />
          </div>
        )}

        {pantalla === 'versus-resultado' && (
          <div className="flex w-full flex-col items-center">
            <ResultadoVersus
              resultado={resultadoVersus}
              onRevancha={() => setPantalla('versus-jugar')}
              onMenuPrincipal={() => setPantalla('configurar')}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
