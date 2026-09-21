import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const COLOR_PUESTO = ['#fbbf24', '#cbd5e1', '#fb923c']

export default function Ranking() {
  const [puntajes, setPuntajes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarPuntajes = async () => {
      const { data } = await supabase
        .from('puntajes')
        .select('*')
        .order('puntaje', { ascending: false })
        .limit(10)

      setPuntajes(data ?? [])
      setCargando(false)
    }

    cargarPuntajes()

    const canal = supabase
      .channel('puntajes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'puntajes' },
        (payload) => {
          setPuntajes((prev) =>
            [...prev, payload.new].sort((a, b) => b.puntaje - a.puntaje).slice(0, 10),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  return (
    <div className="card-dark w-full" style={{ padding: 18 }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="label-section" style={{ margin: 0 }}>
          Ranking de la feria
        </span>
        <span
          className="flex items-center gap-1.5"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: 'var(--success)' }}
        >
          <span className="punto-vivo" /> EN VIVO
        </span>
      </div>

      {cargando ? (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Cargando…</p>
      ) : puntajes.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Aún no hay puntajes. ¡Sé el primero!</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {puntajes.map((p, i) => (
            <li
              key={p.id}
              className="grid items-center gap-3 rounded-md px-3 py-2"
              style={{
                gridTemplateColumns: '28px 10px 1fr auto',
                background: i < 3 ? 'var(--surface2)' : 'transparent',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 800,
                  color: COLOR_PUESTO[i] ?? 'var(--muted)',
                }}
              >
                {i + 1}°
              </span>
              <span
                className="rounded-full"
                style={{ width: 10, height: 10, background: p.color, boxShadow: `0 0 6px ${p.color}` }}
              />
              <span className="truncate" style={{ fontSize: 14, fontWeight: i < 3 ? 700 : 500 }}>
                {p.nombre}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>
                {p.puntaje.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
