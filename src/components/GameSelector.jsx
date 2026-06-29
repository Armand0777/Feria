import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function GameSelector({ config, onStart, onVersus, onTicTacToe }) {
  const [record, setRecord] = useState(null)
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const demoRef = useRef({ x: 40, obs: [], frame: 0 })

  useEffect(() => {
    supabase
      .from('puntajes')
      .select('nombre, puntaje')
      .order('puntaje', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => setRecord(data))
  }, [])

  // Demo animada en el canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const demo = demoRef.current

    const loop = () => {
      frameRef.current = requestAnimationFrame(loop)
      demo.frame++
      ctx.fillStyle = config.jugador.colorFondo || '#09090f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Suelo
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, canvas.height - 18, canvas.width, 18)
      ctx.fillStyle = '#6366f1'
      ctx.fillRect(0, canvas.height - 19, canvas.width, 1.5)

      // Obstáculos demo (no matan)
      if (demo.frame % 80 === 0) {
        const tipos = ['bloque', 'pico']
        demo.obs.push({
          tipo: tipos[Math.floor(Math.random() * tipos.length)],
          x: canvas.width,
          h: 20 + Math.random() * 25,
        })
      }
      demo.obs = demo.obs.filter((o) => o.x > -40)
      demo.obs.forEach((o) => {
        o.x -= 3
        if (o.tipo === 'bloque') {
          ctx.fillStyle = '#a855f7'
          ctx.shadowBlur = 8
          ctx.shadowColor = '#a855f7'
          ctx.beginPath()
          ctx.roundRect(o.x, canvas.height - 18 - o.h, 20, o.h, 3)
          ctx.fill()
        } else {
          ctx.fillStyle = '#f97316'
          ctx.shadowBlur = 8
          ctx.shadowColor = '#f97316'
          ctx.beginPath()
          ctx.moveTo(o.x, canvas.height - 18)
          ctx.lineTo(o.x + 14, canvas.height - 18 - o.h)
          ctx.lineTo(o.x + 28, canvas.height - 18)
          ctx.closePath()
          ctx.fill()
        }
        ctx.shadowBlur = 0
      })

      // Cubo del jugador
      const cubeY = canvas.height - 18 - 22
      ctx.fillStyle = config.jugador.color
      ctx.shadowBlur = 12
      ctx.shadowColor = config.jugador.color
      ctx.beginPath()
      ctx.roundRect(40, cubeY, 22, 22, 4)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [config])

  return (
    <div style={{ background: 'var(--bg)' }}>
      <div style={{ padding: '32px 24px', maxWidth: 480, margin: '0 auto' }}>
        {/* Título */}
        <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>
          GEO<span style={{ color: 'var(--accent2)' }}>RUNNER</span>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, letterSpacing: '.05em' }}>
          Esquiva · Salta · Sobrevive
        </p>

        {/* Preview animado */}
        <canvas
          ref={canvasRef}
          width={432}
          height={90}
          style={{
            width: '100%',
            borderRadius: 10,
            border: '.5px solid var(--border)',
            marginBottom: 20,
          }}
        />

        {/* Jugador actual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: config.jugador.color,
              boxShadow: `0 0 8px ${config.jugador.color}`,
            }}
          />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {config.jugador.nombre || 'Jugador1'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>
            modo: {config.modoInicial || 'cubo'}
          </span>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            className="btn-primary"
            onClick={onStart}
            style={{
              flex: 1,
              padding: '14px 0',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            ▶ JUGAR AHORA
          </button>
          <button
            onClick={onVersus}
            style={{
              padding: '14px 18px',
              background: 'transparent',
              border: '1px solid #f9731644',
              borderRadius: 8,
              color: 'var(--orange)',
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ⚔ VERSUS
          </button>
        </div>

        <button
          onClick={onTicTacToe}
          style={{
            width: '100%',
            padding: '10px 0',
            marginBottom: 16,
            background: 'transparent',
            border: '1px solid var(--border2)',
            borderRadius: 8,
            color: 'var(--muted)',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          ✕○ ESTACIÓN 2 · 3 EN RAYA
        </button>

        {/* Instrucciones */}
        <div className="card-dark" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { key: 'ESPACIO / CLIC', desc: 'Saltar o activar' },
              { key: 'PORTALES', desc: 'Cambian tu modo de juego' },
              { key: 'M', desc: 'Silenciar / activar sonido' },
            ].map(({ key, desc }) => (
              <div
                key={key}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'var(--surface2)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    color: 'var(--accent2)',
                  }}
                >
                  {key}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Récord de la feria */}
        {record && (
          <div
            className="card-dark"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <span className="label-section">RÉCORD DE LA FERIA</span>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>por {record.nombre}</p>
            </div>
            <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--gold)' }}>
              {record.puntaje.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
