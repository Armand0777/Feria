import { useRef, useState } from 'react'
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
import TicTacToeSelector from './components/TicTacToeSelector'
import TicTacToe from './components/TicTacToe'
import PanelCamara from './components/PanelCamara'

function App() {
  const [config, setConfig] = useState(configInicial)
  // Presionar/soltar del GameCanvas, para que la cámara con IA controle el juego
  const controlJuegoRef = useRef(null)
  const [pantalla, setPantalla] = useState('configurar')
  const [intento, setIntento] = useState(0)
  const [mejorPuntaje, setMejorPuntaje] = useState(0)
  const [ultimoPuntaje, setUltimoPuntaje] = useState(0)
  const [sumaPuntajes, setSumaPuntajes] = useState(0)
  // Una sesión (de "Jugar" a "Salir") guarda UN solo puntaje: su mejor partida.
  // pendiente → guardando → guardado | error
  const [estadoGuardado, setEstadoGuardado] = useState('pendiente')
  const [configVersusJ1, setConfigVersusJ1] = useState(null)
  const [configVersusJ2, setConfigVersusJ2] = useState(null)
  const [resultadoVersus, setResultadoVersus] = useState(null)
  const [modoTicTacToe, setModoTicTacToe] = useState(null)

  const guardarPuntaje = async (puntaje) => {
    setEstadoGuardado('guardando')
    const { error } = await supabase.from('puntajes').insert({
      nombre: config.jugador.nombre.trim() || 'Anónimo',
      color: config.jugador.color,
      puntaje,
      juego: 'geo-runner',
    })
    if (error) {
      console.error(error)
      setEstadoGuardado('error')
      return
    }
    setEstadoGuardado('guardado')
  }

  const reiniciarSesion = () => {
    setIntento(0)
    setMejorPuntaje(0)
    setUltimoPuntaje(0)
    setSumaPuntajes(0)
    setEstadoGuardado('pendiente')
  }

  const iniciarPartida = () => {
    setIntento((i) => i + 1)
    setPantalla('jugar')
  }

  const onGameOver = (puntaje) => {
    setUltimoPuntaje(puntaje)
    setMejorPuntaje((prev) => Math.max(prev, puntaje))
    setSumaPuntajes((s) => s + puntaje)
  }

  const onReintentar = () => {
    setIntento((i) => i + 1)
  }

  const onSalir = () => {
    if (estadoGuardado === 'pendiente' && mejorPuntaje > 0) {
      guardarPuntaje(mejorPuntaje)
    }
    setPantalla('resultado')
  }

  const onJugarDeNuevo = () => {
    reiniciarSesion()
    iniciarPartida()
  }

  const onCambiarConfig = () => {
    reiniciarSesion()
    setPantalla('configurar')
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a1a' }}>
      {/* Barra superior */}
      <header className="topbar">
        <span className="topbar-logo">GEO RUNNER</span>
        <span className="topbar-center">{config.jugador.nombre}</span>
        <span className="topbar-right" style={{ color: mejorPuntaje > 0 ? 'var(--gold)' : '#475569' }}>
          {mejorPuntaje > 0 ? `MEJOR ${mejorPuntaje}` : '—'}
        </span>
      </header>

      <div className="px-4 py-8 text-white">
        {pantalla === 'configurar' && (
          <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <ConfigPanel config={config} onConfigChange={setConfig} />
            {/* En el celular va primero: el título y el botón JUGAR se ven
                sin tener que bajar por toda la configuración */}
            <div className="order-first lg:order-none">
              <GameSelector
                config={config}
                onStart={iniciarPartida}
                onVersus={() => setPantalla('versus-config')}
                onTicTacToe={() => setPantalla('tictactoe-config')}
              />
            </div>
          </div>
        )}

        {pantalla === 'tictactoe-config' && (
          <TicTacToeSelector
            onIniciar={(modo) => {
              setModoTicTacToe(modo)
              setPantalla('tictactoe-jugar')
            }}
            onVolver={() => setPantalla('configurar')}
          />
        )}

        {pantalla === 'tictactoe-jugar' && (
          <TicTacToe modo={modoTicTacToe} onVolver={() => setPantalla('configurar')} />
        )}

        {pantalla === 'jugar' && (
          <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <div className="flex w-full min-w-0 justify-center">
              <GameCanvas
                ref={controlJuegoRef}
                config={config}
                onGameOver={onGameOver}
                intento={intento}
                mejorPuntaje={mejorPuntaje}
                onReintentar={onReintentar}
                onSalir={onSalir}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              {config.control && config.control !== 'teclado' && (
                <PanelCamara
                  key={config.control}
                  tipo={config.control}
                  onPresionar={() => controlJuegoRef.current?.presionar()}
                  onSoltar={() => controlJuegoRef.current?.soltar()}
                />
              )}
              <Ranking />
            </div>
          </div>
        )}

        {pantalla === 'resultado' && (
          <div className="mx-auto grid w-full max-w-5xl items-start gap-8 lg:grid-cols-2">
            <ResultadoFinal
              config={config}
              puntaje={ultimoPuntaje}
              intentos={intento}
              mejorPuntaje={mejorPuntaje}
              promedio={intento > 0 ? Math.round(sumaPuntajes / intento) : 0}
              estadoGuardado={estadoGuardado}
              onReintentarGuardado={() => guardarPuntaje(mejorPuntaje)}
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
