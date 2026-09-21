import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { contextoHD } from '../lib/canvasHD'
import Icono from './Iconos'
import CodigoQR from './CodigoQR'

// Tamaño lógico de la demo animada
const DEMO_W = 432
const DEMO_H = 90

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
    const ctx = contextoHD(canvas, DEMO_W, DEMO_H)
    const demo = demoRef.current

    const loop = () => {
      frameRef.current = requestAnimationFrame(loop)
      demo.frame++
      ctx.fillStyle = config.jugador.colorFondo || '#09090f'
      ctx.fillRect(0, 0, DEMO_W, DEMO_H)

      // Suelo
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, DEMO_H - 18, DEMO_W, 18)
      ctx.fillStyle = '#6366f1'
      ctx.fillRect(0, DEMO_H - 19, DEMO_W, 1.5)

      // Obstáculos demo (no matan)
      if (demo.frame % 80 === 0) {
        const tipos = ['bloque', 'pico']
        demo.obs.push({
          tipo: tipos[Math.floor(Math.random() * tipos.length)],
          x: DEMO_W,
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
          ctx.roundRect(o.x, DEMO_H - 18 - o.h, 20, o.h, 3)
          ctx.fill()
        } else {
          ctx.fillStyle = '#f97316'
          ctx.shadowBlur = 8
          ctx.shadowColor = '#f97316'
          ctx.beginPath()
          ctx.moveTo(o.x, DEMO_H - 18)
          ctx.lineTo(o.x + 14, DEMO_H - 18 - o.h)
          ctx.lineTo(o.x + 28, DEMO_H - 18)
          ctx.closePath()
          ctx.fill()
        }
        ctx.shadowBlur = 0
      })

      // Cubo del jugador
      const cubeY = DEMO_H - 18 - 22
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
          {config.control && config.control !== 'teclado' && (
            <span style={{ fontSize: 11, color: 'var(--accent2)', fontWeight: 700 }}>
              🧠 control con IA: {config.control}
            </span>
          )}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <button className="btn-primary btn-lg" onClick={onStart} style={{ flex: 1 }}>
            <Icono nombre="play" /> JUGAR AHORA
          </button>
          <button className="btn-accent btn-lg" onClick={onVersus}>
            <Icono nombre="versus" /> VERSUS
          </button>
        </div>

        <button className="btn-secondary" onClick={onTicTacToe} style={{ width: '100%', marginBottom: 16 }}>
          <Icono nombre="cuadricula" tamano={14} /> ESTACIÓN 2 · 3 EN RAYA
        </button>

        {/* Instrucciones */}
        <div className="card-dark" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { key: 'ESPACIO / CLIC', desc: 'Saltar o activar' },
              { key: 'PORTALES', desc: 'Cambian tu modo de juego' },
              { key: 'P / ESC', desc: 'Pausar la partida' },
              { key: 'M', desc: 'Silenciar / activar sonido' },
            ].map(({ key, desc }) => (
              <div
                key={key}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
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

        <div style={{ marginTop: 16 }}>
          <CodigoQR flotante={false} tamano={72} />
        </div>
      </div>
    </div>
  )
}
