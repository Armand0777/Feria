export default function TicTacToeSelector({ onIniciar, onVolver }) {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>
        3 EN <span style={{ color: 'var(--accent2)' }}>RAYA</span>
      </h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Estación 2 — un descanso rápido</p>

      <div className="card-dark" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <button
          className="btn-primary"
          onClick={() => onIniciar('cpu')}
          style={{ padding: '14px 0', fontSize: 15 }}
        >
          🤖 VS MÁQUINA
        </button>
        <button
          onClick={() => onIniciar('2p')}
          style={{
            padding: '14px 0',
            background: 'transparent',
            border: '1px solid #f9731644',
            borderRadius: 8,
            color: 'var(--orange)',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          👥 VS 2 JUGADORES
        </button>
      </div>

      <button className="btn-secondary" onClick={onVolver} style={{ width: '100%', padding: '10px 0' }}>
        ← VOLVER AL MENÚ
      </button>
    </div>
  )
}
