import { useEffect, useState } from 'react'

const LINEAS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function calcularResultado(tablero) {
  for (const linea of LINEAS) {
    const [a, b, c] = linea
    if (tablero[a] && tablero[a] === tablero[b] && tablero[a] === tablero[c]) {
      return { ganador: tablero[a], linea }
    }
  }
  if (tablero.every((c) => c !== null)) return { ganador: 'empate', linea: [] }
  return null
}

// CPU simple: gana si puede, bloquea si hace falta, si no centro o al azar
function jugadaCPU(tablero) {
  const vacios = tablero.map((v, i) => (v === null ? i : null)).filter((i) => i !== null)

  for (const linea of LINEAS) {
    const valores = linea.map((i) => tablero[i])
    if (valores.filter((v) => v === 'O').length === 2 && valores.includes(null)) {
      return linea[valores.indexOf(null)]
    }
  }
  for (const linea of LINEAS) {
    const valores = linea.map((i) => tablero[i])
    if (valores.filter((v) => v === 'X').length === 2 && valores.includes(null)) {
      return linea[valores.indexOf(null)]
    }
  }
  if (tablero[4] === null) return 4

  return vacios[Math.floor(Math.random() * vacios.length)]
}

export default function TicTacToe({ modo, onVolver }) {
  const [tablero, setTablero] = useState(Array(9).fill(null))
  const [turno, setTurno] = useState('X')
  const [resultado, setResultado] = useState(null)
  const [marcador, setMarcador] = useState({ X: 0, O: 0, empates: 0 })

  useEffect(() => {
    if (resultado) {
      setMarcador((m) => ({
        X: m.X + (resultado.ganador === 'X' ? 1 : 0),
        O: m.O + (resultado.ganador === 'O' ? 1 : 0),
        empates: m.empates + (resultado.ganador === 'empate' ? 1 : 0),
      }))
    }
  }, [resultado])

  // Turno de la CPU (siempre juega 'O')
  useEffect(() => {
    if (modo !== 'cpu' || turno !== 'O' || resultado) return
    const t = setTimeout(() => {
      const indice = jugadaCPU(tablero)
      jugar(indice, 'O')
    }, 450)
    return () => clearTimeout(t)
  }, [turno, modo, resultado, tablero])

  const jugar = (indice, jugador) => {
    if (tablero[indice] !== null) return
    const nuevoTablero = [...tablero]
    nuevoTablero[indice] = jugador
    setTablero(nuevoTablero)

    const res = calcularResultado(nuevoTablero)
    if (res) {
      setResultado(res)
    } else {
      setTurno(jugador === 'X' ? 'O' : 'X')
    }
  }

  const onCelda = (indice) => {
    if (resultado || tablero[indice] !== null) return
    if (modo === 'cpu' && turno !== 'X') return
    jugar(indice, turno)
  }

  const reiniciar = () => {
    setTablero(Array(9).fill(null))
    setTurno('X')
    setResultado(null)
  }

  const colorDe = (jugador) => (jugador === 'X' ? 'var(--accent2)' : 'var(--orange)')

  const textoResultado = () => {
    if (!resultado) return null
    if (resultado.ganador === 'empate') return '¡EMPATE!'
    if (modo === 'cpu') return resultado.ganador === 'X' ? '¡GANASTE!' : 'GANÓ LA MÁQUINA'
    return `¡GANÓ ${resultado.ganador}!`
  }

  return (
    <div style={{ maxWidth: 360, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
        3 EN <span style={{ color: 'var(--accent2)' }}>RAYA</span>
      </h1>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
        {modo === 'cpu' ? 'Tú (X) vs Máquina (O)' : 'Jugador X vs Jugador O'}
      </p>

      {/* Marcador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent2)' }}>X: {marcador.X}</span>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Empates: {marcador.empates}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)' }}>O: {marcador.O}</span>
      </div>

      {/* Turno actual */}
      {!resultado && (
        <p style={{ textAlign: 'center', fontSize: 13, marginBottom: 12, color: colorDe(turno) }}>
          Turno de {modo === 'cpu' && turno === 'O' ? 'la máquina' : turno}
        </p>
      )}

      {/* Tablero */}
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 20,
        }}
      >
        {tablero.map((valor, i) => (
          <button
            key={i}
            onClick={() => onCelda(i)}
            disabled={!!resultado || valor !== null}
            className="card-dark"
            style={{
              aspectRatio: '1',
              fontSize: 36,
              fontWeight: 900,
              color: valor ? colorDe(valor) : 'var(--muted)',
              cursor: resultado || valor ? 'default' : 'pointer',
              background: resultado?.linea?.includes(i) ? 'var(--surface2)' : 'var(--surface)',
              boxShadow: resultado?.linea?.includes(i) ? `0 0 12px ${colorDe(valor)}` : 'none',
            }}
          >
            {valor}
          </button>
        ))}

        {resultado && (
          <div
            className="card-dark"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              background: 'rgba(10,10,26,0.92)',
            }}
          >
            <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)' }}>{textoResultado()}</p>
            <button className="btn-primary" onClick={reiniciar} style={{ padding: '10px 24px' }}>
              ↺ JUGAR DE NUEVO
            </button>
          </div>
        )}
      </div>

      <button className="btn-secondary" onClick={onVolver} style={{ width: '100%', padding: '10px 0' }}>
        ← VOLVER AL MENÚ
      </button>
    </div>
  )
}
