const FONDO_GRID = {
  backgroundColor: '#0a0a1a',
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
  backgroundSize: '40px 40px',
}

function obtenerMensaje(diferencia) {
  if (diferencia < 50) return '¡Qué partido tan parejo! La revancha es obligatoria.'
  if (diferencia <= 200) return 'Buen juego para ambos. ¿Se animan a otra ronda?'
  return '¡Aplastante victoria! El perdedor pide revancha.'
}

export default function ResultadoVersus({ resultado, onRevancha, onMenuPrincipal }) {
  if (!resultado) return null

  const {
    ganador,
    puntajeJ1,
    puntajeJ2,
    nombreJ1,
    nombreJ2,
    colorJ1,
    colorJ2,
  } = resultado

  const esEmpate = ganador === 'empate'
  const colorGanador = ganador === 'j1' ? colorJ1 : ganador === 'j2' ? colorJ2 : '#94a3b8'
  const nombreGanador = ganador === 'j1' ? nombreJ1 : ganador === 'j2' ? nombreJ2 : null
  const diferencia = Math.abs(puntajeJ1 - puntajeJ2)

  return (
    <div className="w-full p-8" style={{ ...FONDO_GRID, borderRadius: 12 }}>
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span style={{ fontSize: 64, color: colorGanador }}>🏆</span>
        <h1
          className="font-mono font-bold"
          style={{ fontSize: 28, color: colorGanador, textShadow: `0 0 16px ${colorGanador}88` }}
        >
          {esEmpate ? 'EMPATE' : `¡${nombreGanador?.toUpperCase()} GANA!`}
        </h1>
      </div>

      <table className="mb-6 w-full text-center font-mono text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <td className="p-2 text-gray-500"></td>
            <td className="p-2 font-bold" style={{ color: colorJ1 }}>
              {nombreJ1}
            </td>
            <td className="p-2 font-bold" style={{ color: colorJ2 }}>
              {nombreJ2}
            </td>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: ganador === 'j1' ? `${colorJ1}26` : 'transparent' }}>
            <td className="p-2 text-left text-gray-400">Puntaje</td>
            <td className="p-2 text-white">{puntajeJ1}</td>
            <td className="p-2 text-white">{puntajeJ2}</td>
          </tr>
          <tr>
            <td className="p-2 text-left text-gray-400">Resultado</td>
            <td className="p-2" style={{ background: ganador === 'j1' ? `${colorJ1}26` : 'transparent' }}>
              {esEmpate ? 'EMPATE' : ganador === 'j1' ? '🏆 GANADOR' : 'PERDEDOR'}
            </td>
            <td className="p-2" style={{ background: ganador === 'j2' ? `${colorJ2}26` : 'transparent' }}>
              {esEmpate ? 'EMPATE' : ganador === 'j2' ? '🏆 GANADOR' : 'PERDEDOR'}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mb-6 text-center text-sm italic text-gray-300">{obtenerMensaje(diferencia)}</p>

      <div className="flex justify-center gap-3">
        <button
          onClick={onRevancha}
          className="font-mono font-bold text-white"
          style={{ background: '#6366f1', border: 'none', borderRadius: 8, padding: '12px 28px', cursor: 'pointer' }}
        >
          ⚔ REVANCHA
        </button>
        <button
          onClick={onMenuPrincipal}
          className="font-mono font-bold text-white"
          style={{ background: 'transparent', border: '1px solid #475569', borderRadius: 8, padding: '12px 28px', cursor: 'pointer' }}
        >
          🏠 MENÚ PRINCIPAL
        </button>
      </div>
    </div>
  )
}
