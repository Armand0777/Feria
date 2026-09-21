import Icono from './Iconos'

export default function TicTacToeSelector({ onIniciar, onVolver }) {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>
        3 EN <span style={{ color: 'var(--accent2)' }}>RAYA</span>
      </h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Estación 2 — un descanso rápido</p>

      <div className="card-dark" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <button className="btn-primary btn-lg" onClick={() => onIniciar('cpu')}>
          VS MÁQUINA
        </button>
        <button className="btn-accent btn-lg" onClick={() => onIniciar('2p')}>
          VS 2 JUGADORES
        </button>
      </div>

      <button className="btn-secondary" onClick={onVolver} style={{ width: '100%' }}>
        <Icono nombre="volver" tamano={14} /> VOLVER AL MENÚ
      </button>
    </div>
  )
}
