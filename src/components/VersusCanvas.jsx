import { useEffect, useRef, useState } from 'react'
import { EndlessRunnerVersus } from '../games/endlessrunnerVersus'

export default function VersusCanvas({ configJ1, configJ2, onVersusEnd }) {
  const canvasRef = useRef(null)
  const confetiCanvasRef = useRef(null)
  const juegoRef = useRef(null)
  const animFrameRef = useRef(null)
  const tickRef = useRef(null)
  const finEnviadoRef = useRef(false)

  const [terminado, setTerminado] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const juego = new EndlessRunnerVersus(canvas, configJ1, configJ2)
    juego.reset()
    juego.registrarControles()
    juegoRef.current = juego
    finEnviadoRef.current = false
    setTerminado(false)
    setResultado(null)

    const tick = () => {
      const j = juegoRef.current
      j.actualizar()
      j.dibujar()

      if (j.terminado) {
        const res = {
          ganador: j.ganador,
          puntajeJ1: j.juegoJ1.puntaje,
          puntajeJ2: j.juegoJ2.puntaje,
        }
        setResultado(res)
        setTerminado(true)
        if (!finEnviadoRef.current) {
          finEnviadoRef.current = true
          onVersusEnd(res)
        }
        return
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    tickRef.current = tick
    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      juego.limpiarControles()
    }
  }, [configJ1, configJ2])

  useEffect(() => {
    if (!terminado || !resultado) return
    const canvas = confetiCanvasRef.current
    const ctx = canvas.getContext('2d')

    const colorGanador =
      resultado.ganador === 'j1'
        ? configJ1.jugador.color
        : resultado.ganador === 'j2'
          ? configJ2.jugador.color
          : '#94a3b8'

    const colores = [colorGanador, '#ffffff', '#fbbf24']
    const confeti = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height,
      vy: 1.5 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 1.5,
      size: 3 + Math.random() * 4,
      color: colores[Math.floor(Math.random() * colores.length)],
    }))

    let raf
    const animar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const c of confeti) {
        c.y += c.vy
        c.x += c.vx
        if (c.y > canvas.height) c.y = -10
        ctx.fillStyle = c.color
        ctx.fillRect(c.x, c.y, c.size, c.size)
      }
      raf = requestAnimationFrame(animar)
    }
    raf = requestAnimationFrame(animar)

    return () => cancelAnimationFrame(raf)
  }, [terminado, resultado, configJ1.jugador.color, configJ2.jugador.color])

  const reiniciar = () => {
    const juego = juegoRef.current
    juego.reset()
    juego.registrarControles()
    finEnviadoRef.current = false
    setTerminado(false)
    setResultado(null)
    animFrameRef.current = requestAnimationFrame(tickRef.current)
  }

  const salir = () => {
    if (resultado) onVersusEnd(resultado)
  }

  const xRelativaAlCanvas = (clientX) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return ((clientX - rect.left) / rect.width) * canvas.width
  }

  const onCanvasPresionar = (e) => {
    const juego = juegoRef.current
    if (!juego) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    juego.presionarEnPosicion(xRelativaAlCanvas(clientX))
  }

  const onCanvasSoltar = (e) => {
    const juego = juegoRef.current
    if (!juego) return
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
    juego.soltarEnPosicion(xRelativaAlCanvas(clientX))
  }

  const nombreGanador =
    resultado?.ganador === 'j1'
      ? configJ1.jugador.nombre
      : resultado?.ganador === 'j2'
        ? configJ2.jugador.nombre
        : null

  const colorGanador =
    resultado?.ganador === 'j1'
      ? configJ1.jugador.color
      : resultado?.ganador === 'j2'
        ? configJ2.jugador.color
        : '#94a3b8'

  const puntajeGanador =
    resultado?.ganador === 'j1'
      ? resultado.puntajeJ1
      : resultado?.ganador === 'j2'
        ? resultado.puntajeJ2
        : null

  return (
    <div className="mx-auto w-full">
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: '900 / 320',
          minHeight: 'clamp(220px, 45vh, 320px)',
          background: '#0a0a1a',
          border: '1px solid #6366f1',
          boxShadow: '0 0 16px #6366f133',
          borderRadius: 12,
        }}
      >
      <canvas
        ref={canvasRef}
        width={900}
        height={320}
        style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}
        onMouseDown={onCanvasPresionar}
        onMouseUp={onCanvasSoltar}
        onTouchStart={(e) => {
          e.preventDefault()
          onCanvasPresionar(e)
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          onCanvasSoltar(e)
        }}
      />

      {terminado && resultado && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4"
          style={{ background: 'rgba(10,10,26,0.93)' }}
        >
          <canvas
            ref={confetiCanvasRef}
            width={900}
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

          {resultado.ganador === 'empate' ? (
            <>
              <p
                className="font-mono font-bold"
                style={{ fontSize: 'clamp(24px, 6vw, 40px)', color: '#94a3b8', zIndex: 1 }}
              >
                EMPATE
              </p>
              <p className="text-sm text-gray-400" style={{ zIndex: 1 }}>
                ¡Los dos llegaron lejos!
              </p>
            </>
          ) : (
            <>
              <p
                className="font-mono font-bold"
                style={{
                  fontSize: 'clamp(20px, 5vw, 32px)',
                  color: colorGanador,
                  textShadow: `0 0 20px ${colorGanador}88`,
                  zIndex: 1,
                }}
              >
                ¡GANÓ {nombreGanador?.toUpperCase()}!
              </p>
              <p className="text-sm text-gray-400" style={{ zIndex: 1 }}>
                con {puntajeGanador} puntos
              </p>
            </>
          )}

          <div className="mt-2 flex flex-wrap justify-center gap-6 sm:gap-12" style={{ zIndex: 1 }}>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs text-gray-400">{configJ1.jugador.nombre}</span>
              <span
                className="font-mono font-bold"
                style={{
                  fontSize: resultado.ganador === 'j1' ? 'clamp(20px,5vw,32px)' : 20,
                  color: resultado.ganador === 'j1' ? '#fbbf24' : 'white',
                }}
              >
                {resultado.puntajeJ1}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs text-gray-400">{configJ2.jugador.nombre}</span>
              <span
                className="font-mono font-bold"
                style={{
                  fontSize: resultado.ganador === 'j2' ? 'clamp(20px,5vw,32px)' : 20,
                  color: resultado.ganador === 'j2' ? '#fbbf24' : 'white',
                }}
              >
                {resultado.puntajeJ2}
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap justify-center gap-3 px-4" style={{ zIndex: 1 }}>
            <button
              onClick={reiniciar}
              className="font-mono font-bold text-white"
              style={{
                background: '#6366f1',
                border: 'none',
                borderRadius: 8,
                padding: 'clamp(8px,3vw,12px) clamp(16px,5vw,28px)',
                cursor: 'pointer',
              }}
            >
              ↺ REVANCHA
            </button>
            <button
              onClick={salir}
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

      {/* Botones grandes redundantes — control 100% táctil, sin teclado */}
      <div className="mt-3 flex gap-3">
        <button
          onMouseDown={() => juegoRef.current?.presionarJ1()}
          onMouseUp={() => juegoRef.current?.soltarJ1()}
          onTouchStart={(e) => {
            e.preventDefault()
            juegoRef.current?.presionarJ1()
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            juegoRef.current?.soltarJ1()
          }}
          className="flex-1 select-none font-mono font-bold text-white"
          style={{
            padding: 'clamp(14px,4vw,20px) 0',
            fontSize: 'clamp(14px,3vw,18px)',
            background: 'transparent',
            border: `2px solid ${configJ1.jugador.color}`,
            borderRadius: 10,
            color: configJ1.jugador.color,
            cursor: 'pointer',
            touchAction: 'none',
          }}
        >
          ▲ J1 SALTAR
        </button>
        <button
          onMouseDown={() => juegoRef.current?.presionarJ2()}
          onMouseUp={() => juegoRef.current?.soltarJ2()}
          onTouchStart={(e) => {
            e.preventDefault()
            juegoRef.current?.presionarJ2()
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            juegoRef.current?.soltarJ2()
          }}
          className="flex-1 select-none font-mono font-bold text-white"
          style={{
            padding: 'clamp(14px,4vw,20px) 0',
            fontSize: 'clamp(14px,3vw,18px)',
            background: 'transparent',
            border: `2px solid ${configJ2.jugador.color}`,
            borderRadius: 10,
            color: configJ2.jugador.color,
            cursor: 'pointer',
            touchAction: 'none',
          }}
        >
          ▲ J2 SALTAR
        </button>
      </div>
    </div>
  )
}
