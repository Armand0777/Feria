import { useEffect, useRef, useState } from 'react'
import { MODOS, NIVELES } from '../games/endlessrunner'
import { contextoHD } from '../lib/canvasHD'
import Icono from './Iconos'

const defaultJ1 = {
  jugador: { nombre: 'Jugador 1', color: '#6366f1', colorFondo: '#0a0a1a' },
  juego: { velocidadInicial: 5, gravedad: 0.55, altoDeSalto: -9.5 },
  modoInicial: 'cubo',
  nivel: 'facil',
}

const defaultJ2 = {
  jugador: { nombre: 'Jugador 2', color: '#f97316', colorFondo: '#0a0a1a' },
  juego: { velocidadInicial: 5, gravedad: 0.55, altoDeSalto: -9.5 },
  modoInicial: 'cubo',
  nivel: 'facil',
}

function PreviewCubo({ color }) {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const rotacionRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = contextoHD(canvas, 80, 80)

    const dibujar = () => {
      rotacionRef.current += 0.02
      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(0, 0, 80, 80)

      const cx = 40
      const cy = 40
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
      style={{ width: 80, height: 80, borderRadius: 8, background: '#0a0a1a' }}
    />
  )
}

function ColumnaJugador({ titulo, controles, colorBorde, config, onChange }) {
  const actualizarJugador = (campo, valor) => {
    onChange({ ...config, jugador: { ...config.jugador, [campo]: valor } })
  }

  return (
    <div
      className="card-dark flex flex-1 flex-col gap-4"
      style={{ padding: 20, borderTop: `3px solid ${colorBorde}` }}
    >
      <div className="flex items-center justify-between">
        <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '.06em', color: colorBorde }}>{titulo}</h3>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent2)',
            background: 'var(--surface2)',
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {controles}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <PreviewCubo color={config.jugador.color} />
        <div className="flex flex-1 flex-col gap-3">
          <label className="flex flex-col">
            <span className="label-section">Nombre</span>
            <input
              type="text"
              value={config.jugador.nombre}
              maxLength={15}
              onChange={(e) => actualizarJugador('nombre', e.target.value)}
              style={{ width: '100%' }}
            />
          </label>
          <label className="flex items-center gap-3">
            <input
              type="color"
              value={config.jugador.color}
              onChange={(e) => actualizarJugador('color', e.target.value)}
            />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Color del personaje</span>
          </label>
        </div>
      </div>

      <div className="flex w-full flex-col">
        <span className="label-section">Modo inicial</span>
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

      <div className="flex w-full flex-col">
        <span className="label-section">Nivel de dificultad</span>
        <div className="grid grid-cols-4 gap-2">
          {Object.values(NIVELES).map((n) => {
            const seleccionado = (config.nivel || 'facil') === n.id
            return (
              <button
                key={n.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...config,
                    nivel: n.id,
                    juego: { ...config.juego, velocidadInicial: n.velocidadInicial },
                  })
                }
                className="flex flex-col items-center gap-1 rounded-md p-1.5"
                style={{
                  border: seleccionado ? `2px solid ${n.color}` : '1px solid #334155',
                  background: seleccionado ? `${n.color}26` : '#1e293b',
                }}
              >
                <span style={{ fontSize: 14 }}>{n.icono}</span>
                <span className="font-mono text-[10px] font-bold text-white">{n.nombre}</span>
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="text-center">
        <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
          MODO <span style={{ color: 'var(--orange)' }}>VERSUS</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
          Dos jugadores en la misma pantalla · gana quien sobreviva más
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-4 md:flex-row">
        <ColumnaJugador
          titulo="JUGADOR 1"
          controles="W / ESPACIO"
          colorBorde="#6366f1"
          config={configJ1}
          onChange={setConfigJ1}
        />

        <div className="flex items-center justify-center px-2">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color: '#475569' }}>VS</span>
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
        <button type="button" onClick={onVolver} className="btn-secondary btn-lg">
          <Icono nombre="volver" /> VOLVER
        </button>

        <button
          type="button"
          disabled={!listo}
          onClick={() => onIniciar(configJ1, configJ2)}
          className="btn-primary btn-lg"
        >
          <Icono nombre="versus" /> ¡COMENZAR VERSUS!
        </button>
      </div>
    </div>
  )
}
