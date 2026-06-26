import { useEffect, useRef, useState } from 'react'
import { EndlessRunner } from '../games/endlessrunner'
import { audio } from '../lib/audio'

const COLORES_PARTICULAS = ['#6366f1', '#22d3ee', '#a855f7']

export default function GameCanvas({
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
  const gameOverEnviadoRef = useRef(false)

  const [terminado, setTerminado] = useState(false)
  const [iniciado, setIniciado] = useState(false)
  const [mensajeVisible, setMensajeVisible] = useState(true)
  const [puntajeFinal, setPuntajeFinal] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const juego = new EndlessRunner(canvas, config, config.modoInicial)
    juego.corriendo = false
    juegoRef.current = juego
    gameOverEnviadoRef.current = false
    setTerminado(false)
    setIniciado(false)

    const tick = () => {
      const j = juegoRef.current
      j.actualizar()
      j.dibujar()

      if (j.terminado) {
        if (!gameOverEnviadoRef.current) {
          gameOverEnviadoRef.current = true
          setPuntajeFinal(j.puntaje)
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
    if (!juego || juego.terminado) return

    if (!juego.corriendo) setIniciado(true)
    juego.iniciarPresion()
  }

  const onSoltar = () => {
    const juego = juegoRef.current
    if (!juego || juego.terminado) return
    juego.soltarPresion()
  }

  useEffect(() => {
    const TECLAS = ['Space', 'ArrowUp', 'KeyW']

    const handleKeyDown = (e) => {
      if (TECLAS.includes(e.code)) {
        e.preventDefault()
        onPresionar()
      } else if (e.code === 'KeyM') {
        audio.toggleMute()
      }
    }
    const handleKeyUp = (e) => {
      if (TECLAS.includes(e.code)) onSoltar()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const reiniciarJuego = () => {
    const juego = juegoRef.current
    juego.reset()
    juego.corriendo = false
    gameOverEnviadoRef.current = false
    setTerminado(false)
    setIniciado(false)
    animFrameRef.current = requestAnimationFrame(tickRef.current)
  }

  const manejarReintentar = () => {
    reiniciarJuego()
    onReintentar()
  }

  const esRecord = puntajeFinal > mejorPuntaje

  return (
    <div
      className="relative mx-auto w-full overflow-hidden"
      style={{
        aspectRatio: '700 / 320',
        minHeight: 'clamp(220px, 45vh, 320px)',
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
        width={700}
        height={320}
        style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}
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
            PRESIONA ESPACIO O CLIC PARA INICIAR
          </p>
        </div>
      )}

      {terminado && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
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
          </p>
          <p className="font-mono text-xs text-gray-400" style={{ zIndex: 1 }}>
            puntos
          </p>
          <p className="font-mono text-xs text-gray-500" style={{ zIndex: 1 }}>
            INTENTO #{intento}
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
  )
}
