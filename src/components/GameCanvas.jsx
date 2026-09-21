import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { EndlessRunner } from '../games/endlessrunner'
import { audio } from '../lib/audio'
import { crearReloj, pasosPendientes } from '../lib/pasoFijo'
import { observarResolucion } from '../lib/canvasHD'
import Icono from './Iconos'

const COLORES_PARTICULAS = ['#6366f1', '#22d3ee', '#a855f7']

// Tamaño lógico del mundo (el canvas real puede tener más píxeles)
const ANCHO = 700
const ALTO = 320

const TEXTO_INICIO = {
  teclado: 'PRESIONA ESPACIO O CLIC PARA INICIAR',
  mano: 'CIERRA EL PUÑO ✊ PARA INICIAR',
  cara: 'ABRE LA BOCA 😮 PARA INICIAR',
}

const TECLAS_SALTO = ['Space', 'ArrowUp', 'KeyW']

export default function GameCanvas({
  ref,
  config,
  onGameOver,
  intento,
  mejorPuntaje,
  onReintentar,
  onSalir,
}) {
  const canvasRef = useRef(null)
  const particulasCanvasRef = useRef(null)
  const juegoRef = useRef(null)
  const animFrameRef = useRef(null)
  const tickRef = useRef(null)
  const relojRef = useRef(crearReloj())
  const gameOverEnviadoRef = useRef(false)
  const pausadoRef = useRef(false)
  // Mejor puntaje de la sesión ANTES de esta partida: App lo actualiza en
  // cuanto llega el game over, así que hay que leerlo en ese instante
  const mejorPuntajeRef = useRef(mejorPuntaje)

  const [terminado, setTerminado] = useState(false)
  const [iniciado, setIniciado] = useState(false)
  const [pausado, setPausado] = useState(false)
  const [sonido, setSonido] = useState(audio.habilitado)
  const [mensajeVisible, setMensajeVisible] = useState(true)
  const [puntajeFinal, setPuntajeFinal] = useState(0)
  const [esRecord, setEsRecord] = useState(false)

  useEffect(() => {
    mejorPuntajeRef.current = mejorPuntaje
  }, [mejorPuntaje])

  useEffect(() => {
    const canvas = canvasRef.current
    const juego = new EndlessRunner(canvas, config, config.modoInicial, { ancho: ANCHO, alto: ALTO })
    juego.corriendo = false
    juegoRef.current = juego
    gameOverEnviadoRef.current = false
    pausadoRef.current = false
    setTerminado(false)
    setIniciado(false)
    setPausado(false)
    relojRef.current = crearReloj()

    const tick = (ahora) => {
      const j = juegoRef.current
      const pasos = pasosPendientes(relojRef.current, ahora)
      if (!pausadoRef.current) {
        for (let i = 0; i < pasos; i++) j.actualizar()
      }
      j.dibujar()

      if (j.terminado) {
        if (!gameOverEnviadoRef.current) {
          gameOverEnviadoRef.current = true
          const mejorAnterior = mejorPuntajeRef.current
          setPuntajeFinal(j.puntaje)
          // Récord = superar tu mejor partida anterior de esta sesión (en la
          // primera partida no hay nada que superar)
          setEsRecord(mejorAnterior > 0 && j.puntaje > mejorAnterior)
          onGameOver(j.puntaje)
          // Esperamos a que se vea la explosión de partículas antes de
          // mostrar la pantalla de reintentar
          setTimeout(() => setTerminado(true), 1000)
        }

        if (j.framesMuerte < 60) {
          animFrameRef.current = requestAnimationFrame(tick)
        }
        return
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    tickRef.current = tick
    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [config])

  // Resolución nítida. Al cambiar de tamaño el canvas se borra: se redibuja
  // al instante por si el bucle está detenido (game over)
  useEffect(() => observarResolucion(canvasRef.current, () => juegoRef.current?.dibujar()), [])

  useEffect(() => {
    if (iniciado || terminado) return
    const id = setInterval(() => setMensajeVisible((v) => !v), 600)
    return () => clearInterval(id)
  }, [iniciado, terminado])

  useEffect(() => {
    if (!terminado) return
    const canvas = particulasCanvasRef.current
    const ctx = canvas.getContext('2d')

    const particulas = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 50,
      vy: 0.5 + Math.random() * 1.5,
      size: 2 + Math.random() * 3,
      color: COLORES_PARTICULAS[Math.floor(Math.random() * COLORES_PARTICULAS.length)],
    }))

    let raf
    const animar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particulas) {
        p.y -= p.vy
        if (p.y < -10) p.y = canvas.height + 10
        ctx.globalAlpha = 0.6
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
      raf = requestAnimationFrame(animar)
    }
    raf = requestAnimationFrame(animar)

    return () => cancelAnimationFrame(raf)
  }, [terminado])

  const onPresionar = () => {
    const juego = juegoRef.current
    if (!juego || juego.terminado || pausadoRef.current) return

    if (!juego.corriendo) setIniciado(true)
    juego.iniciarPresion()
  }

  const onSoltar = () => {
    const juego = juegoRef.current
    if (!juego || juego.terminado) return
    juego.soltarPresion()
  }

  // Solo se puede pausar una partida en curso. `valor` fuerza el estado
  // (p. ej. pausar al cambiar de pestaña); sin él, alterna.
  const cambiarPausa = (valor) => {
    const juego = juegoRef.current
    if (!juego || !juego.corriendo || juego.terminado) return
    const nuevo = valor ?? !pausadoRef.current
    if (nuevo === pausadoRef.current) return

    pausadoRef.current = nuevo
    setPausado(nuevo)
    if (nuevo) {
      juego.soltarPresion()
      audio.pausarMusica()
    } else {
      // Sin esto, al volver se simularía de golpe todo el tiempo en pausa
      relojRef.current = crearReloj()
      audio.reanudarMusica()
    }
  }

  const cambiarSonido = () => setSonido(audio.toggleMute())

  // Permite que otro control (la cámara con IA) presione y suelte igual
  // que el teclado o el clic
  useImperativeHandle(ref, () => ({ presionar: onPresionar, soltar: onSoltar }))

  // Los listeners se registran una vez; leen siempre la última versión de
  // las funciones a través de esta ref
  const accionesRef = useRef(null)
  useEffect(() => {
    accionesRef.current = { onPresionar, onSoltar, cambiarPausa, cambiarSonido }
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      const a = accionesRef.current
      if (TECLAS_SALTO.includes(e.code)) {
        e.preventDefault()
        a.onPresionar()
      } else if (e.code === 'KeyM') {
        a.cambiarSonido()
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        a.cambiarPausa()
      }
    }
    const handleKeyUp = (e) => {
      if (TECLAS_SALTO.includes(e.code)) accionesRef.current.onSoltar()
    }
    // Si el jugador cambia de pestaña o minimiza, la partida se pausa sola
    const handleVisibilidad = () => {
      if (document.hidden) accionesRef.current.cambiarPausa(true)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    document.addEventListener('visibilitychange', handleVisibilidad)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('visibilitychange', handleVisibilidad)
    }
  }, [])

  const reiniciarJuego = () => {
    const juego = juegoRef.current
    juego.reset()
    juego.corriendo = false
    gameOverEnviadoRef.current = false
    pausadoRef.current = false
    setTerminado(false)
    setIniciado(false)
    setPausado(false)
    setEsRecord(false)
    relojRef.current = crearReloj()
    animFrameRef.current = requestAnimationFrame(tickRef.current)
  }

  const manejarReintentar = () => {
    reiniciarJuego()
    onReintentar()
  }

  const enCurso = iniciado && !terminado

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          // Siempre en proporción 700:320 (antes se estiraba a lo alto en
          // celulares). Ocupa todo el ancho, salvo que la pantalla sea baja:
          // entonces se limita por el alto para que no haga falta scroll
          // (130px = barra superior + márgenes + barra de controles)
          width: 'min(100%, max(320px, calc((100dvh - 130px) * 700 / 320)))',
          aspectRatio: '700 / 320',
          background: '#0a0a1a',
          border: '1px solid #6366f1',
          boxShadow: '0 0 16px #6366f133',
          borderRadius: 12,
        }}
      >
        <style>{`
          @keyframes pulsoRecord {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
          .badge-record {
            animation: pulsoRecord 1s ease-in-out infinite;
          }
        `}</style>

        <canvas
          ref={canvasRef}
          width={ANCHO}
          height={ALTO}
          style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer', touchAction: 'none' }}
          onMouseDown={onPresionar}
          onMouseUp={onSoltar}
          onTouchStart={(e) => {
            e.preventDefault()
            onPresionar()
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            onSoltar()
          }}
        />

        {!iniciado && !terminado && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#22d3ee',
                textShadow: '0 0 10px #22d3eeaa',
                opacity: mensajeVisible ? 1 : 0,
              }}
            >
              {TEXTO_INICIO[config.control] ?? TEXTO_INICIO.teclado}
            </p>
          </div>
        )}

        {pausado && !terminado && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'rgba(10, 10, 26, 0.8)' }}
          >
            <p
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: 'clamp(22px, 6vw, 36px)',
                color: '#22d3ee',
                textShadow: '0 0 16px #22d3ee88',
                letterSpacing: '.1em',
              }}
            >
              PAUSA
            </p>
            <button
              onClick={() => cambiarPausa(false)}
              className="btn-primary flex items-center gap-2"
              style={{ padding: '10px 24px' }}
            >
              <Icono nombre="play" /> CONTINUAR
            </button>
            <p className="font-mono text-xs text-gray-400">P o Esc para seguir</p>
          </div>
        )}

        {terminado && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 sm:gap-2"
            style={{ background: 'rgba(10, 10, 26, 0.92)' }}
          >
            <canvas
              ref={particulasCanvasRef}
              width={700}
              height={320}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            />

            <p
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: 'clamp(20px, 6vw, 36px)',
                color: '#ef4444',
                textShadow: '0 0 20px #ef444488',
                zIndex: 1,
              }}
            >
              GAME OVER
            </p>

            <p
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: 'clamp(28px, 9vw, 52px)',
                color: 'white',
                textShadow: '0 0 16px #ffffffaa',
                zIndex: 1,
              }}
            >
              {puntajeFinal}
              <span className="font-mono text-xs font-normal text-gray-400" style={{ textShadow: 'none' }}>
                {' '}
                pts
              </span>
            </p>

            {esRecord && (
              <span
                className="badge-record font-mono text-xs font-bold"
                style={{ color: '#fbbf24', zIndex: 1 }}
              >
                ¡NUEVO RÉCORD!
              </span>
            )}

            <div className="mt-2 flex flex-wrap justify-center gap-3 px-4" style={{ zIndex: 1 }}>
              <button
                onClick={manejarReintentar}
                className="font-mono font-bold text-white"
                style={{
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: 8,
                  padding: 'clamp(8px,3vw,12px) clamp(16px,5vw,28px)',
                  cursor: 'pointer',
                }}
              >
                ↺ REINTENTAR
              </button>
              <button
                onClick={onSalir}
                className="font-mono font-bold text-white"
                style={{
                  background: 'transparent',
                  border: '1px solid #475569',
                  borderRadius: 8,
                  padding: 'clamp(8px,3vw,12px) clamp(16px,5vw,28px)',
                  cursor: 'pointer',
                }}
              >
                ✕ SALIR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra de controles: botones visibles para quien juega con el dedo
          (en el celular no hay teclas P ni M) */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
          INTENTO #{Math.max(intento, 1)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => cambiarPausa()}
            disabled={!enCurso}
            className="btn-secondary flex items-center gap-2"
            style={{ padding: '6px 12px', opacity: enCurso ? 1 : 0.4, cursor: enCurso ? 'pointer' : 'default' }}
            title="Pausa (P)"
          >
            <Icono nombre={pausado ? 'play' : 'pausa'} tamano={14} />
            {pausado ? 'Seguir' : 'Pausa'}
          </button>
          <button
            onClick={cambiarSonido}
            className="btn-secondary flex items-center gap-2"
            style={{ padding: '6px 12px' }}
            title="Sonido (M)"
          >
            <Icono nombre={sonido ? 'volumen' : 'silencio'} tamano={14} />
            {sonido ? 'Sonido' : 'Silencio'}
          </button>
        </div>
      </div>

      <p className="aviso-girar">↻ Gira el teléfono para jugar en grande</p>
    </div>
  )
}
