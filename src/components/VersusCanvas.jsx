import { useEffect, useRef } from 'react'
import { EndlessRunnerVersus } from '../games/endlessrunnerVersus'
import { crearReloj, pasosPendientes } from '../lib/pasoFijo'
import { observarResolucion } from '../lib/canvasHD'

// Tamaño lógico del versus (el canvas real puede tener más píxeles)
const ANCHO = 900
const ALTO = 320

// Al terminar, la app pasa directo a la pantalla ResultadoVersus
export default function VersusCanvas({ configJ1, configJ2, onVersusEnd }) {
  const canvasRef = useRef(null)
  const juegoRef = useRef(null)
  const animFrameRef = useRef(null)
  const relojRef = useRef(crearReloj())
  const finEnviadoRef = useRef(false)

  // El bucle se crea una vez por partida: llama siempre al callback vigente
  const onVersusEndRef = useRef(onVersusEnd)
  useEffect(() => {
    onVersusEndRef.current = onVersusEnd
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const juego = new EndlessRunnerVersus(canvas, configJ1, configJ2, { ancho: ANCHO, alto: ALTO })
    juego.reset()
    juego.registrarControles()
    juegoRef.current = juego
    finEnviadoRef.current = false
    relojRef.current = crearReloj()

    const tick = (ahora) => {
      const j = juegoRef.current
      const pasos = pasosPendientes(relojRef.current, ahora)
      for (let i = 0; i < pasos; i++) j.actualizar()
      j.dibujar()

      if (j.terminado) {
        if (!finEnviadoRef.current) {
          finEnviadoRef.current = true
          onVersusEndRef.current({
            ganador: j.ganador,
            puntajeJ1: j.juegoJ1.puntaje,
            puntajeJ2: j.juegoJ2.puntaje,
          })
        }
        return
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      juego.limpiarControles()
    }
  }, [configJ1, configJ2])

  useEffect(() => observarResolucion(canvasRef.current, () => juegoRef.current?.dibujar()), [])

  const xRelativaAlCanvas = (clientX) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return ((clientX - rect.left) / rect.width) * ANCHO
  }

  // Cada dedo cuenta por separado (changedTouches = los toques que empiezan
  // o terminan en este evento): los dos jugadores pueden tocar a la vez
  const onTocar = (e, accion) => {
    e.preventDefault()
    const juego = juegoRef.current
    if (!juego) return
    for (const t of e.changedTouches) accion(juego, xRelativaAlCanvas(t.clientX))
  }

  const presionar = (juego, x) => juego.presionarEnPosicion(x)
  const soltar = (juego, x) => juego.soltarEnPosicion(x)

  return (
    <div className="mx-auto w-full">
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          // Siempre en proporción 900:320; se limita por el alto de la
          // pantalla dejando lugar a los botones grandes de abajo (190px)
          width: 'min(100%, max(320px, calc((100dvh - 190px) * 900 / 320)))',
          aspectRatio: '900 / 320',
          background: '#0a0a1a',
          border: '1px solid #6366f1',
          boxShadow: '0 0 16px #6366f133',
          borderRadius: 12,
        }}
      >
        <canvas
          ref={canvasRef}
          width={ANCHO}
          height={ALTO}
          style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer', touchAction: 'none' }}
          onMouseDown={(e) => juegoRef.current?.presionarEnPosicion(xRelativaAlCanvas(e.clientX))}
          onMouseUp={(e) => juegoRef.current?.soltarEnPosicion(xRelativaAlCanvas(e.clientX))}
          onTouchStart={(e) => onTocar(e, presionar)}
          onTouchEnd={(e) => onTocar(e, soltar)}
          onTouchCancel={(e) => onTocar(e, soltar)}
        />
      </div>

      {/* Botones grandes redundantes — control 100% táctil, sin teclado */}
      <div className="mt-3 flex gap-3">
        {[
          { config: configJ1, texto: 'J1 SALTAR', presionar: 'presionarJ1', soltar: 'soltarJ1' },
          { config: configJ2, texto: 'J2 SALTAR', presionar: 'presionarJ2', soltar: 'soltarJ2' },
        ].map((b) => (
          <button
            key={b.texto}
            onMouseDown={() => juegoRef.current?.[b.presionar]()}
            onMouseUp={() => juegoRef.current?.[b.soltar]()}
            onTouchStart={(e) => {
              e.preventDefault()
              juegoRef.current?.[b.presionar]()
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              juegoRef.current?.[b.soltar]()
            }}
            className="btn flex-1 select-none"
            style={{
              padding: 'clamp(14px,4vw,20px) 0',
              fontSize: 'clamp(14px,3vw,18px)',
              background: `${b.config.jugador.color}14`,
              border: `2px solid ${b.config.jugador.color}`,
              borderRadius: 10,
              color: b.config.jugador.color,
              touchAction: 'none',
            }}
          >
            ▲ {b.texto}
          </button>
        ))}
      </div>
    </div>
  )
}
