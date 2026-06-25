import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const MEDALLAS = {
  0: { texto: '1°', color: '#facc15' },
  1: { texto: '2°', color: '#cbd5e1' },
  2: { texto: '3°', color: '#fb923c' },
}

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
    <div className="w-full rounded-lg bg-slate-800 p-6 text-white">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
        <span>🏆</span> Ranking en vivo
      </h2>

      {cargando ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : puntajes.length === 0 ? (
        <p className="text-sm text-gray-400">Aún no hay puntajes. ¡Sé el primero!</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {puntajes.map((p, i) => {
            const medalla = MEDALLAS[i]
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded-md px-3 py-2 ${
                  medalla ? 'bg-slate-700' : 'bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 font-bold"
                    style={{ color: medalla ? medalla.color : '#94a3b8' }}
                  >
                    {medalla ? medalla.texto : `${i + 1}°`}
                  </span>
                  <span
                    className="h-3 w-3 rounded-full border border-white/30"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="font-medium">{p.nombre}</span>
                </div>
                <span className="font-mono font-bold">{p.puntaje}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
