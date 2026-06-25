import { useRef, useEffect } from 'react'
import { MODOS } from '../games/endlessrunner'

export default function ConfigPanel({ config, onConfigChange }) {
  const previewRef = useRef(null)
  const frameRef = useRef(null)
  const rotRef = useRef(0)

  // Preview animado del cubo
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const loop = () => {
      frameRef.current = requestAnimationFrame(loop)
      rotRef.current += 0.02
      ctx.clearRect(0, 0, 100, 100)
      ctx.fillStyle = '#09090f'
      ctx.fillRect(0, 0, 100, 100)
      ctx.save()
      ctx.translate(50, 50)
      ctx.rotate(rotRef.current)
      ctx.fillStyle = config.jugador.color
      ctx.shadowBlur = 16
      ctx.shadowColor = config.jugador.color
      ctx.beginPath()
      ctx.roundRect(-16, -16, 32, 32, 5)
      ctx.fill()
      ctx.strokeStyle = '#ffffff30'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-12, -12)
      ctx.lineTo(12, 12)
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.restore()
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [config.jugador.color])

  const set = (path, val) => {
    const [section, key] = path.split('.')
    onConfigChange({ ...config, [section]: { ...config[section], [key]: val } })
  }

  return (
    <div style={{ background: 'var(--bg)' }}>
      <div
        style={{
          padding: '24px',
          maxWidth: 480,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Preview + Nombre */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <canvas
            ref={previewRef}
            width={100}
            height={100}
            style={{ borderRadius: 10, border: '.5px solid var(--border)', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <label className="label-section">NOMBRE</label>
            <input
              type="text"
              value={config.jugador.nombre}
              maxLength={15}
              onChange={(e) => set('jugador.nombre', e.target.value)}
              style={{ width: '100%', marginBottom: 10 }}
              placeholder="Tu nombre aquí"
            />
            <label className="label-section">COLOR DEL CUBO</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={config.jugador.color}
                onChange={(e) => set('jugador.color', e.target.value)}
              />
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>
                {config.jugador.color}
              </span>
            </div>
          </div>
        </div>

        {/* Color de fondo */}
        <div>
          <label className="label-section">COLOR DE FONDO</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              type="color"
              value={config.jugador.colorFondo}
              onChange={(e) => set('jugador.colorFondo', e.target.value)}
            />
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>
              {config.jugador.colorFondo}
            </span>
          </div>
          {/* Presets */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['#09090f', '#0f172a', '#030712', '#0d0d2b', '#0a0a00', '#0f0a1a'].map((c) => (
              <div
                key={c}
                onClick={() => set('jugador.colorFondo', c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: c,
                  cursor: 'pointer',
                  border:
                    config.jugador.colorFondo === c
                      ? '2px solid var(--accent)'
                      : '.5px solid var(--border2)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Sliders */}
        {[
          { label: 'VELOCIDAD', path: 'juego.velocidadInicial', min: 3, max: 8, step: 1 },
          { label: 'GRAVEDAD', path: 'juego.gravedad', min: 0.3, max: 0.8, step: 0.1 },
        ].map(({ label, path, min, max, step }) => {
          const [sec, key] = path.split('.')
          const val = config[sec][key]
          return (
            <div key={path}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="label-section" style={{ margin: 0 }}>
                  {label}
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--accent)',
                  }}
                >
                  {Number(val).toFixed(step < 1 ? 1 : 0)}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={val}
                onChange={(e) => set(path, parseFloat(e.target.value))}
              />
              {label === 'GRAVEDAD' && (
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  {val <= 0.4
                    ? 'Saltos altos y lentos'
                    : val <= 0.6
                      ? 'Equilibrado (recomendado)'
                      : 'Caída rápida · modo difícil'}
                </p>
              )}
            </div>
          )
        })}

        {/* Selector de modo */}
        <div>
          <label className="label-section">MODO INICIAL</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {Object.values(MODOS).map((m) => (
              <button
                key={m.id}
                onClick={() => onConfigChange({ ...config, modoInicial: m.id })}
                style={{
                  background: config.modoInicial === m.id ? `${m.color}15` : 'var(--surface2)',
                  border:
                    config.modoInicial === m.id
                      ? `1.5px solid ${m.color}`
                      : '.5px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 16 }}>{m.icono}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: config.modoInicial === m.id ? m.color : 'var(--muted)',
                  }}
                >
                  {m.nombre.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: 'var(--muted)',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}
                >
                  {m.descripcion}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
