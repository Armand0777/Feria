import { useEffect, useRef, useState } from 'react'
import { MODOS } from '../games/endlessrunner'

const defaultJ1 = {
  jugador: { nombre: 'Jugador 1', color: '#6366f1', colorFondo: '#0a0a1a' },
  juego: { velocidadInicial: 5, gravedad: 0.55, altoDeSalto: -13 },
  modoInicial: 'cubo',
}

const defaultJ2 = {
  jugador: { nombre: 'Jugador 2', color: '#f97316', colorFondo: '#0a0a1a' },
  juego: { velocidadInicial: 5, gravedad: 0.55, altoDeSalto: -13 },
  modoInicial: 'cubo',
}

function PreviewCubo({ color }) {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const rotacionRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const dibujar = () => {
      rotacionRef.current += 0.02
      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const cx = canvas.width / 2
      const cy = canvas.height / 2
      const lado = 32

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rotacionRef.current)
      ctx.shadowBlur = 14
      ctx.shadowColor = color
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(-lado / 2, -lado / 2, lado, lado, 5)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-lado / 2, -lado / 2)
      ctx.lineTo(lado / 2, lado / 2)
      ctx.stroke()
      ctx.restore()

      frameRef.current = requestAnimationFrame(dibujar)
    }
    frameRef.current = requestAnimationFrame(dibujar)
    return () => cancelAnimationFrame(frameRef.current)
  }, [color])

  return (
    <canvas
      ref={canvasRef}
      width={80}
      height={80}
      style={{ borderRadius: 8, background: '#0a0a1a' }}
    />
  )
}

function ColumnaJugador({ titulo, controles, colorBorde, config, onChange }) {
  const actualizarJugador = (campo, valor) => {
    onChange({ ...config, jugador: { ...config.jugador, [campo]: valor } })
  }

  return (
    <div
      className="flex flex-1 flex-col items-center gap-3 p-5"
      style={{ background: '#0f172a', border: `1px solid ${colorBorde}`, borderRadius: 12 }}
    >
      <h3 className="font-mono font-bold" style={{ color: colorBorde }}>
        {titulo}
      </h3>
      <p className="font-mono text-xs text-gray-400">Controles: {controles}</p>

      <PreviewCubo color={config.jugador.color} />

      <label className="flex w-full flex-col gap-1">
        <span className="font-mono text-xs text-gray-400">Nombre</span>
        <input
          type="text"
          value={config.jugador.nombre}
          maxLength={15}
          onChange={(e) => actualizarJugador('nombre', e.target.value)}
          className="rounded-md px-3 py-2 font-mono text-white"
          style={{ background: '#1e293b', border: '1px solid #334155' }}
        />
      </label>

      <label className="flex w-full flex-col gap-1">
        <span className="font-mono text-xs text-gray-400">Color del personaje</span>
        <input
          type="color"
          value={config.jugador.color}
          onChange={(e) => actualizarJugador('color', e.target.value)}
          className="cursor-pointer border-none"
          style={{ width: 44, height: 44 }}
        />
      </label>

      <div className="flex w-full flex-col gap-2">
        <span className="font-mono text-xs text-gray-400">Modo inicial</span>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(MODOS).map((modo) => {
            const seleccionado = config.modoInicial === modo.id
            return (
              <button
                key={modo.id}
                type="button"
                onClick={() => onChange({ ...config, modoInicial: modo.id })}
                className="flex flex-col items-center gap-1 rounded-md p-1.5"
                style={{
                  border: seleccionado ? `2px solid ${modo.color}` : '1px solid #334155',
                  background: seleccionado ? `${modo.color}26` : '#1e293b',
                }}
              >
                <span style={{ fontSize: 16 }}>{modo.icono}</span>
                <span className="font-mono text-[10px] font-bold text-white">{modo.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function VersusSelector({ onIniciar, onVolver }) {
  const [configJ1, setConfigJ1] = useState(defaultJ1)
  const [configJ2, setConfigJ2] = useState(defaultJ2)

  const listo = configJ1.jugador.nombre.trim() !== '' && configJ2.jugador.nombre.trim() !== ''

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col items-stretch gap-4 md:flex-row">
        <ColumnaJugador
          titulo="JUGADOR 1"
          controles="W / ESPACIO"
          colorBorde="#6366f1"
          config={configJ1}
          onChange={setConfigJ1}
        />

        <div className="flex items-center justify-center px-2">
          <span className="font-mono text-3xl font-bold text-gray-500">VS</span>
        </div>

        <ColumnaJugador
          titulo="JUGADOR 2"
          controles="↑ FLECHA"
          colorBorde="#f97316"
          config={configJ2}
          onChange={setConfigJ2}
        />
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={onVolver}
          className="font-mono font-bold text-white"
          style={{
            background: 'transparent',
            border: '1px solid #475569',
            borderRadius: 8,
            padding: '12px 24px',
            cursor: 'pointer',
          }}
        >
          ← VOLVER
        </button>

        <button
          type="button"
          disabled={!listo}
          onClick={() => onIniciar(configJ1, configJ2)}
          className="font-mono font-bold text-white"
          style={{
            background: listo ? '#6366f1' : '#334155',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontSize: 16,
            cursor: listo ? 'pointer' : 'not-allowed',
            opacity: listo ? 1 : 0.6,
          }}
        >
          ⚔ ¡COMENZAR VERSUS!
        </button>
      </div>
    </div>
  )
}
