import { useEffect, useRef } from 'react'
import { MODOS, NIVELES, dibujarForma } from '../games/endlessrunner'
import { contextoHD } from '../lib/canvasHD'

// Encuadre de cada modo dentro de un lienzo lógico de 72×72, con el
// personaje a su tamaño real del juego (36). Algunas formas se salen de su
// caja (la estela de la nave, la antena del robot) y se corren un poco.
const LIENZO = 72
const DESPLAZAMIENTO = {
  nave: { x: 12, y: 0 },
  ola: { x: 10, y: 0 },
  robot: { x: 0, y: 10 },
}

// El personaje de cada modo, dibujado con el mismo código que usa el juego
export function IconoModo({ modo, tamano = 28, color }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = contextoHD(ref.current, LIENZO, LIENZO)
    const d = DESPLAZAMIENTO[modo] ?? { x: 0, y: 0 }
    ctx.clearRect(0, 0, LIENZO, LIENZO)
    dibujarForma(ctx, modo, 18 + d.x, 18 + d.y, 36, 36, color ?? MODOS[modo].color, 0)
  }, [modo, color])

  return <canvas ref={ref} width={LIENZO} height={LIENZO} style={{ width: tamano, height: tamano }} aria-hidden="true" />
}

// Botón-tarjeta común a todos los selectores
function Opcion({ seleccionado, color, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={seleccionado}
      className="flex flex-col items-center gap-1 rounded-lg transition-colors"
      style={{
        padding: '8px 6px',
        background: seleccionado ? `${color}1a` : 'var(--surface2)',
        border: `1px solid ${seleccionado ? color : 'var(--border)'}`,
        boxShadow: seleccionado ? `0 0 12px ${color}33` : 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function Nombre({ seleccionado, color, children }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '.04em',
        color: seleccionado ? color : 'var(--muted)',
      }}
    >
      {children}
    </span>
  )
}

export function SelectorModo({ valor, onCambiar, conDescripcion = false }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Object.values(MODOS).map((m) => {
        const sel = valor === m.id
        return (
          <Opcion key={m.id} seleccionado={sel} color={m.color} onClick={() => onCambiar(m.id)}>
            <IconoModo modo={m.id} />
            <Nombre seleccionado={sel} color={m.color}>
              {m.nombre.toUpperCase()}
            </Nombre>
            {conDescripcion && (
              <span style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.3 }}>
                {m.descripcion}
              </span>
            )}
          </Opcion>
        )
      })}
    </div>
  )
}

export function SelectorNivel({ valor, onCambiar }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {Object.values(NIVELES).map((n) => {
        const sel = (valor || 'facil') === n.id
        return (
          <Opcion key={n.id} seleccionado={sel} color={n.color} onClick={() => onCambiar(n)}>
            <span
              className="rounded-full"
              style={{ width: 10, height: 10, margin: '3px 0', background: n.color, boxShadow: `0 0 8px ${n.color}` }}
            />
            <Nombre seleccionado={sel} color={n.color}>
              {n.nombre.toUpperCase()}
            </Nombre>
          </Opcion>
        )
      })}
    </div>
  )
}
