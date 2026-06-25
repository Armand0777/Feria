import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import './RankingTV.css'

const MENSAJES = [
  '¡Escanea el QR y únete a la feria!',
  '¿Puedes superar el récord?',
  'Ingeniería de Sistemas — Universidad',
  '¡Tú también puedes crear esto!',
]

function tiempoTranscurrido(fechaIso) {
  const segundos = Math.floor((Date.now() - new Date(fechaIso).getTime()) / 1000)
  if (segundos < 60) return 'hace instantes'
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  return `hace ${horas} h`
}

function inicioDeHoy() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return hoy.toISOString()
}

export default function RankingTV() {
  const [puntajes, setPuntajes] = useState([])
  const [jugadoresHoy, setJugadoresHoy] = useState(0)
  const [mensajeIndex, setMensajeIndex] = useState(0)
  const [, setTick] = useState(0)
  const filaNuevaIdRef = useRef(null)
  const [filaNuevaId, setFilaNuevaId] = useState(null)

  const cargarDatos = async () => {
    const { data } = await supabase
      .from('puntajes')
      .select('*')
      .order('puntaje', { ascending: false })
      .limit(10)

    setPuntajes(data ?? [])

    const { count } = await supabase
      .from('puntajes')
      .select('*', { count: 'exact', head: true })
      .gte('creado_en', inicioDeHoy())

    setJugadoresHoy(count ?? 0)
  }

  useEffect(() => {
    document.body.classList.add('overflow-hidden')

    cargarDatos()

    const canal = supabase
      .channel('ranking-tv')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'puntajes' },
        (payload) => {
          const nuevo = payload.new

          setPuntajes((prev) =>
            [...prev, nuevo].sort((a, b) => b.puntaje - a.puntaje).slice(0, 10),
          )
          setJugadoresHoy((prev) => prev + 1)

          filaNuevaIdRef.current = nuevo.id
          setFilaNuevaId(nuevo.id)
          setTimeout(() => {
            if (filaNuevaIdRef.current === nuevo.id) setFilaNuevaId(null)
          }, 1000)
        },
      )
      .subscribe()

    const intervaloRefresco = setInterval(cargarDatos, 30000)
    const intervaloMensaje = setInterval(() => {
      setMensajeIndex((i) => (i + 1) % MENSAJES.length)
    }, 5000)
    const intervaloTick = setInterval(() => setTick((t) => t + 1), 30000)

    return () => {
      document.body.classList.remove('overflow-hidden')
      supabase.removeChannel(canal)
      clearInterval(intervaloRefresco)
      clearInterval(intervaloMensaje)
      clearInterval(intervaloTick)
    }
  }, [])

  const filas = [...puntajes]
  while (filas.length < 10) filas.push(null)

  const estiloPosicion = (i) => {
    if (i === 0) return { fontSize: 28, fontWeight: 900, color: '#fbbf24' }
    if (i === 1) return { fontSize: 22, fontWeight: 900, color: '#94a3b8' }
    if (i === 2) return { fontSize: 20, fontWeight: 900, color: '#b45309' }
    return { fontSize: 16, fontWeight: 700, color: '#64748b' }
  }

  const textoPosicion = (i) => {
    if (i === 0) return '1°'
    if (i === 1) return '2°'
    if (i === 2) return '3°'
    return `${i + 1}°`
  }

  return (
    <div
      className="pagina-tv flex flex-col"
      style={{ background: '#09090f', color: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Cabecera */}
      <header
        className="flex flex-col items-center justify-center gap-1"
        style={{ height: '15vh', background: '#111118', borderBottom: '.5px solid #ffffff0f' }}
      >
        <h1
          className="flex items-center gap-3"
          style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc' }}
        >
          <span>🏆</span> RANKING EN VIVO
        </h1>
        <p style={{ fontSize: 14, color: '#64748b' }}>Endless Runner — Estación 1</p>
        <p style={{ fontFamily: 'monospace', fontSize: 14, color: '#6366f1' }}>
          {jugadoresHoy} jugadores hoy
        </p>
      </header>

      {/* Cuerpo principal */}
      <main
        className="flex flex-col justify-center gap-1 px-12"
        style={{ height: '70vh', background: '#09090f' }}
      >
        {filas.map((p, i) => {
          const estiloPos = estiloPosicion(i)
          if (!p) {
            return (
              <div
                key={`vacio-${i}`}
                className="flex items-center gap-6 rounded-lg px-6"
                style={{ padding: '12px 0', borderBottom: '.5px solid #ffffff05', color: '#475569' }}
              >
                <span style={{ ...estiloPos, width: 80 }}>{textoPosicion(i)}</span>
                <span style={{ fontSize: 14 }}>--- Sin jugador ---</span>
              </div>
            )
          }

          return (
            <div
              key={p.id}
              className={`flex items-center gap-6 rounded-lg px-6 ${
                filaNuevaId === p.id ? 'fila-nueva' : ''
              }`}
              style={{ padding: '12px 0', borderBottom: '.5px solid #ffffff05' }}
            >
              <span style={{ ...estiloPos, width: 80 }}>{textoPosicion(i)}</span>

              <span
                style={{
                  borderRadius: '50%',
                  width: 12,
                  height: 12,
                  backgroundColor: p.color,
                  boxShadow: `0 0 8px ${p.color}`,
                }}
              />

              <span
                className="flex-1"
                style={{ fontSize: estiloPos.fontSize, fontWeight: 600, color: '#f8fafc' }}
              >
                {p.nombre}
              </span>

              <span style={{ fontSize: 13, color: '#64748b' }}>{tiempoTranscurrido(p.creado_en)}</span>

              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 900,
                  fontSize: estiloPos.fontSize + 8,
                  color: '#f8fafc',
                  minWidth: 120,
                  textAlign: 'right',
                }}
              >
                {p.puntaje}
              </span>
            </div>
          )
        })}
      </main>

      {/* Pie de página */}
      <footer
        className="flex flex-col items-center justify-center gap-3 px-8"
        style={{ height: '15vh', background: '#111118' }}
      >
        <p style={{ fontSize: 12, letterSpacing: '.06em', color: '#64748b' }}>
          {MENSAJES[mensajeIndex]}
        </p>
        <div className="h-1.5 w-80 overflow-hidden rounded-full" style={{ background: '#1a1a24' }}>
          <div key={mensajeIndex} className="barra-progreso h-full rounded-full" style={{ background: '#6366f1' }} />
        </div>
      </footer>
    </div>
  )
}
