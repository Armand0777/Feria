import Icono from './Iconos'

const LOGROS = [
  { id: 'primer_salto', label: 'PRIMER SALTO', req: () => true, color: '#22d3ee' },
  { id: 'superviviente', label: 'SUPERVIVIENTE', req: (p) => p >= 100, color: '#a855f7' },
  { id: 'velocista', label: 'VELOCISTA', req: (p) => p >= 300, color: '#f97316' },
  { id: 'maestro', label: 'MAESTRO', req: (p) => p >= 600, color: '#fbbf24' },
  { id: 'leyenda', label: 'LEYENDA', req: (p) => p >= 1000, color: '#ef4444' },
]

export default function ResultadoFinal({
  config,
  puntaje,
  intentos,
  mejorPuntaje,
  promedio,
  estadoGuardado,
  onReintentarGuardado,
  onJugarDeNuevo,
  onCambiarConfig,
}) {
  const titulo =
    mejorPuntaje >= 600 ? '¡INCREÍBLE!' : mejorPuntaje >= 200 ? '¡BIEN HECHO!' : '¡SIGUE INTENTANDO!'

  const tituloColor =
    mejorPuntaje >= 600 ? 'var(--gold)' : mejorPuntaje >= 200 ? 'var(--accent2)' : 'var(--accent)'

  const mensaje =
    mejorPuntaje < 100
      ? '"La práctica hace al maestro. Los mejores devs también empezaron desde cero."'
      : mejorPuntaje < 300
        ? '"¡Buen inicio! Con esto ya puedes presumir en la feria."'
        : mejorPuntaje < 600
          ? '"¡Excelente! Tienes reflejos de programador."'
          : '"¡Leyenda! Definitivamente tienes lo que se necesita para Ingeniería de Sistemas."'

  return (
    <div style={{ background: 'var(--bg)' }}>
      <div style={{ padding: '28px 24px', maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: tituloColor, marginBottom: 4 }}>
            {titulo}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Sesión de {config.jugador.nombre} · {intentos} intento{intentos !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'MEJOR PUNTAJE', val: mejorPuntaje.toLocaleString(), color: 'var(--gold)' },
            { label: 'INTENTOS', val: intentos, color: 'var(--accent)' },
            { label: 'ÚLTIMO', val: puntaje.toLocaleString(), color: 'var(--text)' },
            { label: 'PROMEDIO', val: promedio.toLocaleString(), color: 'var(--accent2)' },
          ].map(({ label, val, color }) => (
            <div key={label} className="card-dark">
              <span className="label-section">{label}</span>
              <div style={{ fontSize: 28, fontWeight: 900, color }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Logros */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {LOGROS.map((l) => {
            const ok = l.req(mejorPuntaje)
            return (
              <span
                key={l.id}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: `1px solid ${ok ? l.color + '44' : '#ffffff10'}`,
                  background: ok ? `${l.color}10` : 'transparent',
                  color: ok ? l.color : 'var(--muted)',
                }}
              >
                {ok ? l.label : '???'}
              </span>
            )
          })}
        </div>

        {/* Mensaje */}
        <div className="card-dark" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
            {mensaje}
          </p>
        </div>

        {/* Estado del guardado: App guarda automáticamente al salir, una
            sola vez por sesión (el mejor puntaje) */}
        {estadoGuardado === 'guardando' && (
          <div className="card-dark" style={{ marginBottom: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
              Guardando tu puntaje en el ranking…
            </p>
          </div>
        )}
        {estadoGuardado === 'guardado' && (
          <div className="card-dark" style={{ marginBottom: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
              ✓ ¡Puntaje guardado! Tu nombre ya aparece en la pantalla grande.
            </p>
          </div>
        )}
        {estadoGuardado === 'error' && (
          <div
            className="card-dark"
            style={{
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
              No se pudo guardar el puntaje. ¿Hay conexión?
            </p>
            <button className="btn-secondary" onClick={onReintentarGuardado} style={{ padding: '8px 14px' }}>
              Reintentar
            </button>
          </div>
        )}

        {/* Botones finales */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={onJugarDeNuevo} style={{ flex: 1, padding: '12px 0' }}>
            <Icono nombre="play" /> JUGAR DE NUEVO
          </button>
          <button className="btn-secondary" onClick={onCambiarConfig} style={{ padding: '12px 18px' }}>
            <Icono nombre="ajustes" tamano={14} /> Configurar
          </button>
        </div>
      </div>
    </div>
  )
}
